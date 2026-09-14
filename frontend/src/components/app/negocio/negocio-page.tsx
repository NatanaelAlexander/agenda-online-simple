"use client";

import * as React from "react";
import { getBusinessLogo, setBusinessLogo } from "@/components/app/api/assets";
import {
  listBusinesses,
  updateBusiness,
  type Business,
} from "@/components/app/api/businesses";
import { BookingQrPanel } from "@/components/app/negocio/booking-qr-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import {
  buildSocialLinks,
  parseSocialLinks,
  SOCIAL_NETWORKS,
  type BusinessSocialLinks,
} from "@/lib/social-links";
import { toast } from "sonner";

const MAX_LOGO_BYTES = 30 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const emptySocial: BusinessSocialLinks = {
  facebook: "",
  instagram: "",
  twitter: "",
  youtube: "",
  tiktok: "",
};

export function NegocioPage() {
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [social, setSocial] = React.useState<BusinessSocialLinks>(emptySocial);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoName, setLogoName] = React.useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    listBusinesses({ pageSize: 1 })
      .then(async (res) => {
        const first = res.items[0];
        if (!first) return;
        setBusiness(first);
        setName(first.name);
        setDescription(first.description ?? "");
        setPhone(first.phone ?? "");
        setSocial({ ...emptySocial, ...parseSocialLinks(first.socialLinks) });
        try {
          const logo = await getBusinessLogo(first.id);
          if (logo) {
            setLogoUrl(logo.url);
            setLogoName(logo.asset.fileName);
          }
        } catch {
          /* R2 ausente: el formulario de datos sigue usable */
        }
      })
      .catch((error) => {
        toast.error(
          error instanceof ApiError ? error.message : "No se pudo cargar el negocio",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!business) {
      return;
    }
    setSaving(true);
    try {
      const updated = await updateBusiness({
        id: business.id,
        name: name.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        socialLinks: buildSocialLinks(social),
      });
      setBusiness(updated);
      setSocial({ ...emptySocial, ...parseSocialLinks(updated.socialLinks) });
      toast.success("Negocio actualizado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !business) return;

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      toast.error("Solo imágenes JPG, PNG o WEBP");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("El logo no puede superar 30 MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const logo = await setBusinessLogo(business.id, file);
      setLogoUrl(logo.url);
      setLogoName(logo.asset.fileName);
      toast.success("Logo actualizado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo subir el logo",
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">Negocio</h1>
        <p className="text-sm text-muted-foreground">
          Datos públicos de tu local
          {business ? (
            <>
              {" "}
              · slug{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{business.slug}</code>
            </>
          ) : null}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex max-w-lg flex-col gap-4 lg:max-w-none md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : !business ? (
                <p className="text-sm text-muted-foreground">No hay negocio configurado.</p>
              ) : (
                <form className="flex flex-col gap-4" onSubmit={handleSave}>
                  <div className="flex flex-col gap-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt={`Logo de ${business.name}`}
                            className="size-full object-contain p-1"
                          />
                        ) : (
                          <span className="px-2 text-center text-[10px] text-muted-foreground">
                            Sin logo
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          className="sr-only"
                          onChange={handleLogoChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLogo}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadingLogo ? "Subiendo…" : "Subir logo"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG o WEBP · máx. 30 MB
                          {logoName ? (
                            <>
                              <br />
                              Actual: {logoName}
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="biz-name">Nombre</Label>
                    <Input
                      id="biz-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="biz-desc">Descripción</Label>
                    <Input
                      id="biz-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="biz-phone">Teléfono</Label>
                    <Input
                      id="biz-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-4">
                    <div>
                      <p className="text-sm font-medium">Redes sociales</p>
                      <p className="text-xs text-muted-foreground">
                        Solo se muestran en la página pública las que tengan link.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {SOCIAL_NETWORKS.map(({ key, label, placeholder }) => (
                        <div key={key} className="flex flex-col gap-1.5">
                          <Label htmlFor={`biz-social-${key}`}>{label}</Label>
                          <Input
                            id={`biz-social-${key}`}
                            type="text"
                            inputMode="url"
                            autoComplete="url"
                            value={social[key] ?? ""}
                            onChange={(e) =>
                              setSocial((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {business ? (
          <BookingQrPanel business={business} onBusinessChange={setBusiness} />
        ) : null}
      </div>
    </div>
  );
}
