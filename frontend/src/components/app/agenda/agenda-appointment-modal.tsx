"use client";

import * as React from "react";
import {
  APPOINTMENT_STATUSES,
  acceptAppointment,
  cancelAppointment,
  changeAppointmentStatus,
  rejectAppointment,
  type Appointment,
} from "@/components/app/api/appointments";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onChanged: (next: Appointment) => void;
};

export function AgendaAppointmentModal({
  open,
  appointment,
  onClose,
  onChanged,
}: Props) {
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !appointment) return null;

  async function run(
    action: () => Promise<Appointment>,
    okMessage: string,
  ) {
    setBusy(true);
    try {
      const updated = await action();
      onChanged(updated);
      toast.success(okMessage);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo completar",
      );
    } finally {
      setBusy(false);
    }
  }

  const isCancelled = appointment.statusCode === "cancelled";
  const isConfirmed = appointment.statusCode === "confirmed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agenda-appt-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:max-h-[90dvh] sm:rounded-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id="agenda-appt-title"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              {appointment.clientName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(appointment.startsAt)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm sm:px-5">
          <div className="space-y-1.5">
            <label
              htmlFor="agenda-appt-status"
              className="text-muted-foreground"
            >
              Estado
            </label>
            <select
              id="agenda-appt-status"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              value={appointment.statusCode}
              disabled={busy}
              onChange={(e) => {
                const next = e.target.value;
                void run(
                  () => changeAppointmentStatus(appointment.id, next),
                  "Estado actualizado",
                );
              }}
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            {appointment.bookingSource === "portal" &&
            appointment.statusCode === "pending" ? (
              <p className="text-xs text-muted-foreground">
                Solicitud web: el cliente espera que el local la acepte.
              </p>
            ) : null}
          </div>

          <p>
            <span className="text-muted-foreground">Servicio:</span>{" "}
            {appointment.serviceName ?? "Por definir"}
          </p>
          <p>
            <span className="text-muted-foreground">Profesional:</span>{" "}
            {appointment.professionalName ?? "Por definir"}
          </p>
          {appointment.clientEmail ? (
            <p>
              <span className="text-muted-foreground">Correo:</span>{" "}
              {appointment.clientEmail}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">Origen:</span>{" "}
            {appointment.bookingSource === "internal" ? "Interna" : "Web"}
          </p>
          {appointment.notes ? (
            <p>
              <span className="text-muted-foreground">Notas:</span>{" "}
              {appointment.notes}
            </p>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-border px-3 py-2.5 sm:px-5">
          {!isConfirmed ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(
                  () => acceptAppointment(appointment.id),
                  "Cita aceptada",
                )
              }
            >
              Aceptar
            </Button>
          ) : null}
          {!isCancelled ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => rejectAppointment(appointment.id),
                    "Cita rechazada",
                  )
                }
              >
                Rechazar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => cancelAppointment(appointment.id),
                    "Cita cancelada",
                  )
                }
              >
                Cancelar cita
              </Button>
            </>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
