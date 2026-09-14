import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export type StaffRoleCode = "admin" | "super_admin";

export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedStaffUsers {
  items: StaffUser[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listStaffUsers(
  filters: { page?: number; pageSize?: number } = {},
): Promise<PaginatedStaffUsers> {
  return apiFetchDetalle<PaginatedStaffUsers>(
    "/internal/users/listar",
    filters,
    true,
  );
}

export async function createStaffUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: StaffRoleCode;
}): Promise<StaffUser> {
  return apiFetch<StaffUser>(
    "/internal/users/create",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    true,
  );
}

export function staffRoleLabel(role: string): string {
  if (role === "super_admin") return "Super admin";
  if (role === "admin") return "Admin";
  return role;
}
