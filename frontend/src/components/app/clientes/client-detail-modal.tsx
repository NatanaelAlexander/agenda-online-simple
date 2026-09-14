"use client";

import * as React from "react";
import {
  listAppointments,
  type Appointment,
} from "@/components/app/api/appointments";
import type { Client } from "@/components/app/api/clients";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  open: boolean;
  client: Client | null;
  businessId: string;
  onClose: () => void;
};

function sourceLabel(source: string | undefined): string {
  if (source === "internal") return "Interna";
  if (source === "portal") return "Web";
  return "—";
}

export function ClientDetailModal({
  open,
  client,
  businessId,
  onClose,
}: Props) {
  const [items, setItems] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !client) return;
    setLoading(true);
    listAppointments({
      businessId,
      clientId: client.id,
      page: 1,
      pageSize: 50,
    })
      .then((res) => {
        const sorted = [...res.items].sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
        );
        setItems(sorted);
      })
      .catch((error) => {
        setItems([]);
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el historial",
        );
      })
      .finally(() => setLoading(false));
  }, [open, client, businessId]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !client) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:max-h-[90dvh] sm:rounded-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="client-detail-title"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              {client.fullName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {[client.email, client.phone].filter(Boolean).join(" · ") ||
                "Sin contacto"}
              {" · "}
              {client.visitCount ?? 0} visitas
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Historial de citas
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este cliente aún no tiene citas registradas.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((appt) => (
                <li
                  key={appt.id}
                  className="rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium tabular-nums">
                      {formatDateTime(appt.startsAt)}
                    </p>
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        appt.statusCode === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : appt.statusCode === "pending"
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                            : "bg-primary/10 text-primary",
                      )}
                    >
                      {appt.statusName}
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-1 text-muted-foreground">
                    <div className="flex gap-2">
                      <dt className="shrink-0">Servicio:</dt>
                      <dd className="text-foreground">
                        {appt.serviceName ?? "Por definir"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0">Profesional:</dt>
                      <dd className="text-foreground">
                        {appt.professionalName ?? "Por definir"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0">Origen:</dt>
                      <dd className="text-foreground">
                        {sourceLabel(appt.bookingSource)}
                      </dd>
                    </div>
                    {appt.notes ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0">Notas:</dt>
                        <dd className="text-foreground">{appt.notes}</dd>
                      </div>
                    ) : null}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
