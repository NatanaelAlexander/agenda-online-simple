import Cookies from "js-cookie";

export const BOOKING_COOKIE = "aos_booking";

export interface BookingSummary {
  email: string;
  name: string;
  appointmentId: string;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  professionalName: string;
  businessSlug: string;
  cancelToken: string;
  statusCode?: string;
  cancelledBy?: "client" | "staff" | null;
}

function cookieOptions() {
  return {
    path: "/",
    sameSite: "Lax" as const,
    expires: 30,
  };
}

/** Lee todas las reservas (soporta cookie antigua de un solo objeto). */
export function getAllBookings(): BookingSummary[] {
  const raw = Cookies.get(BOOKING_COOKIE);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as BookingSummary | BookingSummary[];
    if (Array.isArray(parsed)) {
      return parsed.filter((b) => b?.appointmentId && b?.businessSlug);
    }
    if (parsed?.appointmentId && parsed?.businessSlug) {
      return [parsed];
    }
    return [];
  } catch {
    return [];
  }
}

function writeAllBookings(items: BookingSummary[]): void {
  if (items.length === 0) {
    Cookies.remove(BOOKING_COOKIE, { path: "/" });
    return;
  }
  Cookies.set(BOOKING_COOKIE, JSON.stringify(items), cookieOptions());
}

export function getBookingsForSlug(slug: string): BookingSummary[] {
  return getAllBookings()
    .filter((b) => b.businessSlug === slug)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}

/** Última reserva del slug (compat). */
export function getBookingForSlug(slug: string): BookingSummary | null {
  const items = getBookingsForSlug(slug);
  const active = items.find((b) => b.statusCode !== "cancelled");
  return active ?? items[items.length - 1] ?? null;
}

/** Crea o actualiza una reserva por appointmentId. */
export function setBookingCookie(payload: BookingSummary): void {
  const all = getAllBookings().filter(
    (b) => b.appointmentId !== payload.appointmentId,
  );
  all.push(payload);
  writeAllBookings(all);
}

export function removeBookingCookie(appointmentId: string): void {
  writeAllBookings(
    getAllBookings().filter((b) => b.appointmentId !== appointmentId),
  );
}

export function clearBookingsForSlug(slug: string): void {
  writeAllBookings(getAllBookings().filter((b) => b.businessSlug !== slug));
}

export function clearBookingCookie(): void {
  Cookies.remove(BOOKING_COOKIE, { path: "/" });
}

export function isActiveBooking(booking: BookingSummary): boolean {
  return booking.statusCode !== "cancelled";
}

export const PENDING_BOOKING_STORAGE_KEY = "aos_pending_booking";

export interface PendingBooking {
  slug: string;
  serviceId: string | null;
  professionalId: string | null;
  startsAt: string;
}

export function savePendingBooking(pending: PendingBooking): void {
  sessionStorage.setItem(PENDING_BOOKING_STORAGE_KEY, JSON.stringify(pending));
}

export function readPendingBooking(): PendingBooking | null {
  const raw = sessionStorage.getItem(PENDING_BOOKING_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PendingBooking;
  } catch {
    return null;
  }
}

export function clearPendingBooking(): void {
  sessionStorage.removeItem(PENDING_BOOKING_STORAGE_KEY);
}
