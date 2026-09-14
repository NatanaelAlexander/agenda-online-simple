import { Injectable } from '@nestjs/common';
import { AuditAction } from '../audit/types/audit.types.js';
import { AuditService } from '../audit/audit.service.js';
import { DatabaseService } from '../common/database/database.service.js';
import {
  ExcepcionHorarioNoEncontradaException,
  ProfesionalNoEncontradoException,
} from './exceptions/professional.exceptions.js';
import {
  SQL_COUNT_EXCEPTIONS_BASE,
  SQL_COUNT_PROFESSIONALS_BASE,
  SQL_DEACTIVATE_PROFESSIONAL,
  SQL_DELETE_PROFESSIONAL_SCHEDULES,
  SQL_DELETE_PROFESSIONAL_SERVICES,
  SQL_DELETE_SCHEDULE_EXCEPTION,
  SQL_FIND_ALL_EXCEPTIONS_BASE,
  SQL_FIND_ALL_PROFESSIONALS_BASE,
  SQL_FIND_PROFESSIONAL_BY_ID,
  SQL_INSERT_PROFESSIONAL,
  SQL_INSERT_PROFESSIONAL_SCHEDULE,
  SQL_INSERT_PROFESSIONAL_SERVICE,
  SQL_INSERT_SCHEDULE_EXCEPTION,
  SQL_LIST_PROFESSIONAL_SCHEDULES,
  SQL_LIST_PROFESSIONAL_SERVICE_IDS,
  SQL_UPDATE_PROFESSIONAL,
} from './queries/professional.queries.js';
import type {
  CreateProfessionalInput,
  CreateScheduleExceptionInput,
  PaginatedProfessionals,
  PaginatedScheduleExceptions,
  Professional,
  ProfessionalFilters,
  ProfessionalSchedule,
  ScheduleException,
  ScheduleExceptionFilters,
  SetSchedulesInput,
  SetServicesInput,
  UpdateProfessionalInput,
} from './types/professional.types.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    filters: ProfessionalFilters = {},
  ): Promise<PaginatedProfessionals> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (filters.businessId) {
      conditions.push(`business_id = $${index++}`);
      params.push(filters.businessId);
    }
    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${index++}`);
      params.push(filters.isActive);
    }
    if (filters.search) {
      conditions.push(
        `(display_name ILIKE $${index} OR email ILIKE $${index} OR phone ILIKE $${index})`,
      );
      params.push(`%${filters.search}%`);
      index++;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.db.query<{ total: number }>(
      `${SQL_COUNT_PROFESSIONALS_BASE} ${where}`,
      params,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const { rows } = await this.db.query<Professional>(
      `${SQL_FIND_ALL_PROFESSIONALS_BASE}
       ${where}
       ORDER BY display_name ASC
       LIMIT $${index}
       OFFSET $${index + 1}`,
      [...params, pageSize, offset],
    );

    return { items: rows, total, page, pageSize };
  }

  async findById(id: string): Promise<Professional> {
    const { rows } = await this.db.query<Professional>(
      SQL_FIND_PROFESSIONAL_BY_ID,
      [id],
    );
    if (!rows[0]) {
      throw new ProfesionalNoEncontradoException();
    }
    return rows[0];
  }

  async create(input: CreateProfessionalInput): Promise<Professional> {
    const { rows } = await this.db.query<Professional>(
      SQL_INSERT_PROFESSIONAL,
      [
        input.businessId,
        input.userId ?? null,
        input.displayName,
        input.email ?? null,
        input.phone ?? null,
        input.isActive ?? true,
      ],
    );
    const created = rows[0];

    await this.audit.log({
      userId: input.auditUserId ?? null,
      action: AuditAction.CREATE,
      tableName: 'professionals',
      recordId: created.id,
      newValues: created as unknown as Record<string, unknown>,
    });

    return created;
  }

  async update(input: UpdateProfessionalInput): Promise<Professional> {
    const existing = await this.findById(input.id);

    const { rows } = await this.db.query<Professional>(
      SQL_UPDATE_PROFESSIONAL,
      [
        input.id,
        input.displayName ?? null,
        input.email === undefined ? null : input.email,
        input.phone === undefined ? null : input.phone,
        input.userId === undefined ? null : input.userId,
        input.isActive ?? null,
      ],
    );

    if (!rows[0]) {
      throw new ProfesionalNoEncontradoException();
    }

    const updated = rows[0];

    await this.audit.log({
      userId: input.auditUserId ?? null,
      action: AuditAction.UPDATE,
      tableName: 'professionals',
      recordId: updated.id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  async deactivate(id: string): Promise<Professional> {
    const { rows } = await this.db.query<Professional>(
      SQL_DEACTIVATE_PROFESSIONAL,
      [id],
    );
    if (!rows[0]) {
      throw new ProfesionalNoEncontradoException();
    }
    return rows[0];
  }

  async listSchedules(professionalId: string): Promise<ProfessionalSchedule[]> {
    await this.findById(professionalId);
    const { rows } = await this.db.query<ProfessionalSchedule>(
      SQL_LIST_PROFESSIONAL_SCHEDULES,
      [professionalId],
    );
    return rows.map((row) => ({
      ...row,
      startTime: normalizeScheduleTime(row.startTime),
      endTime: normalizeScheduleTime(row.endTime),
    }));
  }

  async setSchedules(input: SetSchedulesInput): Promise<ProfessionalSchedule[]> {
    await this.findById(input.professionalId);

    return this.db.transaction(async (query) => {
      await query(SQL_DELETE_PROFESSIONAL_SCHEDULES, [input.professionalId]);
      const schedules: ProfessionalSchedule[] = [];
      for (const item of input.schedules) {
        const { rows } = await query<ProfessionalSchedule>(
          SQL_INSERT_PROFESSIONAL_SCHEDULE,
          [
            input.professionalId,
            item.weekday,
            item.startTime,
            item.endTime,
          ],
        );
        schedules.push({
          ...rows[0],
          startTime: normalizeScheduleTime(rows[0].startTime),
          endTime: normalizeScheduleTime(rows[0].endTime),
        });
      }
      return schedules;
    });
  }

  async setServices(input: SetServicesInput): Promise<string[]> {
    await this.findById(input.professionalId);

    await this.db.transaction(async (query) => {
      await query(SQL_DELETE_PROFESSIONAL_SERVICES, [input.professionalId]);
      for (const serviceId of input.serviceIds) {
        await query(SQL_INSERT_PROFESSIONAL_SERVICE, [
          input.professionalId,
          serviceId,
        ]);
      }
    });

    return this.listServiceIds(input.professionalId);
  }

  async listServiceIds(professionalId: string): Promise<string[]> {
    await this.findById(professionalId);
    const { rows } = await this.db.query<{ serviceId: string }>(
      SQL_LIST_PROFESSIONAL_SERVICE_IDS,
      [professionalId],
    );
    return rows.map((row) => row.serviceId);
  }

  async listExceptions(
    filters: ScheduleExceptionFilters,
  ): Promise<PaginatedScheduleExceptions> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [`business_id = $1`];
    const params: unknown[] = [filters.businessId];
    let index = 2;

    if (filters.professionalId) {
      // Incluye excepciones del profesional y las del negocio completo
      conditions.push(
        `(professional_id = $${index} OR professional_id IS NULL)`,
      );
      params.push(filters.professionalId);
      index++;
    }
    if (filters.fromDate) {
      conditions.push(`exception_date >= $${index++}::date`);
      params.push(filters.fromDate);
    }
    if (filters.toDate) {
      conditions.push(`exception_date <= $${index++}::date`);
      params.push(filters.toDate);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.db.query<{ total: number }>(
      `${SQL_COUNT_EXCEPTIONS_BASE} ${where}`,
      params,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const { rows } = await this.db.query<ScheduleException>(
      `${SQL_FIND_ALL_EXCEPTIONS_BASE}
       ${where}
       ORDER BY exception_date ASC
       LIMIT $${index}
       OFFSET $${index + 1}`,
      [...params, pageSize, offset],
    );

    return { items: rows, total, page, pageSize };
  }

  async createException(
    input: CreateScheduleExceptionInput,
  ): Promise<ScheduleException> {
    const isClosed = input.isClosed ?? true;

    const { rows } = await this.db.query<ScheduleException>(
      SQL_INSERT_SCHEDULE_EXCEPTION,
      [
        input.businessId,
        input.professionalId ?? null,
        input.exceptionDate,
        isClosed,
        isClosed ? null : (input.startTime ?? null),
        isClosed ? null : (input.endTime ?? null),
        input.reason ?? null,
      ],
    );

    return rows[0];
  }

  async deleteException(id: string): Promise<ScheduleException> {
    const { rows } = await this.db.query<ScheduleException>(
      SQL_DELETE_SCHEDULE_EXCEPTION,
      [id],
    );
    if (!rows[0]) {
      throw new ExcepcionHorarioNoEncontradaException();
    }
    return rows[0];
  }
}

function normalizeScheduleTime(value: string): string {
  const raw = String(value ?? '');
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}
