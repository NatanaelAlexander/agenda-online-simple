"use client";

import * as React from "react";
import Link from "next/link";
import { logoutAllRequest } from "@/components/app/api/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

export function ConfiguracionPage() {
  const { logout } = useAuth();
  const [busy, setBusy] = React.useState(false);

  async function handleLogoutAll() {
    setBusy(true);
    try {
      await logoutAllRequest();
      toast.success("Sesiones cerradas en todos los dispositivos");
      await logout();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo cerrar sesiones",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajustes de cuenta del panel (no afecta la reserva pública con Google).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Edita tu nombre o contraseña en Perfil. Los estilos de la instalación
            están en Estilos del sistema.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/perfil"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ir a perfil
            </Link>
            <Link
              href="/app/estilos"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ir a estilos
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Cierra la sesión en todos los dispositivos (revoca todos los refresh
            tokens).
          </p>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => void handleLogoutAll()}
          >
            {busy ? "Cerrando…" : "Cerrar todas las sesiones"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
