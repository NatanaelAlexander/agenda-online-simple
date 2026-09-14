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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInput {
  businessId: string;
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  prepMinutes?: number;
  bufferMinutes?: number;
  priceCents?: number | null;
  color?: string | null;
  isActive?: boolean;
  userId?: string | null;
}

export interface UpdateServiceInput {
  id: string;
  name?: string;
  description?: string | null;
  durationMinutes?: number | null;
  prepMinutes?: number;
  bufferMinutes?: number;
  priceCents?: number | null;
  color?: string | null;
  isActive?: boolean;
  userId?: string | null;
}

export interface ServiceFilters {
  businessId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedServices {
  items: Service[];
  total: number;
  page: number;
  pageSize: number;
}
