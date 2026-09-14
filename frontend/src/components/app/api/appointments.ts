import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export const APPOINTMENT_STATUSES = [
  { code: "pending", name: "Pendiente" },
  { code: "confirmed", name: "Confirmada" },
  { code: "attended", name: "Atendida" },
  { code: "cancelled", name: "Cancelada" },
  { code: "no_show", name: "No show" },
] as const;

export type AppointmentStatusCode =
  (typeof APPOINTMENT_STATUSES)[number]["code"];

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string | null;
  professionalId: string | null;
  clientId: string;
  statusCode: string;
  statusName: string;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  businessName: string;
  businessSlug: string;
  serviceName: string | null;
  professionalName: string | null;
  clientName: string;
  cancelToken?: string;
  clientEmail: string | null;
  /** portal = web pública; internal = panel */
  bookingSource?: "portal" | "internal" | string;
  cancelledBy?: "client" | "staff" | null;
}

export interface PaginatedAppointments {
  items: Appointment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterAppointments {
  businessId?: string;
  professionalId?: string;
  serviceId?: string;
  clientId?: string;
  statusCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function listAppointments(
  filters: FilterAppointments = {},
): Promise<PaginatedAppointments> {
  return apiFetchDetalle<PaginatedAppointments>(
    "/internal/appointments/listar",
    filters,
    true,
  );
}

export async function createAppointment(input: {
  businessId: string;
  serviceId: string;
  professionalId: string;
  clientId: string;
  startsAt: string;
  notes?: string | null;
  statusCode?: string;
}): Promise<Appointment> {
  return apiFetch<Appointment>(
    "/internal/appointments/create",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function changeAppointmentStatus(
  id: string,
  statusCode: string,
): Promise<Appointment> {
  return apiFetch<Appointment>(
    "/internal/appointments/change-status",
    {
      method: "POST",
      body: JSON.stringify({ id, statusCode }),
    },
    true,
  );
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  return apiFetch<Appointment>(
    "/internal/appointments/cancel",
    {
      method: "POST",
      body: JSON.stringify({ id }),
    },
    true,
  );
}

export async function acceptAppointment(id: string): Promise<Appointment> {
  return apiFetch<Appointment>(
    "/internal/appointments/aceptar",
    {
      method: "POST",
      body: JSON.stringify({ id }),
    },
    true,
  );
}

export async function rejectAppointment(id: string): Promise<Appointment> {
  return apiFetch<Appointment>(
    "/internal/appointments/rechazar",
    {
      method: "POST",
      body: JSON.stringify({ id }),
    },
    true,
  );
}
