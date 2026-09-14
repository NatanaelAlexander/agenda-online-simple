"use client";

import * as React from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import type { Business } from "@/components/app/api/businesses";
import { updateBusiness } from "@/components/app/api/businesses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { downloadDataUrl, publicBookingUrl } from "@/lib/public-booking-url";

type Props = {
  business: Business;
  onBusinessChange: (business: Business) => void;
};

export function BookingQrPanel({ business, onBusinessChange }: Props) {
  const bookingUrl = publicBookingUrl(business.slug);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [headline, setHeadline] = React.useState(
    business.qrPosterHeadline ?? "Agenda tu hora",
  );
  const [footer, setFooter] = React.useState(
    business.qrPosterFooter ?? "Escanea el código y reserva en segundos",
  );
  const [bookingEnabled, setBookingEnabled] = React.useState(
    business.bookingEnabled ?? true,
  );
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState<"png" | "pdf" | null>(null);

  React.useEffect(() => {
    setHeadline(business.qrPosterHeadline ?? "Agenda tu hora");
    setFooter(
      business.qrPosterFooter ?? "Escanea el código y reserva en segundos",
    );
    setBookingEnabled(business.bookingEnabled ?? true);
  }, [business]);

  React.useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(bookingUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: "#1f3d3a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
          toast.error("No se pudo generar el código QR");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bookingUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast.success("Link de reserva copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  function downloadPng() {
    if (!qrDataUrl) return;
    setBusy("png");
    try {
      downloadDataUrl(qrDataUrl, `qr-reserva-${business.slug}.png`);
      toast.success("QR descargado");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    if (!qrDataUrl) return;
    setBusy("pdf");
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18;

      doc.setFillColor(248, 250, 247);
      doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");

      doc.setTextColor(31, 61, 58);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(business.name, pageW / 2, 32, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      const title = headline.trim() || "Agenda tu hora";
      doc.text(title, pageW / 2, 44, { align: "center" });

      const qrSize = 95;
      const qrX = (pageW - qrSize) / 2;
      const qrY = 58;
      doc.setDrawColor(210, 220, 215);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 4, 4, "FD");
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setFontSize(11);
      doc.setTextColor(80, 100, 95);
      const foot = footer.trim() || "Escanea el código y reserva en segundos";
      const footLines = doc.splitTextToSize(foot, pageW - margin * 2);
      doc.text(footLines, pageW / 2, qrY + qrSize + 18, { align: "center" });

      doc.setFontSize(9);
      doc.setTextColor(120, 135, 130);
      doc.text(bookingUrl, pageW / 2, qrY + qrSize + 36, { align: "center" });

      doc.setFontSize(8);
      doc.text("Agenda online simple", pageW / 2, 285, { align: "center" });

      doc.save(`afiche-qr-${business.slug}.pdf`);
      toast.success("PDF del afiche listo");
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setBusy(null);
    }
  }

  async function savePosterSettings(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await updateBusiness({
        id: business.id,
        bookingEnabled,
        qrPosterHeadline: headline.trim(),
        qrPosterFooter: footer.trim(),
      });
      onBusinessChange(updated);
      toast.success("Afiche QR guardado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Código QR de reserva</CardTitle>
        <p className="text-sm text-muted-foreground">
          Imprímelo o compártelo para que tus clientes agenden desde el celular.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR de reserva de ${business.name}`}
              className="size-48 rounded-lg bg-white p-2 shadow-sm"
            />
          ) : (
            <div className="flex size-48 items-center justify-center text-sm text-muted-foreground">
              Generando QR…
            </div>
          )}
          <p className="break-all text-center text-xs text-muted-foreground">
            {bookingUrl}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="outline" onClick={() => void copyLink()}>
            Copiar link
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!qrDataUrl || busy !== null}
            onClick={downloadPng}
          >
            {busy === "png" ? "Descargando…" : "Descargar PNG"}
          </Button>
          <Button
            type="button"
            disabled={!qrDataUrl || busy !== null}
            onClick={() => void downloadPdf()}
          >
            {busy === "pdf" ? "Generando…" : "Descargar PDF"}
          </Button>
        </div>

        <form className="flex flex-col gap-4 border-t border-border pt-4" onSubmit={savePosterSettings}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={bookingEnabled}
              onChange={(e) => setBookingEnabled(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Reservas online activas
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="qr-headline">Título del afiche</Label>
            <Input
              id="qr-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={200}
              placeholder="Agenda tu hora"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="qr-footer">Pie del afiche</Label>
            <Input
              id="qr-footer"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              maxLength={300}
              placeholder="Escanea el código y reserva en segundos"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar textos del afiche"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
