"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function AppGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { claims, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !claims) {
      router.replace("/login");
    }
  }, [claims, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  if (!claims) {
    return null;
  }

  return children;
}
