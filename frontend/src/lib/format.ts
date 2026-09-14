export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", { timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function formatDayLabel(isoDate: string): string {
  const date = parseDateInputValue(isoDate);
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Precio en centavos → pesos chilenos (CLP). */
export function formatPriceCents(cents: number | null | undefined): string {
  if (cents == null) {
    return "Sin precio";
  }
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Rango inclusivo del día local (ISO), útil para filtros de citas. */
export function localDayRange(date = new Date()): {
  dateFrom: string;
  dateTo: string;
} {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function todayUtcRange(): { dateFrom: string; dateTo: string } {
  return localDayRange(new Date());
}

/** Rango de N días hacia atrás inclusive (hoy = último). */
export function lastDaysRange(days: number): {
  dateFrom: string;
  dateTo: string;
} {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInputValue(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Convierte YYYY-MM-DD (+ HH:mm opcional) a ISO en zona local. */
export function localDateTimeToIso(date: string, time = "00:00"): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0).toISOString();
}

export function dateInputToFilterRange(
  dateFrom?: string,
  dateTo?: string,
): { dateFrom?: string; dateTo?: string } {
  const result: { dateFrom?: string; dateTo?: string } = {};
  if (dateFrom) {
    result.dateFrom = localDayRange(parseDateInputValue(dateFrom)).dateFrom;
  }
  if (dateTo) {
    result.dateTo = localDayRange(parseDateInputValue(dateTo)).dateTo;
  }
  return result;
}
