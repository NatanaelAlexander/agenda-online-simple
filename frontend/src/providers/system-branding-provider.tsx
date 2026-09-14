"use client";

import * as React from "react";
import {
  brandingCssVars,
  DEFAULT_APP_BRANDING,
  portalGetBranding,
  type AppBranding,
} from "@/components/app/api/branding";

interface BrandingContextValue {
  branding: AppBranding;
  setBranding: (next: AppBranding) => void;
  loading: boolean;
}

const BrandingContext = React.createContext<BrandingContextValue | null>(null);

function applyCssVariables(branding: AppBranding) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = brandingCssVars(branding);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function SystemBrandingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [branding, setBrandingState] = React.useState<AppBranding>(
    DEFAULT_APP_BRANDING,
  );
  const [loading, setLoading] = React.useState(true);

  const setBranding = React.useCallback((next: AppBranding) => {
    setBrandingState(next);
    applyCssVariables(next);
  }, []);

  React.useEffect(() => {
    portalGetBranding()
      .then((data) => {
        setBrandingState(data);
        applyCssVariables(data);
      })
      .catch(() => {
        applyCssVariables(DEFAULT_APP_BRANDING);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, setBranding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useSystemBranding() {
  const ctx = React.useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useSystemBranding debe usarse dentro de SystemBrandingProvider");
  }
  return ctx;
}
