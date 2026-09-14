import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface Client {
  id: string;
  businessId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  googleSub: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Citas oficiales (excluye canceladas) */
  visitCount?: number;
}

export interface PaginatedClients {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterClients {
  businessId?: string;
  search?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  minVisits?: number;
  sortBy?: "name" | "visits";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function listClients(
  filters: FilterClients = {},
): Promise<PaginatedClients> {
  return apiFetchDetalle<PaginatedClients>(
    "/internal/clients/listar",
    filters,
    true,
  );
}

export async function createClient(input: {
  businessId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}): Promise<Client> {
  return apiFetch<Client>(
    "/internal/clients/create",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}
