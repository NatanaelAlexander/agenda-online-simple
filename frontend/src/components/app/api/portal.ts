import { API_BASE_URL, apiFetch } from "@/lib/api/client";
import type { BookingSummary } from "@/lib/booking/cookie";
import type { Appointment } from "./appointments";

export interface PortalSlot {
  startsAt: string;
  booked: number;
  capacity: number;
  remaining: number;
}

export interface PortalSlotsResponse {
  slots: PortalSlot[];
}

/** Acepta respuesta nueva o legacy (array de ISO strings). */
export function normalizePortalSlots(
  slots: PortalSlot[] | string[] | unknown,
): PortalSlot[] {
  if (!Array.isArray(slots)) return [];
  return slots.map((slot) => {
    if (typeof slot === "string") {
      return { startsAt: slot, booked: 0, capacity: 1, remaining: 1 };
    }
    const startsAt = String(slot?.startsAt ?? "");
    const capacity = Math.max(1, Number(slot?.capacity) || 1);
    const booked = Math.max(0, Number(slot?.booked) || 0);
    const remaining =
      slot?.remaining != null
        ? Math.max(0, Number(slot.remaining))
        : Math.max(0, capacity - booked);
    return { startsAt, booked, capacity, remaining };
  });
}

export interface PortalConfirmResponse {
  appointment: Appointment;
  cookiePayload: BookingSummary;
}

export async function portalSlots(input: {
  businessSlug: string;
  serviceId?: string | null;
  professionalId?: string | null;
  date: string;
}): Promise<PortalSlotsResponse> {
  return apiFetch<PortalSlotsResponse>("/portal/appointments/slots", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function portalConfirm(
  bookingToken: string,
  input: {
    businessSlug: string;
    serviceId?: string | null;
    professionalId?: string | null;
    startsAt: string;
    notes?: string;
  },
): Promise<PortalConfirmResponse> {
  const response = await fetch(`${API_BASE_URL}/api/portal/appointments/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bookingToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const { ApiError, parseApiErrorMessage } = await import("@/lib/api/errors");
    throw new ApiError(
      response.status,
      parseApiErrorMessage(body, "No se pudo confirmar la reserva"),
    );
  }

  return response.json() as Promise<PortalConfirmResponse>;
}

export async function portalCancel(cancelToken: string): Promise<Appointment> {
  return apiFetch<Appointment>("/portal/appointments/cancel", {
    method: "POST",
    body: JSON.stringify({ cancelToken }),
  });
}

export async function portalAppointmentStatus(
  cancelToken: string,
): Promise<Appointment> {
  return apiFetch<Appointment>("/portal/appointments/estado", {
    method: "POST",
    body: JSON.stringify({ cancelToken }),
  });
}

export function googleBookingAuthUrl(): string {
  return `${API_BASE_URL}/api/auth/google`;
}


export async function portalMyAppointments(input: {
  cancelTokens: string[];
  businessSlug?: string;
}): Promise<Appointment[]> {
  return apiFetch<Appointment[]>("/portal/appointments/mias", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
