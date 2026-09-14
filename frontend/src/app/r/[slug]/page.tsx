import { Suspense } from "react";
import { BookingWizard } from "@/components/public/booking/booking-wizard";

export default async function PublicBookingPage({
  params,
}: PageProps<"/r/[slug]">) {
  const { slug } = await params;

  return (
    <div className="relative min-h-[100dvh]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,oklch(0.72_0.08_180/0.28),transparent_55%),linear-gradient(to_bottom,oklch(0.985_0.012_90),oklch(0.97_0.01_85))]"
        aria-hidden
      />
      <div className="relative z-10">
        <Suspense
          fallback={
            <p className="py-12 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          }
        >
          <BookingWizard slug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
