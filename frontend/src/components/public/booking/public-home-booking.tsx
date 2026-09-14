"use client";

import * as React from "react";
import {
  DEFAULT_APP_BRANDING,
  portalGetBranding,
} from "@/components/app/api/branding";
import { getBookingHomeComponent } from "@/components/public/booking/layouts/registry";

const DEFAULT_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG?.trim() || "barberia-demo";

export function PublicHomeBooking() {
  const [layoutId, setLayoutId] = React.useState(
    DEFAULT_APP_BRANDING.bookingHomeLayout,
  );
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    portalGetBranding()
      .then((b) => setLayoutId(b.bookingHomeLayout))
      .catch(() => setLayoutId("classic"))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Cargando agenda…
      </p>
    );
  }

  const Layout = getBookingHomeComponent(layoutId);
  return <Layout slug={DEFAULT_SLUG} />;
}
