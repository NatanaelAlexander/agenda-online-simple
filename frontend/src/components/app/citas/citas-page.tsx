"use client";

import * as React from "react";
import {
  APPOINTMENT_STATUSES,
  acceptAppointment,
  cancelAppointment,
  changeAppointmentStatus,
  listAppointments,
  rejectAppointment,
  type Appointment,
} from "@/components/app/api/appointments";
import { listBusinesses, type Business } from "@/components/app/api/businesses";
import {
  listClients,
  type Client,
} from "@/components/app/api/clients";
import { listProfessionals, type Professional } from "@/components/app/api/professionals";
import { listServices, type Service } from "@/components/app/api/services";
import { InternalBookingModal } from "@/components/app/citas/internal-booking-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import {
  dateInputToFilterRange,
  formatDateTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZES = [10, 20, 30] as const;

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

function bookingSourceLabel(source: string | undefined): string {
  if (source === "internal") return "Interna";
  if (source === "portal") return "Web";
  return "—";
}

export function CitasPage() {
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);

  const [items, setItems] = React.useState<Appointment[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<(typeof PAGE_SIZES)[number]>(20);

  const [statusCode, setStatusCode] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [professionalId, setProfessionalId] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const [showCreate, setShowCreate] = React.useState(false);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(
    null,
  );
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    listBusinesses({ pageSize: 1 })
      .then(async (biz) => {
        const first = biz.items[0];
        if (!first) return;
        setBusiness(first);
        const [svc, pros, cls] = await Promise.all([
          listServices({ businessId: first.id, pageSize: 100 }),
          listProfessionals({ businessId: first.id, pageSize: 100 }),
          listClients({ businessId: first.id, pageSize: 200 }),
        ]);
        setServices(svc.items.filter((s) => s.isActive));
        setProfessionals(pros.items.filter((p) => p.isActive));
        setClients(cls.items);
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el catálogo",
        );
      });
  }, []);

  const load = React.useCallback(() => {
    if (!business) return;
    setLoading(true);
    const range = dateInputToFilterRange(
      dateFrom || undefined,
      dateTo || undefined,
    );
    listAppointments({
      businessId: business.id,
      statusCode: statusCode || undefined,
      serviceId: serviceId || undefined,
      clientId: clientId || undefined,
      professionalId: professionalId || undefined,
      ...range,
      page,
      pageSize,
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudieron cargar las citas",
        );
      })
      .finally(() => setLoading(false));
  }, [
    business,
    statusCode,
    serviceId,
    clientId,
    professionalId,
    dateFrom,
    dateTo,
    page,
    pageSize,
  ]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      toast.success("Cita cancelada");
      load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo cancelar",
      );
    } finally {
      setCancellingId(null);
    }
  }

  async function handleStatusChange(id: string, next: string) {
    setStatusUpdatingId(id);
    try {
      await changeAppointmentStatus(id, next);
      toast.success("Estado actualizado");
      load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo actualizar",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleAccept(id: string) {
    setReviewingId(id);
    try {
      await acceptAppointment(id);
      toast.success("Cita aceptada");
      load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo aceptar",
      );
    } finally {
      setReviewingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!window.confirm("¿Rechazar esta solicitud? El cliente verá que el local no la aceptó.")) {
      return;
    }
    setReviewingId(id);
    try {
      await rejectAppointment(id);
      toast.success("Solicitud rechazada");
      load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo rechazar",
      );
    } finally {
      setReviewingId(null);
    }
  }

  function clearFilters() {
    setStatusCode("");
    setServiceId("");
    setClientId("");
    setProfessionalId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            Citas
          </h1>
          <p className="text-sm text-muted-foreground">
            Agenda interna, filtros y estados
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 w-fit"
          onClick={() => setShowCreate(true)}
          disabled={!business}
        >
          Nueva cita
        </Button>
      </div>

      {business ? (
        <InternalBookingModal
          open={showCreate}
          businessId={business.id}
          businessSlug={business.slug}
          businessName={business.name}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setPage(1);
            load();
            listClients({ businessId: business.id, pageSize: 200 })
              .then((cls) => setClients(cls.items))
              .catch(() => undefined);
          }}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <select
              className={selectClass}
              value={statusCode}
              onChange={(e) => {
                setStatusCode(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Servicio</Label>
            <select
              className={selectClass}
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Profesional</Label>
            <select
              className={selectClass}
              value={professionalId}
              onChange={(e) => {
                setProfessionalId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cliente</Label>
            <select
              className={selectClass}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-6">
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Listado</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              Ver
              <select
                className={cn(selectClass, "w-auto")}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-muted-foreground">
              {fromRow}–{toRow} de {total}
            </span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay citas con esos filtros.</p>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Cliente</th>
                  <th className="pb-2 pr-4 font-medium">Servicio</th>
                  <th className="pb-2 pr-4 font-medium">Profesional</th>
                  <th className="pb-2 pr-4 font-medium">Origen</th>
                  <th className="pb-2 pr-4 font-medium">Estado</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 tabular-nums">
                      {formatDateTime(row.startsAt)}
                    </td>
                    <td className="py-3 pr-4">{row.clientName}</td>
                    <td className="py-3 pr-4">{row.serviceName ?? "Por definir"}</td>
                    <td className="py-3 pr-4">{row.professionalName ?? "Por definir"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          row.bookingSource === "internal"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {bookingSourceLabel(row.bookingSource)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className={cn(selectClass, "min-w-[8.5rem]")}
                        value={row.statusCode}
                        disabled={statusUpdatingId === row.id}
                        onChange={(e) =>
                          void handleStatusChange(row.id, e.target.value)
                        }
                      >
                        {APPOINTMENT_STATUSES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 text-right sm:py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {row.statusCode !== "confirmed" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-8"
                            disabled={reviewingId === row.id}
                            onClick={() => void handleAccept(row.id)}
                          >
                            Aceptar
                          </Button>
                        ) : null}
                        {row.statusCode !== "cancelled" ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={reviewingId === row.id}
                              onClick={() => void handleReject(row.id)}
                            >
                              Rechazar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-8"
                              disabled={cancellingId === row.id}
                              onClick={() => void handleCancel(row.id)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
