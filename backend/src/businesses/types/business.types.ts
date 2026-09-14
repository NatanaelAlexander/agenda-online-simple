export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  socialLinks: Record<string, unknown>;
  bookingEnabled: boolean;
  qrPosterHeadline: string | null;
  qrPosterFooter: string | null;
  /** Máximo de clientes en el mismo horario. */
  maxBookingsPerSlot: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSchedule {
  id?: string;
  businessId?: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface CreateBusinessInput {
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  timezone?: string;
  socialLinks?: Record<string, unknown>;
  bookingEnabled?: boolean;
  qrPosterHeadline?: string | null;
  qrPosterFooter?: string | null;
  maxBookingsPerSlot?: number;
  userId?: string | null;
}

export interface UpdateBusinessInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  timezone?: string;
  socialLinks?: Record<string, unknown>;
  bookingEnabled?: boolean;
  qrPosterHeadline?: string | null;
  qrPosterFooter?: string | null;
  maxBookingsPerSlot?: number;
  userId?: string | null;
}

export interface SetBusinessSchedulesInput {
  businessId: string;
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>;
}

export interface BusinessFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBusinesses {
  items: Business[];
  total: number;
  page: number;
  pageSize: number;
}
