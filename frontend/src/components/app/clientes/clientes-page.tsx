"use client";

import * as React from "react";
import { listBusinesses } from "@/components/app/api/businesses";
import { listClients, type Client } from "@/components/app/api/clients";
import { ClientDetailModal } from "@/components/app/clientes/client-detail-modal";
import { ClientSuggestInput } from "@/components/app/clientes/client-suggest-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZES = [10, 20, 30] as const;
const FILTER_DEBOUNCE_MS = 320;
const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ClientesPage() {
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Client[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"name" | "visits">("visits");
  const [minVisits, setMinVisits] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<(typeof PAGE_SIZES)[number]>(20);

  const [appliedName, setAppliedName] = React.useState("");
  const [appliedEmail, setAppliedEmail] = React.useState("");
  const [appliedPhone, setAppliedPhone] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null,
  );

  React.useEffect(() => {
    listBusinesses({ pageSize: 1 })
      .then((biz) => {
        setBusinessId(biz.items[0]?.id ?? null);
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el negocio",
        );
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedName(fullName.trim());
      setAppliedEmail(email.trim());
      setAppliedPhone(phone.trim());
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [fullName, email, phone]);

  const load = React.useCallback(() => {
    if (!businessId) return;
    setLoading(true);
    const min =
      minVisits.trim() === "" ? undefined : Number(minVisits.trim());
    listClients({
      businessId,
      fullName: appliedName || undefined,
      email: appliedEmail || undefined,
      phone: appliedPhone || undefined,
      minVisits:
        min != null && Number.isFinite(min) && min >= 0 ? min : undefined,
      sortBy,
      sortDir: sortBy === "visits" ? "desc" : "asc",
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
            : "No se pudieron cargar los clientes",
        );
      })
      .finally(() => setLoading(false));
  }, [
    businessId,
    appliedName,
    appliedEmail,
    appliedPhone,
    sortBy,
    minVisits,
    page,
    pageSize,
  ]);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  function clearFilters() {
    setFullName("");
    setEmail("");
    setPhone("");
    setAppliedName("");
    setAppliedEmail("");
    setAppliedPhone("");
    setMinVisits("");
    setSortBy("visits");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          Clientes
        </h1>
        <p className="text-sm text-muted-foreground">
          Visitas = citas agendadas (las canceladas no cuentan)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-name">Nombre</Label>
            <ClientSuggestInput
              id="cli-name"
              field="fullName"
              businessId={businessId}
              value={fullName}
              onChange={setFullName}
              placeholder="Ej. Juan"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-email">Correo</Label>
            <ClientSuggestInput
              id="cli-email"
              field="email"
              businessId={businessId}
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="Ej. juan@correo.cl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-phone">Teléfono</Label>
            <Input
              id="cli-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +569…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-sort">Ordenar</Label>
            <select
              id="cli-sort"
              className={selectClass}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as "name" | "visits");
                setPage(1);
              }}
            >
              <option value="visits">Más visitas</option>
              <option value="name">Nombre A–Z</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cli-min">Mín. visitas</Label>
            <Input
              id="cli-min"
              type="number"
              min={0}
              value={minVisits}
              onChange={(e) => {
                setMinVisits(e.target.value);
                setPage(1);
              }}
              placeholder="Ej. 2"
            />
          </div>
          <div className="flex items-end">
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
            <p className="text-sm text-muted-foreground">
              No hay clientes con esos filtros.
            </p>
          ) : (
            <>
            <div className="space-y-2 md:hidden">
              {items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  onClick={() => setSelectedClient(c)}
                >
                  <p className="truncate text-sm font-medium">{c.fullName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.email ?? "Sin correo"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.phone ?? "Sin teléfono"} · {c.visitCount ?? 0} visitas
                  </p>
                </button>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Nombre</th>
                  <th className="pb-2 pr-4 font-medium">Correo</th>
                  <th className="pb-2 pr-4 font-medium">Teléfono</th>
                  <th className="pb-2 font-medium tabular-nums">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedClient(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedClient(c);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver historial de ${c.fullName}`}
                  >
                    <td className="py-3 pr-4 font-medium">{c.fullName}</td>
                    <td className="py-3 pr-4">{c.email ?? "—"}</td>
                    <td className="py-3 pr-4">{c.phone ?? "—"}</td>
                    <td className="py-3 tabular-nums">{c.visitCount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            </>
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

      {businessId ? (
        <ClientDetailModal
          open={selectedClient != null}
          client={selectedClient}
          businessId={businessId}
          onClose={() => setSelectedClient(null)}
        />
      ) : null}
    </div>
  );
}
