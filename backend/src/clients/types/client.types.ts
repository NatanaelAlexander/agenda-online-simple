export interface Client {
  id: string;
  businessId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  googleSub: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Citas no canceladas. Ausente en inserts/updates simples. */
  visitCount?: number;
}

export interface CreateClientInput {
  businessId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  googleSub?: string | null;
  notes?: string | null;
}

export interface UpdateClientInput {
  id: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  googleSub?: string | null;
  notes?: string | null;
}

export interface UpsertByGoogleInput {
  businessId: string;
  fullName: string;
  email: string;
  googleSub: string;
  phone?: string | null;
}

export type ClientSortBy = 'name' | 'visits';

export interface ClientFilters {
  businessId?: string;
  search?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  /** Mínimo de citas oficiales (no canceladas). */
  minVisits?: number;
  sortBy?: ClientSortBy;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedClients {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
}
