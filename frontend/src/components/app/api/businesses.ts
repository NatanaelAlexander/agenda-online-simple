import { apiFetch, apiFetchDetalle } from "@/lib/api/client";
import type { BusinessSocialLinks } from "@/lib/social-links";

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  socialLinks: BusinessSocialLinks;
  bookingEnabled: boolean;
  qrPosterHeadline: string | null;
  qrPosterFooter: string | null;
  maxBookingsPerSlot: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSchedule {
  id?: string;
  businessId?: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface PaginatedBusinesses {
  items: Business[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PortalService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  priceCents: number | null;
  color: string | null;
}

export interface PortalProfessional {
  id: string;
  displayName: string;
  serviceIds: string[];
}

export interface PortalCatalog {
  business: Business;
  logoUrl: string | null;
  services: PortalService[];
  professionals: PortalProfessional[];
  schedules: BusinessSchedule[];
  exceptions: Array<{
    exceptionDate: string;
    isClosed: boolean;
    professionalId: string | null;
    reason: string | null;
  }>;
}

export async function listBusinesses(
  filters: Record<string, unknown> = {},
): Promise<PaginatedBusinesses> {
  return apiFetchDetalle<PaginatedBusinesses>(
    "/internal/businesses/listar",
    filters,
    true,
  );
}

export async function businessDetalle(id: string): Promise<Business> {
  return apiFetchDetalle<Business>("/internal/businesses/detalle", { id }, true);
}

export async function updateBusiness(input: {
  id: string;
  name?: string;
  description?: string | null;
  phone?: string | null;
  socialLinks?: BusinessSocialLinks;
  bookingEnabled?: boolean;
  qrPosterHeadline?: string | null;
  qrPosterFooter?: string | null;
  maxBookingsPerSlot?: number;
}): Promise<Business> {
  return apiFetch<Business>(
    "/internal/businesses/update",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function listBusinessSchedules(
  businessId: string,
): Promise<BusinessSchedule[]> {
  return apiFetchDetalle<BusinessSchedule[]>(
    "/internal/businesses/schedules/listar",
    { businessId },
    true,
  );
}

export async function setBusinessSchedules(input: {
  businessId: string;
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>;
}): Promise<{ schedules: BusinessSchedule[] }> {
  return apiFetch<{ schedules: BusinessSchedule[] }>(
    "/internal/businesses/set-schedules",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function portalGetBySlug(slug: string): Promise<Business> {
  return apiFetch<Business>(`/portal/businesses/${encodeURIComponent(slug)}`);
}

export async function portalGetCatalog(slug: string): Promise<PortalCatalog> {
  return apiFetch<PortalCatalog>(
    `/portal/businesses/${encodeURIComponent(slug)}/catalog`,
  );
}
