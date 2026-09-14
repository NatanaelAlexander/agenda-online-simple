"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createStaffUser,
  listStaffUsers,
  staffRoleLabel,
  type StaffRoleCode,
  type StaffUser,
} from "@/components/app/api/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function InternoPage() {
  const router = useRouter();
  const { claims } = useAuth();
  const isSuperAdmin = !!claims?.roles?.includes("super_admin");

  const [items, setItems] = React.useState<StaffUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [role, setRole] = React.useState<StaffRoleCode>("admin");

  const load = React.useCallback(async () => {
    const res = await listStaffUsers({ pageSize: 100 });
    setItems(res.items);
  }, []);

  React.useEffect(() => {
    if (!claims) return;
    if (!isSuperAdmin) {
      router.replace("/app");
      return;
    }
    load()
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudieron cargar los usuarios",
        );
      })
      .finally(() => setLoading(false));
  }, [claims, isSuperAdmin, load, router]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await createStaffUser({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      });
      toast.success("Usuario creado");
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("admin");
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        Solo el super admin puede ver esta sección.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          Interno
        </h1>
        <p className="text-sm text-muted-foreground">
          Usuarios del panel. Solo visible para super admin.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Diferencia de roles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 sm:gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
            <p className="font-medium">Admin</p>
            <p className="mt-1 text-muted-foreground">
              Opera el negocio día a día: citas, clientes, servicios,
              profesionales, agenda y datos del local. No puede crear ni
              administrar usuarios internos.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
            <p className="font-medium">Super admin</p>
            <p className="mt-1 text-muted-foreground">
              Tiene todo lo del admin, más el control interno: crear usuarios,
              asignar roles y acceder a esta sección. Es quien define quién entra
              al panel.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crear usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={handleCreate}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="interno-first">Nombre</Label>
                  <Input
                    id="interno-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="interno-last">Apellido</Label>
                  <Input
                    id="interno-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interno-email">Correo</Label>
                <Input
                  id="interno-email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interno-pass">Contraseña</Label>
                <Input
                  id="interno-pass"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interno-role">Rol</Label>
                <select
                  id="interno-role"
                  className={selectClass}
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRoleCode)}
                >
                  <option value="admin">Admin — opera el negocio</option>
                  <option value="super_admin">
                    Super admin — control total + usuarios
                  </option>
                </select>
              </div>
              <Button type="submit" disabled={saving} className="mt-1 w-fit">
                {saving ? "Creando…" : "Crear usuario"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin usuarios.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((user) => (
                  <li
                    key={user.id}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span
                            key={r}
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[11px] font-medium",
                              r === "super_admin"
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {staffRoleLabel(r)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">{user.email}</p>
                    {!user.isActive ? (
                      <p className="mt-1 text-xs text-destructive">Inactivo</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
