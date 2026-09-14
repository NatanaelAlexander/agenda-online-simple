export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  userId?: string | null;
  action: AuditAction | string;
  tableName: string;
  recordId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface AuditLogFilters {
  tableName?: string;
  recordId?: string;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}
