import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  prepMinutes: number;
  bufferMinutes: number;
  priceCents: number | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedServices {
  items: Service[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listServices(
  filters: Record<string, unknown> = {},
): Promise<PaginatedServices> {
  return apiFetchDetalle<PaginatedServices>(
    "/internal/services/listar",
    filters,
    true,
  );
}

export async function createService(input: {
  businessId: string;
  name: string;
  durationMinutes?: number | null;
  priceCents?: number | null;
  description?: string | null;
}): Promise<Service> {
  return apiFetch<Service>(
    "/internal/services/create",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}
