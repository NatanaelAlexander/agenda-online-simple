"use client";

import * as React from "react";
import {
  changePassword,
  fetchMe,
  updateProfile,
  type AuthMe,
} from "@/components/app/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

export function PerfilPage() {
  const { applyTokens } = useAuth();
  const [me, setMe] = React.useState<AuthMe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    fetchMe()
      .then((data) => {
        setMe(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhoneNumber(data.phoneNumber ?? "");
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError ? error.message : "No se pudo cargar el perfil",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const tokens = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || null,
      });
      applyTokens(tokens);
      setMe((prev) =>
        prev
          ? {
              ...prev,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phoneNumber: phoneNumber.trim() || null,
            }
          : prev,
      );
      toast.success("Perfil actualizado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("La confirmación no coincide");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Contraseña actualizada. Vuelve a iniciar sesión si hace falta.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo cambiar",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Nombre y contraseña del panel. El correo no se puede cambiar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSaveProfile}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="perfil-email">Correo</Label>
                <Input id="perfil-email" value={me?.email ?? ""} disabled readOnly />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="perfil-nombre">Nombre</Label>
                  <Input
                    id="perfil-nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="perfil-apellido">Apellido</Label>
                  <Input
                    id="perfil-apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="perfil-phone">
                  Teléfono{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="perfil-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={50}
                />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Guardando…" : "Guardar perfil"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pw-current">Contraseña actual</Label>
              <Input
                id="pw-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pw-new">Nueva</Label>
                <Input
                  id="pw-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pw-confirm">Confirmar</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Guardando…" : "Actualizar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
