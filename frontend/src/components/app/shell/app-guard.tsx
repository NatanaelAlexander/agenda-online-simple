"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function AppGuard({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  /** Si se indica, el usuario debe tener al menos uno de estos roles. */
  requiredRoles?: string[];
}) {
  const router = useRouter();
  const { claims, isLoading } = useAuth();

  const hasRequiredRole = React.useMemo(() => {
    if (!requiredRoles?.length) return true;
    if (!claims?.roles?.length) return false;
    return requiredRoles.some((role) => claims.roles.includes(role));
  }, [claims?.roles, requiredRoles]);

  React.useEffect(() => {
    if (isLoading) return;
    if (!claims) {
      router.replace("/login");
      return;
    }
    if (!hasRequiredRole) {
      router.replace("/app");
    }
  }, [claims, hasRequiredRole, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  if (!claims || !hasRequiredRole) {
    return null;
  }

  return children;
}
