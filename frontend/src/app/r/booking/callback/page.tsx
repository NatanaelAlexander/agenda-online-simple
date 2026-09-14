import { Suspense } from "react";
import { BookingCallback } from "@/components/public/booking/booking-callback";

export default function BookingCallbackPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Suspense fallback={<p className="py-12 text-center text-sm">Cargando…</p>}>
        <BookingCallback />
      </Suspense>
    </div>
  );
}
