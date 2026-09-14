"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  forgotPasswordRequest,
  resetPasswordRequest,
} from "@/components/app/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";

const forgotSchema = z.object({
  email: z.email("Correo inválido"),
});

const resetSchema = z.object({
  email: z.email("Correo inválido"),
  code: z.string().min(4, "Ingresá el código"),
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
});

type ForgotValues = z.infer<typeof forgotSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export function RecoverForm() {
  const [step, setStep] = React.useState<"forgot" | "reset">("forgot");

  const forgotForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  async function onForgot(values: ForgotValues) {
    try {
      await forgotPasswordRequest(values.email);
      resetForm.setValue("email", values.email);
      toast.success("Si el correo existe, enviamos un código");
      setStep("reset");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo enviar el código",
      );
    }
  }

  async function onReset(values: ResetValues) {
    try {
      await resetPasswordRequest(values);
      toast.success("Contraseña actualizada");
      setStep("forgot");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo restablecer",
      );
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          {step === "forgot"
            ? "Te enviaremos un código por correo"
            : "Ingresá el código y tu nueva contraseña"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "forgot" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={forgotForm.handleSubmit(onForgot)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="forgot-email">Correo</Label>
              <Input
                id="forgot-email"
                type="email"
                {...forgotForm.register("email")}
              />
              {forgotForm.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {forgotForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={forgotForm.formState.isSubmitting}>
              Enviar código
            </Button>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setStep("reset")}
            >
              Ya tengo un código
            </button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={resetForm.handleSubmit(onReset)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-email">Correo</Label>
              <Input id="reset-email" type="email" {...resetForm.register("email")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" {...resetForm.register("code")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                {...resetForm.register("newPassword")}
              />
            </div>
            <Button type="submit" disabled={resetForm.formState.isSubmitting}>
              Restablecer
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline"
              onClick={() => setStep("forgot")}
            >
              Volver al paso anterior
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Volver al login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
