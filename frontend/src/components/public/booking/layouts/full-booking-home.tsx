"use client";

import { Suspense } from "react";
import { BookingWizard } from "@/components/public/booking/booking-wizard";
import { cn } from "@/lib/utils";

export function FullBookingHome({
  slug,
  embedded = false,
}: {
  slug: string;
  embedded?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col",
        embedded ? "min-h-[28rem]" : "min-h-[100dvh]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,color-mix(in_oklab,var(--primary)_32%,transparent),transparent_55%),radial-gradient(ellipse_50%_40%_at_0%_80%,color-mix(in_oklab,var(--accent)_55%,transparent),transparent_50%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--accent)_35%,var(--background)),var(--background))]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <Suspense
          fallback={
            <p className="py-16 text-center text-sm text-muted-foreground">
              Cargando agenda…
            </p>
          }
        >
          <BookingWizard slug={slug} branded variant="full" />
        </Suspense>
      </div>
    </div>
  );
}
