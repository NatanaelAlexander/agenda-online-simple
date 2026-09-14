"use client";

import * as React from "react";
import { X } from "lucide-react";
import { listBusinesses } from "@/components/app/api/businesses";
import {
  createProfessional,
  deactivateProfessional,
  listProfessionals,
  type Professional,
} from "@/components/app/api/professionals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { toast } from "sonner";

export function ProfessionalsPage() {
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Professional[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const load = React.useCallback(async (bizId: string) => {
    setLoading(true);
    try {
      const res = await listProfessionals({
        businessId: bizId,
        isActive: true,
        pageSize: 200,
      });
      setItems(res.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los profesionales",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    listBusinesses({ pageSize: 1 })
      .then(async (biz) => {
        const id = biz.items[0]?.id ?? null;
        setBusinessId(id);
        if (id) await load(id);
        else setLoading(false);
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el negocio",
        );
        setLoading(false);
      });
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!businessId || !newName.trim()) return;
    setCreating(true);
    try {
      await createProfessional({
        businessId,
        displayName: newName.trim(),
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
      });
      toast.success("Profesional creado");
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setShowCreate(false);
      await load(businessId);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleRemove(pro: Professional) {
    if (!businessId) return;
    if (
      !window.confirm(
        `¿Quitar a ${pro.displayName} de la lista de profesionales?`,
      )
    ) {
      return;
    }
    setRemovingId(pro.id);
    try {
      await deactivateProfessional(pro.id);
      toast.success("Profesional eliminado");
      await load(businessId);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo eliminar",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            Profesionales
          </h1>
          <p className="text-sm text-muted-foreground">
            Equipo del local. Los horarios se configuran en Agenda.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 w-fit"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Cancelar" : "Crear profesional"}
        </Button>
      </div>

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleCreate}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pro-name">Nombre</Label>
                <Input
                  id="pro-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="Ej. Ana Pérez"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pro-email">
                    Correo{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    id="pro-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pro-phone">
                    Teléfono{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    id="pro-phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                {creating ? "Creando…" : "Guardar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay profesionales. Crea el primero.
            </p>
          ) : (
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Nombre</th>
                  <th className="pb-2 pr-4 font-medium">Correo</th>
                  <th className="pb-2 pr-4 font-medium">Teléfono</th>
                  <th className="pb-2 w-12 font-medium">
                    <span className="sr-only">Eliminar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((pro) => (
                  <tr key={pro.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">{pro.displayName}</td>
                    <td className="py-3 pr-4">{pro.email ?? "—"}</td>
                    <td className="py-3 pr-4">{pro.phone ?? "—"}</td>
                    <td className="py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        disabled={removingId === pro.id}
                        aria-label={`Eliminar ${pro.displayName}`}
                        onClick={() => void handleRemove(pro)}
                      >
                        <X className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
