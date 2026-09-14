"use client";

import * as React from "react";
import Link from "next/link";
import {
  listAppointments,
  type Appointment,
} from "@/components/app/api/appointments";
import { listBusinesses } from "@/components/app/api/businesses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import {
  formatDateTime,
  formatDayLabel,
  lastDaysRange,
  localDayRange,
  toDateInputValue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHART_DAYS = 14;

type DayBucket = {
  key: string;
  label: string;
  total: number;
  confirmed: number;
  cancelled: number;
  other: number;
};

function buildDayBuckets(
  appointments: Appointment[],
  days: number,
): DayBucket[] {
  const buckets: DayBucket[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateInputValue(d);
    buckets.push({
      key,
      label: formatDayLabel(key),
      total: 0,
      confirmed: 0,
      cancelled: 0,
      other: 0,
    });
  }

  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const appt of appointments) {
    const key = toDateInputValue(new Date(appt.startsAt));
    const i = index.get(key);
    if (i == null) continue;
    buckets[i].total += 1;
    if (appt.statusCode === "cancelled" || appt.statusCode === "no_show") {
      buckets[i].cancelled += 1;
    } else if (
      appt.statusCode === "confirmed" ||
      appt.statusCode === "attended" ||
      appt.statusCode === "pending"
    ) {
      buckets[i].confirmed += 1;
    } else {
      buckets[i].other += 1;
    }
  }
  return buckets;
}

export function DashboardHome() {
  const [todayItems, setTodayItems] = React.useState<Appointment[]>([]);
  const [buckets, setBuckets] = React.useState<DayBucket[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const biz = await listBusinesses({ pageSize: 1 });
        const businessId = biz.items[0]?.id;
        const today = localDayRange();
        const range = lastDaysRange(CHART_DAYS);

        const [todayRes, chartRes] = await Promise.all([
          listAppointments({
            businessId,
            ...today,
            pageSize: 50,
            page: 1,
          }),
          listAppointments({
            businessId,
            ...range,
            pageSize: 200,
            page: 1,
          }),
        ]);

        if (cancelled) return;
        setTodayItems(todayRes.items);
        setBuckets(buildDayBuckets(chartRes.items, CHART_DAYS));
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar las citas",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxTotal = Math.max(1, ...buckets.map((b) => b.total));
  const weekTotal = buckets.reduce((sum, b) => sum + b.total, 0);
  const todayBucket = buckets[buckets.length - 1];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            Inicio
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen del día y citas por día
          </p>
        </div>
        <Link
          href="/app/citas"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
        >
          Ir a citas
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {loading ? "—" : (todayBucket?.total ?? todayItems.length)}
            </p>
            <p className="text-xs text-muted-foreground">citas del día</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimos {CHART_DAYS} días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {loading ? "—" : weekTotal}
            </p>
            <p className="text-xs text-muted-foreground">citas en el período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pico diario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tabular-nums">
              {loading ? "—" : maxTotal === 1 && weekTotal === 0 ? 0 : maxTotal}
            </p>
            <p className="text-xs text-muted-foreground">máx. citas en un día</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Citas por día</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimos {CHART_DAYS} días · verde = activas · gris = canceladas / no
            show
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <div className="flex h-52 items-end gap-1.5 sm:gap-2">
              {buckets.map((bucket) => {
                const heightPct = (bucket.total / maxTotal) * 100;
                const activePct =
                  bucket.total === 0
                    ? 0
                    : ((bucket.confirmed + bucket.other) / bucket.total) * 100;
                return (
                  <div
                    key={bucket.key}
                    className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div className="relative flex h-40 w-full items-end justify-center">
                      <div
                        className={cn(
                          "relative w-full max-w-[2.25rem] overflow-hidden rounded-t-md bg-muted transition-all",
                          bucket.total === 0 && "opacity-40",
                        )}
                        style={{ height: `${Math.max(heightPct, bucket.total ? 8 : 3)}%` }}
                        title={`${bucket.label}: ${bucket.total} citas`}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary"
                          style={{ height: `${activePct}%` }}
                        />
                      </div>
                      <span className="pointer-events-none absolute -top-5 hidden rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
                        {bucket.total}
                      </span>
                    </div>
                    <span className="w-full truncate text-center text-[10px] text-muted-foreground sm:text-xs">
                      {bucket.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agenda del día</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : todayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay citas para hoy.</p>
          ) : (
            <ul className="divide-y divide-border">
              {todayItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline gap-x-3 py-3 text-sm"
                >
                  <span className="font-medium tabular-nums">
                    {formatDateTime(item.startsAt)}
                  </span>
                  <span>{item.clientName}</span>
                  <span className="text-muted-foreground">{item.serviceName}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                    {item.statusName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
