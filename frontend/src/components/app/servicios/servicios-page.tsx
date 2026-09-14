"use client";

import * as React from "react";
import { listBusinesses } from "@/components/app/api/businesses";
import { createService, listServices, type Service } from "@/components/app/api/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPriceCents } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";

export function ServiciosPage() {
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Service[]>([]);
  const [name, setName] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (bid: string) => {
    const res = await listServices({ businessId: bid, pageSize: 100 });
    setItems(res.items);
  }, []);

  React.useEffect(() => {
    listBusinesses({ pageSize: 1 })
      .then((res) => {
        const first = res.items[0];
        if (first) {
          setBusinessId(first.id);
          return load(first.id);
        }
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError ? error.message : "No se pudo cargar el negocio",
        );
      })
      .finally(() => setLoading(false));
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!businessId) {
      return;
    }
    setSaving(true);
    try {
      const trimmedPrice = price.trim();
      const priceCents =
        trimmedPrice === ""
          ? null
          : Math.round(Number(trimmedPrice) * 100);
      if (priceCents !== null && (Number.isNaN(priceCents) || priceCents < 0)) {
        toast.error("El precio no es válido");
        setSaving(false);
        return;
      }
      const trimmedDuration = duration.trim();
      const durationMinutes =
        trimmedDuration === "" ? null : Number(trimmedDuration);
      if (
        durationMinutes !== null &&
        (!Number.isInteger(durationMinutes) || durationMinutes < 1)
      ) {
        toast.error("La duración no es válida");
        setSaving(false);
        return;
      }
      await createService({
        businessId,
        name: name.trim(),
        durationMinutes,
        priceCents,
      });
      toast.success("Servicio creado");
      setName("");
      setDuration("");
      setPrice("");
      await load(businessId);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear el servicio",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">Servicios</h1>
        <p className="text-sm text-muted-foreground">Catálogo del negocio</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin servicios aún.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {items.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2 py-3">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">
                      {[
                        s.durationMinutes != null ? `${s.durationMinutes} min` : null,
                        s.priceCents != null ? formatPriceCents(s.priceCents) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sin duración ni precio"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleCreate}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="svc-name">Nombre</Label>
                <Input
                  id="svc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="svc-duration">
                  Duración (minutos){" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min={1}
                  placeholder="Ej. 30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si la dejas vacía, al agendar se usan 30 min por defecto.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="svc-price">
                  Precio (CLP){" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="svc-price"
                  type="number"
                  min={0}
                  step="1"
                  placeholder="Ej. 15000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Déjalo vacío si no quieres mostrar precio. Ej. 15000 = $15.000
                </p>
              </div>
              <Button type="submit" disabled={saving || !businessId}>
                {saving ? "Guardando…" : "Crear servicio"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
