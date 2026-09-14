import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface Professional {
  id: string;
  businessId: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalSchedule {
  id?: string;
  professionalId?: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface PaginatedProfessionals {
  items: Professional[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listProfessionals(
  filters: Record<string, unknown> = {},
): Promise<PaginatedProfessionals> {
  return apiFetchDetalle<PaginatedProfessionals>(
    "/internal/professionals/listar",
    filters,
    true,
  );
}

export async function createProfessional(input: {
  businessId: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
}): Promise<Professional> {
  return apiFetch<Professional>(
    "/internal/professionals/create",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function updateProfessional(input: {
  id: string;
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
}): Promise<Professional> {
  return apiFetch<Professional>(
    "/internal/professionals/update",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function deactivateProfessional(id: string): Promise<Professional> {
  return apiFetchDetalle<Professional>(
    "/internal/professionals/desactivar",
    { id },
    true,
  );
}

export async function listProfessionalSchedules(
  professionalId: string,
): Promise<ProfessionalSchedule[]> {
  return apiFetch<ProfessionalSchedule[]>(
    "/internal/professionals/schedules/listar",
    {
      method: "POST",
      body: JSON.stringify({ professionalId }),
    },
    true,
  );
}

export async function setProfessionalSchedules(input: {
  professionalId: string;
  schedules: Array<{ weekday: number; startTime: string; endTime: string }>;
}): Promise<{ schedules: ProfessionalSchedule[] }> {
  return apiFetch<{ schedules: ProfessionalSchedule[] }>(
    "/internal/professionals/set-schedules",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function listProfessionalServiceIds(
  professionalId: string,
): Promise<string[]> {
  const res = await apiFetchDetalle<{ serviceIds: string[] }>(
    "/internal/professionals/services/listar",
    { professionalId },
    true,
  );
  return res.serviceIds;
}

export async function setProfessionalServices(input: {
  professionalId: string;
  serviceIds: string[];
}): Promise<string[]> {
  const res = await apiFetch<{ serviceIds: string[] }>(
    "/internal/professionals/set-services",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
  return res.serviceIds;
}

export interface ScheduleException {
  id: string;
  businessId: string;
  professionalId: string | null;
  exceptionDate: string;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export async function listScheduleExceptions(filters: {
  businessId: string;
  professionalId?: string;
  fromDate?: string;
  pageSize?: number;
}): Promise<{ items: ScheduleException[]; total: number }> {
  return apiFetchDetalle<{ items: ScheduleException[]; total: number }>(
    "/internal/professionals/exceptions/listar",
    filters,
    true,
  );
}

export async function createScheduleException(input: {
  businessId: string;
  professionalId?: string | null;
  exceptionDate: string;
  isClosed?: boolean;
  reason?: string | null;
}): Promise<ScheduleException> {
  return apiFetch<ScheduleException>(
    "/internal/professionals/exceptions/create",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}

export async function deleteScheduleException(id: string): Promise<ScheduleException> {
  return apiFetchDetalle<ScheduleException>(
    "/internal/professionals/exceptions/eliminar",
    { id },
    true,
  );
}
