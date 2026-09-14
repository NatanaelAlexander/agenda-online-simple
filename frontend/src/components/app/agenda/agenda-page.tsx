"use client";

import * as React from "react";
import { Clock, User, X, ChevronRight } from "lucide-react";
import type { DateRange, DayButtonProps } from "react-day-picker";
import {
  listAppointments,
  type Appointment,
} from "@/components/app/api/appointments";
import { AgendaAppointmentModal } from "@/components/app/agenda/agenda-appointment-modal";
import {
  listBusinesses,
  listBusinessSchedules,
  setBusinessSchedules,
  updateBusiness,
  type Business,
  type BusinessSchedule,
} from "@/components/app/api/businesses";
import {
  createScheduleException,
  deleteScheduleException,
  listScheduleExceptions,
  type ScheduleException,
} from "@/components/app/api/professionals";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import {
  formatDateTime,
  formatDayLabel,
  formatTime,
  toDateInputValue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DayMarkers = {
  pending: boolean;
  accepted: boolean;
  cancelled: boolean;
};

function emptyMarkers(): DayMarkers {
  return { pending: false, accepted: false, cancelled: false };
}

function markersFromAppointments(items: Appointment[]): Map<string, DayMarkers> {
  const map = new Map<string, DayMarkers>();
  for (const appt of items) {
    const key = toDateInputValue(new Date(appt.startsAt));
    const cur = map.get(key) ?? emptyMarkers();
    if (appt.statusCode === "pending") cur.pending = true;
    else if (
      appt.statusCode === "confirmed" ||
      appt.statusCode === "attended"
    ) {
      cur.accepted = true;
    } else if (appt.statusCode === "cancelled") cur.cancelled = true;
    map.set(key, cur);
  }
  return map;
}

function monthFetchRange(month: Date): { from: Date; to: Date } {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  from.setDate(from.getDate() - 7);
  from.setHours(0, 0, 0, 0);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  to.setDate(to.getDate() + 7);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function resolveRangeBounds(range: DateRange | undefined): {
  from: Date;
  to: Date;
} | null {
  if (!range?.from) return null;
  const from = startOfDay(range.from);
  const to = startOfDay(range.to ?? range.from);
  return from <= to ? { from, to } : { from: to, to: from };
}

function formatRangeLabel(range: DateRange | undefined): string {
  const bounds = resolveRangeBounds(range);
  if (!bounds) return "—";
  const fromKey = toDateInputValue(bounds.from);
  const toKey = toDateInputValue(bounds.to);
  if (fromKey === toKey) return formatDayLabel(fromKey);
  return `${formatDayLabel(fromKey)} → ${formatDayLabel(toKey)}`;
}

function groupAppointmentsByDay(
  items: Appointment[],
): Array<{ dayKey: string; items: Appointment[] }> {
  const map = new Map<string, Appointment[]>();
  for (const appt of items) {
    const key = toDateInputValue(new Date(appt.startsAt));
    const list = map.get(key) ?? [];
    list.push(appt);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, dayItems]) => ({
      dayKey,
      items: dayItems.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    }));
}

const WEEK_DAYS = [
  { weekday: 1, label: "Lun", full: "Lunes" },
  { weekday: 2, label: "Mar", full: "Martes" },
  { weekday: 3, label: "Mié", full: "Miércoles" },
  { weekday: 4, label: "Jue", full: "Jueves" },
  { weekday: 5, label: "Vie", full: "Viernes" },
  { weekday: 6, label: "Sáb", full: "Sábado" },
  { weekday: 0, label: "Dom", full: "Domingo" },
] as const;

type DayDraft = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

function emptyWeek(): Record<number, DayDraft> {
  const draft: Record<number, DayDraft> = {};
  for (const day of WEEK_DAYS) {
    draft[day.weekday] = {
      enabled: false,
      startTime: "09:00",
      endTime: "18:00",
    };
  }
  return draft;
}

function schedulesToDraft(
  schedules: BusinessSchedule[],
): Record<number, DayDraft> {
  const draft = emptyWeek();
  for (const item of schedules) {
    draft[item.weekday] = {
      enabled: true,
      startTime: item.startTime.slice(0, 5),
      endTime: item.endTime.slice(0, 5),
    };
  }
  return draft;
}

