export interface Professional {
  id: string;
  businessId: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessionalSchedule {
  id: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
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

export interface CreateProfessionalInput {
  businessId: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  isActive?: boolean;
  auditUserId?: string | null;
}

export interface UpdateProfessionalInput {
  id: string;
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  isActive?: boolean;
  auditUserId?: string | null;
}

export interface ProfessionalFilters {
  businessId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProfessionals {
  items: Professional[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScheduleInput {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface SetSchedulesInput {
  professionalId: string;
  schedules: ScheduleInput[];
}

export interface SetServicesInput {
  professionalId: string;
  serviceIds: string[];
}

export interface ScheduleExceptionFilters {
  businessId: string;
  professionalId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateScheduleExceptionInput {
  businessId: string;
  professionalId?: string | null;
  exceptionDate: string;
  isClosed?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface PaginatedScheduleExceptions {
  items: ScheduleException[];
  total: number;
  page: number;
  pageSize: number;
}
