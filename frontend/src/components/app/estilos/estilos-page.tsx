"use client";

import * as React from "react";
import {
  brandingFromTheme,
  getInternalBranding,
  resetBranding,
  updateBranding,
  type AppBranding,
} from "@/components/app/api/branding";
import { BookingHomePreviewModal } from "@/components/app/estilos/booking-home-preview-modal";
import {
  BOOKING_HOME_LAYOUTS,
  type BookingHomeLayoutId,
} from "@/components/public/booking/layouts/registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/errors";
import {
  THEME_PRESET_IDS,
  THEME_PRESETS,
  resolveThemePresetId,
  type ThemePresetId,
} from "@/lib/branding/theme-presets";
import { cn } from "@/lib/utils";
import { useSystemBranding } from "@/providers/system-branding-provider";
import { toast } from "sonner";

export function EstilosPage() {
  const { setBranding } = useSystemBranding();
  const [draft, setDraft] = React.useState<AppBranding | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  React.useEffect(() => {
    getInternalBranding()
      .then(setDraft)
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el branding",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const themeId = resolveThemePresetId(draft.themeId);
      const updated = await updateBranding({
        themeId,
        primaryColor: draft.primaryColor,
        accentColor: draft.accentColor,
        backgroundColor: draft.backgroundColor,
        foregroundColor: draft.foregroundColor,
        bookingHomeLayout: draft.bookingHomeLayout,
      });
      setDraft(updated);
      setBranding(updated);
      toast.success("Estilos guardados");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      const updated = await resetBranding();
      setDraft(updated);
      setBranding(updated);
      toast.success("Estilos restablecidos");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo restablecer",
      );
    } finally {
      setSaving(false);
    }
  }

  function selectTheme(id: ThemePresetId) {
    setDraft((d) => (d ? brandingFromTheme(id, d) : d));
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Estilos del sistema
        </h1>
        <p className="text-sm text-muted-foreground">
          Temas predefinidos (modo claro) y layout de la página de reserva.
        </p>
      </div>

      {loading || !draft ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <form className="flex flex-col gap-6" onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tema</CardTitle>
              <p className="text-sm text-muted-foreground">
                Elige un estilo listo. Todos son light.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {THEME_PRESET_IDS.map((id) => {
                const item = THEME_PRESETS[id];
                const selected =
                  resolveThemePresetId(draft.themeId) === id;
                const vars = item.cssVars;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTheme(id)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      {[vars.primary, vars.accent, vars.background, vars.foreground].map(
                        (color, i) => (
                          <span
                            key={`${id}-${i}`}
                            className="size-5 rounded-full border border-border/80 shadow-sm"
                            style={{ background: color }}
                            aria-hidden
                          />
                        ),
                      )}
                    </div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                      id: {item.id}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Layout página principal (calendario)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Diccionario en código: classic / full / compact. Por defecto
                classic.              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  Object.keys(BOOKING_HOME_LAYOUTS) as BookingHomeLayoutId[]
                ).map((id) => {
                  const item = BOOKING_HOME_LAYOUTS[id];
                  const selected = draft.bookingHomeLayout === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setDraft((d) =>
                          d ? { ...d, bookingHomeLayout: id } : d,
                        )
                      }
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                        id: {item.id}
                      </p>
                    </button>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setPreviewOpen(true)}
              >
                Vista previa
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar estilos"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void handleReset()}
            >
              Restablecer default
            </Button>
          </div>
        </form>
      )}

      {draft ? (
        <BookingHomePreviewModal
          open={previewOpen}
          branding={draft}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </div>
  );
}
