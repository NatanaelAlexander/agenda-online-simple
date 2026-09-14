"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { portalGetCatalog, type PortalCatalog } from "@/components/app/api/businesses";
import {
  googleBookingAuthUrl,
  portalAppointmentStatus,
  portalCancel,
  portalSlots,
  normalizePortalSlots,
  type PortalSlot,
} from "@/components/app/api/portal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { BlurFade } from "@/components/magicui/blur-fade";
import { BusinessSocialLinksRow } from "@/components/public/business-social-links";
import { ApiError } from "@/lib/api/errors";
import {
  getBookingsForSlug,
  isActiveBooking,
  removeBookingCookie,
  savePendingBooking,
  setBookingCookie,
  type BookingSummary,
} from "@/lib/booking/cookie";
import {
  formatDateTime,
  formatPriceCents,
  formatTime,
  toDateInputValue,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Step = "service" | "professional" | "date";

/** Selección especial: el cliente no está seguro. */
const UNSURE = "__unsure__" as const;
type ChoiceId = string | typeof UNSURE;

function isChoiceReady(value: ChoiceId | null): value is ChoiceId {
  return value != null;
}

function toApiId(value: ChoiceId | null): string | null {
  if (!value || value === UNSURE) return null;
  return value;
}

export function BookingWizard({
  slug,
  branded = false,
  variant = "default",
}: {
  slug: string;
  /** Vista principal: marca de la app + calendario protagonistas */
  branded?: boolean;
  /** full = servicios/profesionales arriba, calendario a ancho completo */
  variant?: "default" | "full";
}) {
  const isFull = variant === "full";
  const searchParams = useSearchParams();
  const calendarAreaRef = React.useRef<HTMLDivElement>(null);
  const [catalog, setCatalog] = React.useState<PortalCatalog | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [step, setStep] = React.useState<Step>("service");
  const [serviceId, setServiceId] = React.useState<ChoiceId | null>(null);
  const [professionalId, setProfessionalId] = React.useState<ChoiceId | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slots, setSlots] = React.useState<PortalSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [slotsOpen, setSlotsOpen] = React.useState(false);
  const [bookings, setBookings] = React.useState<BookingSummary[]>([]);
  const [showMyBookings, setShowMyBookings] = React.useState(false);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get("ok") === "1") {
      toast.success("Solicitud enviada. El local debe aceptarla.");
      setShowMyBookings(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const local = getBookingsForSlug(slug);
    setBookings(local);
    if (local.length > 0 && searchParams.get("ok") === "1") {
      setShowMyBookings(true);
    }

    portalGetCatalog(slug)
      .then(setCatalog)
      .catch((error) => {
        toast.error(
          error instanceof ApiError ? error.message : "No se pudo cargar el negocio",
        );
      })
      .finally(() => setLoading(false));

    if (local.length === 0) return;

    let cancelled = false;
    void Promise.all(
      local.map(async (item) => {
        if (!item.cancelToken) return item;
        try {
          const appt = await portalAppointmentStatus(item.cancelToken);
          return {
            ...item,
            statusCode: appt.statusCode,
            cancelledBy:
              (appt.cancelledBy as BookingSummary["cancelledBy"]) ?? null,
            startsAt: appt.startsAt,
            endsAt: appt.endsAt,
            serviceName: appt.serviceName ?? "Por definir",
            professionalName: appt.professionalName ?? "Por definir",
          } satisfies BookingSummary;
        } catch {
          return item;
        }
      }),
    ).then((next) => {
      if (cancelled) return;
      for (const item of next) setBookingCookie(item);
      setBookings(getBookingsForSlug(slug));
    });

    return () => {
      cancelled = true;
    };
  }, [slug, searchParams]);

  const myBookingDayKeys = React.useMemo(() => {
    const keys = new Set<string>();
    for (const b of bookings) {
      if (!isActiveBooking(b)) continue;
      keys.add(toDateInputValue(new Date(b.startsAt)));
    }
    return keys;
  }, [bookings]);

  const activeBookings = React.useMemo(
    () => bookings.filter(isActiveBooking),
    [bookings],
  );

  const professionals = catalog?.professionals ?? [];

  const selectedService =
    serviceId && serviceId !== UNSURE
      ? catalog?.services.find((s) => s.id === serviceId)
      : undefined;
  const selectedProfessional =
    professionalId && professionalId !== UNSURE
      ? professionals.find((p) => p.id === professionalId)
      : undefined;
  const dateKey = toDateInputValue(selectedDate);
  const serviceReady = isChoiceReady(serviceId);
  const professionalReady = isChoiceReady(professionalId);
  const bookingReady = serviceReady && professionalReady;

  /** Días con atención del local (0=dom … 6=sáb). */
  const openWeekdays = React.useMemo(() => {
    if (!catalog?.schedules?.length) return null;
    return new Set(catalog.schedules.map((s) => s.weekday));
  }, [catalog]);

  function isExceptionClosed(date: Date): boolean {
    if (!catalog?.exceptions?.length) return false;
    const key = toDateInputValue(date);
    const forDay = catalog.exceptions.filter(
      (e) => e.exceptionDate === key && e.isClosed,
    );
    if (forDay.some((e) => e.professionalId == null)) return true;
    if (
      professionalId &&
      professionalId !== UNSURE &&
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

  React.useEffect(() => {
    if (!slotsOpen || !bookingReady || !dateKey) {
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSelectedSlot(null);
    portalSlots({
      businessSlug: slug,
      serviceId: toApiId(serviceId),
      professionalId: toApiId(professionalId),
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
  }, [slug, serviceId, professionalId, dateKey, slotsOpen, bookingReady]);

  function confirmWithGoogle() {
    if (!bookingReady || !selectedSlot) {
      return;
    }
    savePendingBooking({
      slug,
      serviceId: toApiId(serviceId),
      professionalId: toApiId(professionalId),
      startsAt: selectedSlot,
    });
    window.location.href = googleBookingAuthUrl();
  }

  async function cancelBooking(target: BookingSummary) {
    if (!target.cancelToken) return;
    setCancellingId(target.appointmentId);
    try {
      await portalCancel(target.cancelToken);
      removeBookingCookie(target.appointmentId);
      setBookings(getBookingsForSlug(slug));
      toast.success("Reserva cancelada");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo cancelar",
      );
    } finally {
      setCancellingId(null);
    }
  }

  function dismissBooking(target: BookingSummary) {
    removeBookingCookie(target.appointmentId);
    setBookings(getBookingsForSlug(slug));
  }

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Tamaño de celdas según ancho (la tarjeta no se estira en Y).
  React.useEffect(() => {
    if (step !== "date") return;
    const el = calendarAreaRef.current;
    if (!el) return;

    const update = () => {
      const { width } = el.getBoundingClientRect();
      if (width < 40) return;
      const byW = (width - 4) / 7;
      const size = Math.max(36, Math.min(58, Math.floor(byW)));
      el.style.setProperty("--cell-size", `${size}px`);
    };

    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [loading, catalog, bookings.length, showMyBookings, step]);

  // Si el día elegido queda cerrado al cambiar profesional, salta al próximo día hábil
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
  }, [openWeekdays, selectedDate, today]);

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">Cargando agenda…</p>
    );
  }

  if (!catalog) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Negocio no encontrado.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full flex-col",
        isFull
          ? "max-w-6xl gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3"
          : "max-w-5xl gap-3 px-4 py-3 sm:px-6 sm:py-4",
      )}
    >
      <BlurFade delay={0.05} inView className="shrink-0">
        <header
          className={cn(
            "flex flex-col items-center text-center",
            isFull ? "gap-1" : "gap-1.5",
          )}
        >
          {catalog.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={catalog.logoUrl}
              alt={catalog.business.name}
              className={cn(
                "w-auto max-w-[12rem] object-contain",
                isFull ? "h-10 sm:h-12" : "h-16 sm:h-20",
              )}
            />
          ) : null}
          {branded ? (
            <>
              <p
                className={cn(
                  "font-heading font-bold tracking-tight text-foreground",
                  isFull ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl",
                )}
              >
                Agenda online simple
              </p>
              <p
                className={cn(
                  "max-w-md text-muted-foreground",
                  isFull ? "text-xs sm:text-sm" : "text-sm sm:text-base",
                )}
              >
                Reserva tu hora en {catalog.business.name}
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {catalog.business.name}
              </p>
              {catalog.business.description ? (
                <p className="max-w-md text-sm text-muted-foreground">
                  {catalog.business.description}
                </p>
              ) : null}
            </>
          )}
          {branded ? (
            <Link
              href="/login"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Acceso equipo
            </Link>
          ) : null}
        </header>
      </BlurFade>

      {bookings.length > 0 ? (
        <BlurFade delay={0.1} inView className="shrink-0">
          <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-heading text-base font-semibold">
                  {activeBookings.length > 0
                    ? activeBookings.length === 1
                      ? "Tienes 1 hora en este local"
                      : `Tienes ${activeBookings.length} horas en este local`
                    : "Tienes solicitudes anteriores"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Puedes revisarlas o seguir abajo para agendar otra.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={showMyBookings ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMyBookings((v) => !v)}
                >
                  {showMyBookings ? "Ocultar mis horas" : "Revisar mis horas"}
                </Button>
              </div>
            </div>

            {showMyBookings ? (
              <ul className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-3">
                {bookings.map((item) => {
                  const rejected =
                    item.statusCode === "cancelled" &&
                    item.cancelledBy === "staff";
                  const cancelled = item.statusCode === "cancelled";
                  const pending = item.statusCode === "pending";
                  return (
                    <li
                      key={item.appointmentId}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm",
                        rejected
                          ? "border-destructive/30 bg-destructive/5"
                          : pending
                            ? "border-amber-500/30 bg-amber-500/5"
                            : cancelled
                              ? "border-border bg-muted/30"
                              : "border-primary/25 bg-primary/5",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-medium">
                            {rejected
                              ? "No aceptada por el local"
                              : pending
                                ? "A la espera del local"
                                : cancelled
                                  ? "Cancelada"
                                  : "Confirmada"}
                          </p>
                          <p className="text-muted-foreground">
                            {item.serviceName} · {item.professionalName}
                          </p>
                          <p className="tabular-nums text-muted-foreground">
                            {formatDateTime(item.startsAt)}
                          </p>
                        </div>
                        {cancelled ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissBooking(item)}
                          >
                            Quitar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={cancellingId === item.appointmentId}
                            onClick={() => void cancelBooking(item)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </BlurFade>
      ) : null}

      <div className="flex flex-1 flex-col gap-3">
          <nav
            className="mx-auto flex w-full max-w-lg shrink-0 items-center justify-center gap-1.5 text-xs sm:gap-2"
            aria-label="Pasos de reserva"
          >
            {(
              [
                { id: "service" as const, label: "Servicio" },
                { id: "professional" as const, label: "Profesional" },
                { id: "date" as const, label: "Día y hora" },
              ] as const
            ).map((item, index) => {
              const active = step === item.id;
              const done =
                (item.id === "service" && serviceReady && step !== "service") ||
                (item.id === "professional" &&
                  professionalReady &&
                  step === "date");
              return (
                <div key={item.id} className="flex items-center gap-1.5 sm:gap-2">
                  {index > 0 ? (
                    <span className="text-muted-foreground/50" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-primary/15 text-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}. {item.label}
                  </span>
                </div>
              );
            })}
          </nav>

          {/* Servicio/profesional/calendario */}
          <div className="w-full py-2">
            <div className="flex w-full flex-col py-2">
              <AnimatePresence mode="wait">
                {step === "service" ? (
                  <motion.div
                    key="step-service"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mx-auto w-full max-w-lg"
                  >
                <section className="space-y-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    1 · Servicio
                  </p>
                  <p className="font-heading text-lg font-semibold">
                    ¿Qué necesitas?
                  </p>
                  <ul className="flex flex-col gap-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceId(UNSURE);
                          setProfessionalId(null);
                          setStep("professional");
                          setSelectedSlot(null);
                          setSlots([]);
                          setSlotsOpen(false);
                        }}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                          serviceId === UNSURE
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card/60 hover:border-primary/40 hover:bg-accent/40",
                        )}
                      >
                        <span className="font-medium">No estoy seguro</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          El local te orientará al aceptar la cita
                        </span>
                      </button>
                    </li>
                    {catalog.services.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setServiceId(s.id);
                            setProfessionalId(null);
                            setStep("professional");
                            setSelectedSlot(null);
                            setSlots([]);
                            setSlotsOpen(false);
                          }}
                          className={cn(
                            "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                            serviceId === s.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border bg-card/60 hover:border-primary/40 hover:bg-accent/40",
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
              </motion.div>
            ) : null}

            {step === "professional" ? (
              <motion.div
                key="step-pro"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-lg"
              >
                <section className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      2 · Profesional
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep("service");
                        setProfessionalId(null);
                        setSelectedSlot(null);
                        setSlotsOpen(false);
                      }}
                    >
                      Volver
                    </Button>
                  </div>
                  <p className="font-heading text-lg font-semibold">
                    ¿Con quién?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {serviceId === UNSURE
                      ? "Servicio por definir"
                      : selectedService?.name ?? "Servicio"}
                  </p>
                  {professionals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay profesionales cargados. Puedes seguir con “No estoy
                      seguro”.
                    </p>
                  ) : null}
                  <ul className="flex flex-col gap-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setProfessionalId(UNSURE);
                          setStep("date");
                          setSlotsOpen(false);
                          setSelectedSlot(null);
                        }}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                          professionalId === UNSURE
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card/60 hover:border-primary/40 hover:bg-accent/40",
                        )}
                      >
                        <span className="font-medium">No estoy seguro</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Cualquier profesional disponible
                        </span>
                      </button>
                    </li>
                    {professionals.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setProfessionalId(p.id);
                            setStep("date");
                            setSlotsOpen(false);
                            setSelectedSlot(null);
                          }}
                          className={cn(
                            "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                            professionalId === p.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border bg-card/60 hover:border-primary/40 hover:bg-accent/40",
                          )}
                        >
                          <span className="font-medium">{p.displayName}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Profesional del local
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </motion.div>
            ) : null}

            {step === "date" && bookingReady ? (
              <motion.div
                key="step-date"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-5xl shrink-0 px-2 sm:px-4"
              >
                <div className="relative w-full overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-[0_20px_50px_-28px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
                    <div className="relative z-10 flex flex-col gap-3 p-4 sm:gap-3.5 sm:p-6">
                      <div className="flex shrink-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            3 · Día y hora
                          </p>
                          <p className="font-heading text-lg font-semibold sm:text-xl">
                            Elige el día en el calendario
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {serviceId === UNSURE
                              ? "Servicio por definir"
                              : selectedService?.name ?? "Servicio"}
                            {" · "}
                            {professionalId === UNSURE
                              ? "Profesional por definir"
                              : selectedProfessional?.displayName ??
                                "Profesional"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            setStep("professional");
                            setSlotsOpen(false);
                            setSelectedSlot(null);
                          }}
                        >
                          Volver
                        </Button>
                      </div>

                      <div
                        ref={calendarAreaRef}
                        className="relative w-full"
                      >
                        <Calendar
                          mode="single"
                          required
                          selected={selectedDate}
                          onSelect={(day) => {
                            const chosen = day ?? selectedDate;
                            if (!chosen) return;
                            if (isClosedDay(chosen)) {
                              toast.message("Ese día no hay atención");
                              return;
                            }
                            if (day) {
                              setSelectedDate(day);
                            }
                            setSelectedSlot(null);
                            setSlotsOpen(true);
                          }}
                          disabled={(date) => {
                            const d = new Date(date);
                            d.setHours(0, 0, 0, 0);
                            if (d < today) return true;
                            return isClosedDay(d);
                          }}
                          modifiers={{
                            mine: (date) =>
                              myBookingDayKeys.has(toDateInputValue(date)),
                          }}
                          modifiersClassNames={{
                            mine: "[&_button]:bg-amber-500/20 [&_button]:text-foreground [&_button]:ring-2 [&_button]:ring-amber-500/55 [&_button]:ring-offset-1 [&_button]:ring-offset-background",
                          }}
                          className="w-full p-0"
                          classNames={{
                            root: "w-full",
                            months: "relative flex w-full flex-col",
                            month: "flex w-full flex-col gap-1",
                            month_caption:
                              "flex h-10 w-full items-center justify-center",
                            month_grid: "w-full",
                            weekdays: "flex w-full justify-between",
                            weekday:
                              "flex size-(--cell-size) items-center justify-center text-xs font-medium text-muted-foreground select-none",
                            week: "mt-1 flex w-full justify-between",
                            day: "group/day relative flex size-(--cell-size) shrink-0 items-center justify-center rounded-(--cell-radius) p-0 text-center text-sm select-none",
                          }}
                        />
                        {myBookingDayKeys.size > 0 ? (
                          <p className="mt-2 text-center text-[11px] text-muted-foreground">
                            <span className="mr-1.5 inline-block size-2.5 rounded-full bg-amber-500/80 align-middle ring-2 ring-amber-500/40" />
                            Día con tu hora agendada
                          </p>
                        ) : null}
                        <AnimatePresence>
                          {slotsOpen ? (
                            <motion.div
                              key="slots-overlay"
                              className="absolute inset-0 z-30 flex flex-col rounded-xl bg-background/92 p-3 shadow-lg backdrop-blur-md sm:p-4"
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                            >
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Horarios
                                  </p>
                                  <p className="font-heading text-base font-semibold capitalize">
                                    {selectedDate.toLocaleDateString("es-CL", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                    })}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSlotsOpen(false);
                                    setSelectedSlot(null);
                                  }}
                                >
                                  Volver
                                </Button>
                              </div>

                              <div className="min-h-0 flex-1 overflow-y-auto">
                                {slotsLoading ? (
                                  <p className="py-8 text-center text-sm text-muted-foreground">
                                    Buscando horarios…
                                  </p>
                                ) : isClosedDay(selectedDate) ? (
                                  <p className="py-8 text-center text-sm text-muted-foreground">
                                    Este día no hay atención. Elige otro en el
                                    calendario.
                                  </p>
                                ) : slots.length === 0 ? (
                                  <p className="py-8 text-center text-sm text-muted-foreground">
                                    No hay turnos para este día. Prueba otra
                                    fecha.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                    {slots.map((slot, i) => {
                                      const full = slot.remaining <= 0;
                                      const selected =
                                        selectedSlot === slot.startsAt;
                                      return (
                                        <motion.div
                                          key={slot.startsAt}
                                          initial={{ opacity: 0, scale: 0.96 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{
                                            delay: Math.min(i * 0.03, 0.3),
                                          }}
                                        >
                                          <button
                                            type="button"
                                            disabled={full}
                                            onClick={() =>
                                              setSelectedSlot(slot.startsAt)
                                            }
                                            className={cn(
                                              "flex w-full flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 text-sm transition-colors",
                                              full &&
                                                "cursor-not-allowed opacity-40",
                                              selected
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background hover:border-primary/40 hover:bg-muted",
                                              full &&
                                                !selected &&
                                                "hover:border-border hover:bg-background",
                                            )}
                                          >
                                            <span className="leading-none tabular-nums">
                                              {formatTime(slot.startsAt)}
                                            </span>
                                            <span
                                              className={cn(
                                                "text-[11px] leading-none tabular-nums",
                                                selected
                                                  ? "text-primary-foreground/85"
                                                  : "text-muted-foreground",
                                              )}
                                            >
                                              {slot.booked}/{slot.capacity}
                                            </span>
                                          </button>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {selectedSlot ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-3 border-t border-border/70 pt-3"
                                >
                                  <Button
                                    type="button"
                                    size="lg"
                                    className="w-full"
                                    onClick={confirmWithGoogle}
                                  >
                                    Solicitar con Google
                                  </Button>
                                </motion.div>
                              ) : null}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </div>
                </div>
              </motion.div>
            ) : null}
              </AnimatePresence>
            </div>
          </div>
      </div>

      {!isFull ? (
        <BusinessSocialLinksRow
          links={catalog.business.socialLinks}
          className="shrink-0 pb-2"
        />
      ) : null}
    </div>
  );
}

