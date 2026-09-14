"use client";

import * as React from "react";
import {
  brandingCssVars,
  type AppBranding,
} from "@/components/app/api/branding";
import {
  BOOKING_HOME_LAYOUTS,
  getBookingHomeComponent,
  resolveBookingHomeLayout,
} from "@/components/public/booking/layouts/registry";
import { Button } from "@/components/ui/button";

const DEFAULT_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG?.trim() || "barberia-demo";

type Props = {
  open: boolean;
  branding: AppBranding;
  onClose: () => void;
};

export function BookingHomePreviewModal({ open, branding, onClose }: Props) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const layoutId = resolveBookingHomeLayout(branding.bookingHomeLayout);
  const layoutMeta = BOOKING_HOME_LAYOUTS[layoutId];
  const Layout = getBookingHomeComponent(layoutId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-home-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:max-h-[85dvh] sm:rounded-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="booking-home-preview-title"
              className="font-heading text-lg font-semibold tracking-tight"
            >
              Vista previa
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {layoutMeta.label}
              {" · "}
              <span className="font-mono text-xs">id: {layoutMeta.id}</span>
              {" · borrador"}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground"
          style={brandingCssVars(branding) as React.CSSProperties}
        >
          <Layout slug={DEFAULT_SLUG} embedded />
        </div>
      </div>
    </div>
  );
}
