export type AppointmentStatusCode =
  | 'pending'
  | 'confirmed'
  | 'attended'
  | 'cancelled'
  | 'no_show';

export type AppointmentBookingSource = 'portal' | 'internal';
export type AppointmentCancelledBy = 'client' | 'staff';

export interface AppointmentStatus {
  id: string;
  code: AppointmentStatusCode | string;
  name: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string | null;
  professionalId: string | null;
  clientId: string;
  statusId: string;
  startsAt: Date;
  endsAt: Date;
  cancelToken: string;
  reminderSentAt: Date | null;
  notes: string | null;
  bookingSource: AppointmentBookingSource | string;
  cancelledBy: AppointmentCancelledBy | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentDetail extends Appointment {
  statusCode: string;
  statusName: string;
  businessName: string;
  businessSlug: string;
  timezone: string;
  serviceName: string | null;
  durationMinutes: number | null;
  prepMinutes: number;
  bufferMinutes: number;
  professionalName: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
}

export interface AppointmentFilters {
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

export interface PaginatedAppointments {
  items: AppointmentDetail[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateAppointmentInput {
  businessId: string;
  serviceId: string;
  professionalId: string;
  clientId: string;
  startsAt: string | Date;
  notes?: string | null;
  statusCode?: AppointmentStatusCode | string;
  /** Forzado por el endpoint interno; no viene del cliente público. */
  bookingSource?: AppointmentBookingSource;
}

export interface ConfirmPortalAppointmentInput {
  businessSlug: string;
  serviceId?: string | null;
  professionalId?: string | null;
  startsAt: string;
  notes?: string | null;
}

export interface PortalSlotsInput {
  businessSlug: string;
  serviceId?: string | null;
  professionalId?: string | null;
  date: string;
}

export interface BookingCookiePayload {
  email: string;
  name: string;
  appointmentId: string;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  professionalName: string;
  businessSlug: string;
  cancelToken: string;
  statusCode: string;
  cancelledBy: AppointmentCancelledBy | null;
}

export interface ConfirmPortalResult {
  appointment: AppointmentDetail;
  cookiePayload: BookingCookiePayload;
}