export function AgendaPage() {
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [draft, setDraft] = React.useState<Record<number, DayDraft>>(emptyWeek);
  const [maxPerSlot, setMaxPerSlot] = React.useState("1");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [exceptions, setExceptions] = React.useState<ScheduleException[]>([]);
  const [exceptionDate, setExceptionDate] = React.useState(
    toDateInputValue(new Date()),
  );
  const [exceptionReason, setExceptionReason] = React.useState("");
  const [savingException, setSavingException] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRange>(() => {
    const d = startOfDay(new Date());
    return { from: d, to: d };
  });
  const [queryRange, setQueryRange] = React.useState<DateRange>(() => {
    const d = startOfDay(new Date());
    return { from: d, to: d };
  });
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [monthMarkers, setMonthMarkers] = React.useState<
    Map<string, DayMarkers>
  >(() => new Map());
  const [dayAppointments, setDayAppointments] = React.useState<Appointment[]>(
    [],
  );
  const [loadingDay, setLoadingDay] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    React.useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const dragSelecting = React.useRef(false);
  const dragAnchor = React.useRef<Date | null>(null);
  const selectedRangeRef = React.useRef(selectedRange);
  selectedRangeRef.current = selectedRange;

  const today = React.useMemo(() => startOfDay(new Date()), []);

  const rangeBounds = React.useMemo(
    () => resolveRangeBounds(queryRange),
    [queryRange],
  );

  const appointmentsByDay = React.useMemo(
    () => groupAppointmentsByDay(dayAppointments),
    [dayAppointments],
  );

  const isMultiDay =
    !!rangeBounds &&
    toDateInputValue(rangeBounds.from) !== toDateInputValue(rangeBounds.to);

  function commitRange(range: DateRange) {
    const next = {
      from: startOfDay(range.from!),
      to: startOfDay(range.to ?? range.from!),
    };
    setSelectedRange(next);
    setQueryRange(next);
  }

  const openWeekdays = React.useMemo(() => {
    const set = new Set<number>();
    for (const day of WEEK_DAYS) {
      if (draft[day.weekday]?.enabled) set.add(day.weekday);
    }
    return set;
  }, [draft]);

  const closedExceptionDates = React.useMemo(() => {
    return new Set(
      exceptions.filter((e) => e.isClosed).map((e) => e.exceptionDate),
    );
  }, [exceptions]);

  function isClosedDay(date: Date): boolean {
    const key = toDateInputValue(date);
    if (closedExceptionDates.has(key)) return true;
    if (openWeekdays.size === 0) return true;
    return !openWeekdays.has(date.getDay());
  }

  const reloadAgenda = React.useCallback(async (biz: Business) => {
    const [schedules, ex] = await Promise.all([
      listBusinessSchedules(biz.id),
      listScheduleExceptions({ businessId: biz.id, pageSize: 100 }),
    ]);
    setDraft(schedulesToDraft(schedules));
    setExceptions(
      ex.items.filter((e) => e.isClosed && e.professionalId == null),
    );
    setMaxPerSlot(String(biz.maxBookingsPerSlot ?? 1));
  }, []);

  React.useEffect(() => {
    listBusinesses({ pageSize: 1 })
      .then(async (res) => {
        const first = res.items[0];
        if (!first) return;
        setBusiness(first);
        await reloadAgenda(first);
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar la agenda",
        );
      })
      .finally(() => setLoading(false));
  }, [reloadAgenda]);

  React.useEffect(() => {
    if (!business) return;
    const { from, to } = monthFetchRange(visibleMonth);
    let cancelled = false;
    listAppointments({
      businessId: business.id,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      page: 1,
      pageSize: 200,
    })
      .then((res) => {
        if (!cancelled) setMonthMarkers(markersFromAppointments(res.items));
      })
      .catch(() => {
        if (!cancelled) setMonthMarkers(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [business, visibleMonth]);

  React.useEffect(() => {
    if (!business || !rangeBounds) return;
    setLoadingDay(true);
    listAppointments({
      businessId: business.id,
      dateFrom: rangeBounds.from.toISOString(),
      dateTo: endOfDay(rangeBounds.to).toISOString(),
      page: 1,
      pageSize: 200,
    })
      .then((res) => {
        setDayAppointments(
          [...res.items].sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          ),
        );
      })
      .catch(() => setDayAppointments([]))
      .finally(() => setLoadingDay(false));
  }, [business, rangeBounds]);

  const dragRaf = React.useRef(0);
  const pendingDragRange = React.useRef<DateRange | null>(null);

  function scheduleDragRange(range: DateRange) {
    pendingDragRange.current = range;
    selectedRangeRef.current = range;
    if (dragRaf.current) return;
    dragRaf.current = requestAnimationFrame(() => {
      dragRaf.current = 0;
      const next = pendingDragRange.current;
      if (next) setSelectedRange(next);
    });
  }

  React.useEffect(() => {
    function endDrag() {
      if (!dragSelecting.current) return;
      dragSelecting.current = false;
      dragAnchor.current = null;
      if (dragRaf.current) {
        cancelAnimationFrame(dragRaf.current);
        dragRaf.current = 0;
      }
      const current = pendingDragRange.current ?? selectedRangeRef.current;
      if (current?.from) {
        const next = {
          from: startOfDay(current.from),
          to: startOfDay(current.to ?? current.from),
        };
        setSelectedRange(next);
        setQueryRange(next);
      }
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      if (dragRaf.current) cancelAnimationFrame(dragRaf.current);
    };
  }, []);

  const AgendaDayButton = React.useCallback(
    (props: DayButtonProps) => {
      const date = startOfDay(props.day.date);
      const markers = monthMarkers.get(toDateInputValue(date));
      const showIcons =
        markers &&
        (markers.pending || markers.accepted || markers.cancelled);
      const closed = isClosedDay(date);
      const isPast = date < today;

      return (
        <CalendarDayButton
          {...props}
          className={cn(
            "gap-0 select-none touch-manipulation sm:gap-0.5",
            closed &&
              !props.modifiers.selected &&
              !props.modifiers.range_middle &&
              "opacity-40",
            props.className,
          )}
          onPointerDown={(e) => {
            if (isPast) return;
            // En touch, DayPicker maneja el clic (más fluido). Drag solo con mouse.
            if (e.pointerType === "touch") return;
            e.preventDefault();
            dragSelecting.current = true;
            dragAnchor.current = date;
            scheduleDragRange({ from: date, to: date });
          }}
          onPointerEnter={() => {
            if (!dragSelecting.current || !dragAnchor.current) return;
            if (isPast) return;
            const a = dragAnchor.current;
            const b = date;
            scheduleDragRange(
              a <= b ? { from: a, to: b } : { from: b, to: a },
            );
          }}
        >
          {props.children}
          {showIcons ? (
            <span
              className="flex items-center justify-center gap-0.5"
              aria-hidden
            >
              {markers.pending ? (
                <Clock
                  className="size-2 shrink-0 text-sky-500 sm:size-2.5"
                  strokeWidth={2.5}
                />
              ) : null}
              {markers.accepted ? (
                <User
                  className="size-2 shrink-0 text-emerald-500 sm:size-2.5"
                  strokeWidth={2.5}
                />
              ) : null}
              {markers.cancelled ? (
                <X
                  className="size-2 shrink-0 text-red-500 sm:size-2.5"
                  strokeWidth={2.5}
                />
              ) : null}
            </span>
          ) : (
            <span className="hidden h-2.5 w-full sm:block" aria-hidden />
          )}
        </CalendarDayButton>
      );
    },
    [monthMarkers, today, openWeekdays, closedExceptionDates],
  );

  React.useEffect(() => {
    if (!configOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [configOpen]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!business) return;
    const max = Number(maxPerSlot);
    if (!Number.isFinite(max) || max < 1 || max > 50) {
      toast.error("Cupos por horario: entre 1 y 50");
      return;
    }

    const schedules = WEEK_DAYS.filter((d) => draft[d.weekday]?.enabled).map(
      (d) => ({
        weekday: d.weekday,
        startTime: draft[d.weekday].startTime,
        endTime: draft[d.weekday].endTime,
      }),
    );

    setSaving(true);
    try {
      await setBusinessSchedules({ businessId: business.id, schedules });
      const updated = await updateBusiness({
        id: business.id,
        maxBookingsPerSlot: max,
      });
      setBusiness(updated);
      toast.success("Agenda guardada");
      setConfigOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddException(event: React.FormEvent) {
    event.preventDefault();
    if (!business) return;
    setSavingException(true);
    try {
      await createScheduleException({
        businessId: business.id,
        exceptionDate,
        isClosed: true,
        reason: exceptionReason.trim() || null,
      });
      const ex = await listScheduleExceptions({
        businessId: business.id,
        pageSize: 100,
      });
      setExceptions(
        ex.items.filter((e) => e.isClosed && e.professionalId == null),
      );
      setExceptionReason("");
      toast.success("Día cerrado agregado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo agregar",
      );
    } finally {
      setSavingException(false);
    }
  }

  async function handleDeleteException(id: string) {
    try {
      await deleteScheduleException(id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
      toast.success("Excepción eliminada");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo eliminar",
      );
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          Agenda
        </h1>
        <p className="text-sm text-muted-foreground">
          Vista previa como la ven tus clientes.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !business ? (
        <p className="text-sm text-muted-foreground">No hay negocio configurado.</p>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-base">Vista previa pública</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="sm:hidden">
                    Gris = cerrado. Arrastra para varios días.
                  </span>
                  <span className="hidden sm:inline">
                    Así se ven los días disponibles afuera (gris = cerrado).
                    Mantén pulsado y arrastra para ver varios días a la vez.
                  </span>
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 w-fit shrink-0"
                onClick={() => setConfigOpen(true)}
              >
                Modificar agenda
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 px-0 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
              <div className="min-w-0 w-full sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-5">
                <Calendar
                  mode="range"
                  required
                  month={visibleMonth}
                  onMonthChange={setVisibleMonth}
                  selected={selectedRange}
                  onSelect={(range) => {
                    if (!range?.from) return;
                    if (dragSelecting.current) return;
                    commitRange(range);
                  }}
                  disabled={(date) => startOfDay(date) < today}
                  components={{ DayButton: AgendaDayButton }}
                  className={cn(
                    "w-full min-w-0 p-0",
                    "[--cell-size:auto]",
                    "sm:[--cell-size:--spacing(12)] md:[--cell-size:--spacing(13)]",
                  )}
                  classNames={{
                    month_grid: "w-full",
                    weekdays: "flex w-full",
                    weekday:
                      "flex flex-1 items-center justify-center text-[0.7rem] font-medium text-muted-foreground sm:text-[0.8rem]",
                    week: "mt-0.5 flex w-full sm:mt-2",
                    day: "group/day relative flex flex-1 aspect-square items-center justify-center p-0 text-center",
                  }}
                />
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 px-4 text-[11px] text-muted-foreground sm:mt-3 sm:px-0">
                  <li className="inline-flex items-center gap-1">
                    <Clock className="size-3 text-sky-500" strokeWidth={2.5} />
                    Pendiente
                  </li>
                  <li className="inline-flex items-center gap-1">
                    <User
                      className="size-3 text-emerald-500"
                      strokeWidth={2.5}
                    />
                    Confirmada
                  </li>
                  <li className="inline-flex items-center gap-1">
                    <X className="size-3 text-red-500" strokeWidth={2.5} />
                    Cancelada
                  </li>
                </ul>
              </div>

              <div className="flex min-w-0 flex-col gap-3 px-4 sm:px-0">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {isMultiDay ? "Citas del período" : "Citas del día"}
                  </p>
                  <p className="font-heading text-base font-semibold sm:text-lg">
                    {formatRangeLabel(selectedRange)}
                  </p>
                  {!isMultiDay &&
                  rangeBounds &&
                  isClosedDay(rangeBounds.from) ? (
                    <p className="text-sm text-muted-foreground">
                      Día cerrado / sin atención
                    </p>
                  ) : null}
                </div>

                {loadingDay ? (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : dayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isMultiDay
                      ? "No hay citas en estos días."
                      : "No hay citas este día."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {appointmentsByDay.map((group) => (
                      <div key={group.dayKey} className="flex flex-col gap-2">
                        {isMultiDay ? (
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {formatDayLabel(group.dayKey)}
                          </p>
                        ) : null}
                        <ul className="flex flex-col gap-2">
                          {group.items.map((a) => (
                            <li key={a.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAppointment(a);
                                  setDetailOpen(true);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/40 sm:px-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium tabular-nums">
                                      {formatTime(a.startsAt)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {a.statusName}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 truncate text-muted-foreground">
                                    {a.clientName}
                                    {" · "}
                                    {a.serviceName ?? "Por definir"}
                                  </p>
                                  {isMultiDay ? (
                                    <p className="text-xs text-muted-foreground">
                                      {formatDateTime(a.startsAt)}
                                    </p>
                                  ) : null}
                                </div>
                                <ChevronRight
                                  className="size-4 shrink-0 text-muted-foreground"
                                  aria-hidden
                                />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <AgendaAppointmentModal
            open={detailOpen}
            appointment={selectedAppointment}
            onClose={() => {
              setDetailOpen(false);
              setSelectedAppointment(null);
            }}
            onChanged={(updated) => {
              setDayAppointments((prev) => {
                const next = prev.map((item) =>
                  item.id === updated.id ? updated : item,
                );
                const key = toDateInputValue(new Date(updated.startsAt));
                const dayItems = next.filter(
                  (item) =>
                    toDateInputValue(new Date(item.startsAt)) === key,
                );
                const markers = markersFromAppointments(dayItems).get(key);
                setMonthMarkers((map) => {
                  const copy = new Map(map);
                  if (markers) copy.set(key, markers);
                  else copy.delete(key);
                  return copy;
                });
                return next;
              });
              setSelectedAppointment(updated);
            }}
          />

          {configOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="agenda-config-title"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label="Cerrar"
                onClick={() => setConfigOpen(false)}
              />
              <div className="relative z-10 flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:max-h-[90dvh] sm:rounded-2xl">
                <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                  <h2
                    id="agenda-config-title"
                    className="font-heading text-lg font-semibold tracking-tight"
                  >
                    Configuración
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfigOpen(false)}
                  >
                    Cerrar
                  </Button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                  <form className="flex flex-col gap-4" onSubmit={handleSave}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex max-w-xs flex-col gap-1.5">
                        <Label htmlFor="max-slot">
                          Máx. clientes por horario
                        </Label>
                        <Input
                          id="max-slot"
                          type="number"
                          min={1}
                          max={50}
                          value={maxPerSlot}
                          onChange={(e) => setMaxPerSlot(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button type="submit" disabled={saving} size="sm">
                        {saving ? "Guardando…" : "Guardar agenda"}
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <th className="px-3 py-2 font-medium">Día</th>
                            <th className="px-3 py-2 font-medium">Abierto</th>
                            <th className="px-3 py-2 font-medium">Desde</th>
                            <th className="px-3 py-2 font-medium">Hasta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {WEEK_DAYS.map((day) => {
                            const row = draft[day.weekday];
                            return (
                              <tr
                                key={day.weekday}
                                className="border-b border-border/60 last:border-0"
                              >
                                <td className="px-3 py-2 font-medium">
                                  <span className="sm:hidden">
                                    {day.label}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {day.full}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    className="size-4 accent-primary"
                                    checked={row.enabled}
                                    aria-label={`Abrir ${day.full}`}
                                    onChange={(e) =>
                                      setDraft((prev) => ({
                                        ...prev,
                                        [day.weekday]: {
                                          ...prev[day.weekday],
                                          enabled: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                </td>
                                <td className="px-3 py-1.5">
                                  <Input
                                    type="time"
                                    className="h-8 w-[7.5rem]"
                                    disabled={!row.enabled}
                                    value={row.startTime}
                                    onChange={(e) =>
                                      setDraft((prev) => ({
                                        ...prev,
                                        [day.weekday]: {
                                          ...prev[day.weekday],
                                          startTime: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </td>
                                <td className="px-3 py-1.5">
                                  <Input
                                    type="time"
                                    className="h-8 w-[7.5rem]"
                                    disabled={!row.enabled}
                                    value={row.endTime}
                                    onChange={(e) =>
                                      setDraft((prev) => ({
                                        ...prev,
                                        [day.weekday]: {
                                          ...prev[day.weekday],
                                          endTime: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </form>

                  <div className="mt-4 border-t border-border pt-3">
                    <p className="mb-2 text-sm font-medium">Días cerrados</p>
                    <form
                      className="mb-2 grid gap-2 sm:grid-cols-[minmax(0,9rem)_1fr_auto]"
                      onSubmit={handleAddException}
                    >
                      <Input
                        type="date"
                        value={exceptionDate}
                        onChange={(e) => setExceptionDate(e.target.value)}
                        required
                      />
                      <Input
                        placeholder="Motivo (opcional)"
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={savingException}
                      >
                        Agregar
                      </Button>
                    </form>
                    {exceptions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Sin días cerrados.
                      </p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {exceptions.map((ex) => (
                          <li
                            key={ex.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs"
                          >
                            <span>
                              {ex.exceptionDate}
                              {ex.reason ? ` · ${ex.reason}` : ""}
                            </span>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Quitar"
                              onClick={() => void handleDeleteException(ex.id)}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
