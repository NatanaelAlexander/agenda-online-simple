"use client";

import * as React from "react";
import {
  createAppointment,
} from "@/components/app/api/appointments";
import {
  portalGetCatalog,
  type PortalCatalog,
} from "@/components/app/api/businesses";
import { createClient } from "@/components/app/api/clients";
import { portalSlots, normalizePortalSlots, type PortalSlot } from "@/components/app/api/portal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import {
  formatPriceCents,
  formatTime,
  toDateInputValue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  open: boolean;
  businessId: string;
  businessSlug: string;
  businessName: string;
  onClose: () => void;
  onCreated: () => void;
};

export function InternalBookingModal({
  open,
  businessId,
  businessSlug,
  businessName,
  onClose,
  onCreated,
}: Props) {
  const [catalog, setCatalog] = React.useState<PortalCatalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = React.useState(false);
  const [serviceId, setServiceId] = React.useState<string | null>(null);
  const [professionalId, setProfessionalId] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slots, setSlots] = React.useState<PortalSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [slotsOpen, setSlotsOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoadingCatalog(true);
    setServiceId(null);
    setProfessionalId(null);
    setSelectedSlot(null);
    setSlots([]);
    setSlotsOpen(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setNotes("");
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);

    portalGetCatalog(businessSlug)
      .then(setCatalog)
      .catch((error) => {
        setCatalog(null);
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar la agenda",
        );
      })
      .finally(() => setLoadingCatalog(false));
  }, [open, businessSlug]);

  const professionals = catalog?.professionals ?? [];

  const selectedService = catalog?.services.find((s) => s.id === serviceId);
  const selectedProfessional = professionals.find((p) => p.id === professionalId);

  const openWeekdays = React.useMemo(() => {
    if (!catalog?.schedules?.length) return null;
    return new Set(catalog.schedules.map((s) => s.weekday));
  }, [catalog]);

  const dateKey = toDateInputValue(selectedDate);

  function isExceptionClosed(date: Date): boolean {
    if (!catalog) return false;
    const key = toDateInputValue(date);
    const forDay = catalog.exceptions.filter(
      (e) => e.exceptionDate === key && e.isClosed,
    );
    if (forDay.some((e) => e.professionalId == null)) return true;
    if (
      professionalId &&
      forDay.some((e) => e.professionalId === professionalId)
    ) {
      return true;
    }
    return false;
  }

  function isClosedDay(date: Date): boolean {
    if (isExceptionClosed(date)) return true;
    if (!openWeekdays) return false;
    if (openWeekdays.size === 0) return true;
    return !openWeekdays.has(date.getDay());
  }

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  React.useEffect(() => {
    if (!openWeekdays || openWeekdays.size === 0) return;
    if (!isClosedDay(selectedDate)) return;
    const cursor = new Date(today);
    for (let i = 0; i < 60; i++) {
      if (!isClosedDay(cursor)) {
        setSelectedDate(new Date(cursor));
        setSelectedSlot(null);
        return;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when pro/schedule changes
  }, [openWeekdays, today]);

  React.useEffect(() => {
    if (!open || !slotsOpen || !serviceId || !professionalId || !dateKey) {
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSelectedSlot(null);
    portalSlots({
      businessSlug,
      serviceId,
      professionalId,
      date: dateKey,
    })
      .then((res) => {
        if (!cancelled) setSlots(normalizePortalSlots(res.slots));
      })
      .catch((error) => {
        if (!cancelled) {
          setSlots([]);
          toast.error(
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar horarios",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, businessSlug, serviceId, professionalId, dateKey, slotsOpen]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (!serviceId || !professionalId || !selectedSlot) {
      toast.error("Elige servicio, profesional y horario");
      return;
    }
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) {
      toast.error("Indica nombre y apellido del cliente");
      return;
    }

    setCreating(true);
    try {
      const client = await createClient({
        businessId,
        fullName: `${first} ${last}`.replace(/\s+/g, " ").trim(),
        email: email.trim() || null,
      });
      await createAppointment({
        businessId,
        serviceId,
        professionalId,
        clientId: client.id,
        startsAt: selectedSlot,
        notes: notes.trim() || null,
        statusCode: "confirmed",
      });
      toast.success("Cita agendada");
      onCreated();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo agendar",
      );
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="internal-booking-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:max-h-[92dvh] sm:rounded-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id="internal-booking-title"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              Nueva cita
            </h2>
            <p className="text-sm text-muted-foreground">{businessName}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5">
          {loadingCatalog ? (
            <p className="text-sm text-muted-foreground">Cargando agenda…</p>
          ) : !catalog ? (
            <p className="text-sm text-destructive">
              No se pudo cargar el catálogo del local.
            </p>
          ) : (
            <form className="flex flex-col gap-6" onSubmit={handleConfirm}>
              <section className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Local
                </p>
                <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium">
                  {businessName}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cuando tengas varios locales, aquí podrás elegir cuál.
                </p>
              </section>

              <section className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  1 · Servicio
                </p>
                <ul className="flex flex-col gap-2">
                  {catalog.services.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceId(s.id);
                          setProfessionalId(null);
                          setSelectedSlot(null);
                          setSlots([]);
                          setSlotsOpen(false);
                        }}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                          serviceId === s.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {[
                            s.durationMinutes != null
                              ? `${s.durationMinutes} min`
                              : null,
                            s.priceCents != null
                              ? formatPriceCents(s.priceCents)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {serviceId ? (
                <section className="space-y-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    2 · Profesional
                  </p>
                  {professionals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay profesionales para este servicio.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {professionals.map((p) => (
                        <li key={p.id}>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              professionalId === p.id ? "default" : "outline"
                            }
                            onClick={() => {
                              setProfessionalId(p.id);
                              setSlotsOpen(false);
                              setSelectedSlot(null);
                            }}
                          >
                            {p.displayName}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}

              <section className="space-y-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    3 · Día y hora
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {serviceId && professionalId
                      ? selectedService && selectedProfessional
                        ? `${selectedService.name} con ${selectedProfessional.displayName}`
                        : "Elige el día en el calendario"
                      : "Selecciona servicio y profesional"}
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-4">
                  <div className="relative min-h-[18rem]">
                    {!(serviceId && professionalId) ? (
                      <button
                        type="button"
                        className="absolute inset-0 z-10 cursor-pointer rounded-xl bg-background/55 backdrop-blur-[1px]"
                        aria-label="Selecciona servicio y profesional antes de elegir fecha"
                        onClick={() =>
                          toast.message(
                            "Primero elige servicio y profesional",
                          )
                        }
                      />
                    ) : null}
                    <Calendar
                      mode="single"
                      required
                      selected={selectedDate}
                      onSelect={(day) => {
                        const chosen = day ?? selectedDate;
                        if (!chosen) return;
                        if (!serviceId || !professionalId) return;
                        setSelectedDate(chosen);
                        setSlotsOpen(true);
                        setSelectedSlot(null);
                      }}
                      disabled={(date) => {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        if (d < today) return true;
                        return isClosedDay(d);
                      }}
                      className="mx-auto w-fit"
                    />
                  </div>

                  {slotsOpen && serviceId && professionalId ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-2 text-sm font-medium">
                        Horarios · {dateKey}
                      </p>
                      {slotsLoading ? (
                        <p className="text-sm text-muted-foreground">
                          Cargando cupos…
                        </p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Sin cupos ese día
                        </p>
                      ) : (
                        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {slots.map((slot) => {
                            const full = slot.remaining <= 0;
                            const selected = selectedSlot === slot.startsAt;
                            return (
                              <li key={slot.startsAt}>
                                <button
                                  type="button"
                                  disabled={full}
                                  onClick={() => setSelectedSlot(slot.startsAt)}
                                className={cn(
                                  "flex w-full flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-sm tabular-nums transition-colors",
                                  full && "cursor-not-allowed opacity-40",
                                  selected
                                    ? "border-primary bg-primary/10 font-medium"
                                    : !full && "border-border hover:border-primary/40",
                                  full && "border-border",
                                )}
                                >
                                  <span>{formatTime(slot.startsAt)}</span>
                                  <span className="text-[10px] font-normal text-muted-foreground leading-none">
                                    {slot.booked}/{slot.capacity}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  4 · Cliente
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ib-first">Nombre</Label>
                    <Input
                      id="ib-first"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ib-last">Apellido</Label>
                    <Input
                      id="ib-last"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="ib-email">
                      Correo{" "}
                      <span className="font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="ib-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="cliente@correo.cl"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="ib-notes">
                      Notas{" "}
                      <span className="font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="ib-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={2000}
                    />
                  </div>
                </div>
              </section>

              <div className="sticky bottom-0 -mx-4 border-t border-border bg-background px-4 py-3 sm:-mx-5 sm:px-5">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={
                    creating ||
                    !serviceId ||
                    !professionalId ||
                    !selectedSlot ||
                    !firstName.trim() ||
                    !lastName.trim()
                  }
                >
                  {creating ? "Agendando…" : "Confirmar cita"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
