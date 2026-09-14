"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { portalConfirm } from "@/components/app/api/portal";
import {
  clearPendingBooking,
  readPendingBooking,
  setBookingCookie,
} from "@/lib/booking/cookie";
import { ApiError } from "@/lib/api/errors";

export function BookingCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState("Enviando tu solicitud al local…");
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const bookingToken = searchParams.get("booking_token");
    const pending = readPendingBooking();

    if (!bookingToken || !pending) {
      setMessage("Faltan datos de la reserva. Vuelve a elegir un horario.");
      return;
    }

    portalConfirm(bookingToken, {
      businessSlug: pending.slug,
      serviceId: pending.serviceId,
      professionalId: pending.professionalId,
      startsAt: pending.startsAt,
    })
      .then((res) => {
        setBookingCookie(res.cookiePayload);
        clearPendingBooking();
        const defaultSlug =
          process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG?.trim() || "barberia-demo";
        router.replace(
          pending.slug === defaultSlug
            ? "/?ok=1"
            : `/r/${pending.slug}?ok=1`,
        );
      })
      .catch((error) => {
        setMessage(
          error instanceof ApiError
            ? error.message
            : "No se pudo confirmar la reserva",
        );
      });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
