"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Scissors,
  Settings,
  Shield,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { AnimatePresence, motion } from "motion/react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  /** Si falta, el ítem es visible para cualquier sesión interna. */
  anyPermission?: string[];
  roles?: string[];
};

const primaryNav: NavItem[] = [
  { href: "/app", label: "Inicio", icon: LayoutDashboard, exact: true },
  {
    href: "/app/citas",
    label: "Citas",
    icon: CalendarDays,
    anyPermission: ["appointments:read"],
  },
];

const adminNav: NavItem[] = [
  {
    href: "/app/servicios",
    label: "Servicios",
    icon: Scissors,
    anyPermission: ["services:read"],
  },
  {
    href: "/app/clientes",
    label: "Clientes",
    icon: Users,
    anyPermission: ["clients:read"],
  },
  {
    href: "/app/profesionales",
    label: "Profesionales",
    icon: UserRound,
    anyPermission: ["professionals:read"],
  },
  {
    href: "/app/negocio",
    label: "Negocio",
    icon: Building2,
    anyPermission: ["businesses:read"],
  },
  {
    href: "/app/agenda",
    label: "Agenda",
    icon: CalendarClock,
    anyPermission: ["appointments:read", "availability:read"],
  },
];

const internoNav: NavItem[] = [
  {
    href: "/app/interno",
    label: "Usuarios",
    icon: Shield,
    roles: ["super_admin"],
  },
];

function canSeeNavItem(
  item: NavItem,
  claims: { roles: string[]; permissions: string[] } | null,
): boolean {
  if (!claims) return false;
  if (claims.roles.includes("super_admin")) return true;
  if (claims.permissions.includes("system:manage")) return true;
  if (item.roles?.length) {
    return item.roles.some((role) => claims.roles.includes(role));
  }
  if (item.anyPermission?.length) {
    return item.anyPermission.some((perm) =>
      claims.permissions.includes(perm),
    );
  }
  return true;
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      {label}
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { claims, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const initials = React.useMemo(() => {
    if (!claims) return "?";
    const a = claims.firstName?.[0] ?? "";
    const b = claims.lastName?.[0] ?? "";
    return (a + b).toUpperCase() || "?";
  }, [claims]);

  const isSuperAdmin = !!claims?.roles?.includes("super_admin");
  const visiblePrimary = primaryNav.filter((item) =>
    canSeeNavItem(item, claims),
  );
  const visibleAdmin = adminNav.filter((item) => canSeeNavItem(item, claims));
  const visibleInterno = internoNav.filter((item) =>
    canSeeNavItem(item, claims),
  );

  React.useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-5">
        <p className="font-heading text-sm font-semibold tracking-tight">
          Agenda online simple
        </p>
        {claims ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {claims.firstName} {claims.lastName}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {visiblePrimary.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            exact={item.exact}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}

        {visibleAdmin.length > 0 ? (
          <p className="mt-4 mb-1 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Administración
          </p>
        ) : null}
        {visibleAdmin.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            exact={item.exact}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}

        {visibleInterno.length > 0 ? (
          <>
            <p className="mt-4 mb-1 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Interno
            </p>
            {visibleInterno.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                exact={item.exact}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </>
        ) : null}
      </nav>

      <div className="relative border-t border-sidebar-border p-2" ref={menuRef}>
        {menuOpen ? (
          <div className="absolute bottom-full left-2 right-2 z-40 mb-2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
            <Link
              href="/app/perfil"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
            >
              <UserRound className="size-4 opacity-70" />
              Perfil
            </Link>
            <Link
              href="/app/configuracion"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
            >
              <Settings className="size-4 opacity-70" />
              Configuración
            </Link>
            {isSuperAdmin ||
            claims?.permissions?.includes("system:manage") ? (
              <Link
                href="/app/estilos"
                className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate?.();
                }}
              >
                <Palette className="size-4 opacity-70" />
                Estilos del sistema
              </Link>
            ) : null}
            <Link
              href="/app/terminos"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
            >
              <FileText className="size-4 opacity-70" />
              Términos y condiciones
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
                void logout();
              }}
            >
              <LogOut className="size-4 opacity-70" />
              Cerrar sesión
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors",
            menuOpen ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {claims ? `${claims.firstName} ${claims.lastName}` : "Cuenta"}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {claims?.email ?? "—"}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

/** Sidebar fijo en desktop. */
export function AppSidebar() {
  return (
    <aside className="hidden h-full w-56 shrink-0 border-r border-border md:flex">
      <SidebarNav />
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:flex-row">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
        <p className="min-w-0 truncate font-heading text-sm font-semibold tracking-tight">
          Agenda online simple
        </p>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            key="mobile-nav-backdrop"
            type="button"
            className="fixed inset-0 z-50 bg-black/45 md:hidden"
            aria-label="Cerrar menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            key="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-sidebar shadow-xl md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
              <p className="font-heading text-sm font-semibold">Menú</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cerrar"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AppSidebar />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-5 md:p-8">
        {children}
      </main>
    </div>
  );
}
