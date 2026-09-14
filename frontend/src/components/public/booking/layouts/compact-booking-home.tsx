"use client";

import { Suspense } from "react";
import { BookingWizard } from "@/components/public/booking/booking-wizard";
import { cn } from "@/lib/utils";

export function CompactBookingHome({
  slug,
  embedded = false,
}: {
  slug: string;
  embedded?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        embedded ? "min-h-[28rem]" : "min-h-[100dvh]",
      )}
    >
      <div className="shrink-0 border-b border-border bg-card/80 px-4 py-3 sm:px-6">
        <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Agenda online simple
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Reserva tu hora en pocos pasos
        </p>
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        <Suspense
          fallback={
            <p className="py-12 text-center text-sm text-muted-foreground">
              Cargando agenda…
            </p>
          }
        >
          <BookingWizard slug={slug} branded={false} />
        </Suspense>
      </div>
    </div>
  );
}
