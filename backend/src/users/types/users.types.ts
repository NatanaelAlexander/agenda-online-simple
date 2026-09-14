export type StaffRoleCode = 'admin' | 'super_admin';

export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateStaffUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: StaffRoleCode;
}

export interface FilterStaffUsers {
  page?: number;
  pageSize?: number;
}

export interface PaginatedStaffUsers {
  items: StaffUser[];
  total: number;
  page: number;
  pageSize: number;
}
