import { Injectable } from '@nestjs/common';
import { AuditAction } from '../audit/types/audit.types.js';
import { AuditService } from '../audit/audit.service.js';
import { DatabaseService } from '../common/database/database.service.js';
import { ServicioNoEncontradoException } from './exceptions/service.exceptions.js';
import {
  SQL_COUNT_SERVICES_BASE,
  SQL_DEACTIVATE_SERVICE,
  SQL_FIND_ALL_SERVICES_BASE,
  SQL_FIND_SERVICE_BY_ID,
  SQL_INSERT_SERVICE,
  SQL_UPDATE_SERVICE,
} from './queries/service.queries.js';
import type {
  CreateServiceInput,
  PaginatedServices,
  Service,
  ServiceFilters,
  UpdateServiceInput,
} from './types/service.types.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class ServicesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async findAll(filters: ServiceFilters = {}): Promise<PaginatedServices> {
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
      conditions.push(`name ILIKE $${index++}`);
      params.push(`%${filters.search}%`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.db.query<{ total: number }>(
      `${SQL_COUNT_SERVICES_BASE} ${where}`,
      params,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const { rows } = await this.db.query<Service>(
      `${SQL_FIND_ALL_SERVICES_BASE}
       ${where}
       ORDER BY name ASC
       LIMIT $${index}
       OFFSET $${index + 1}`,
      [...params, pageSize, offset],
    );

    return { items: rows, total, page, pageSize };
  }

  async findById(id: string): Promise<Service> {
    const { rows } = await this.db.query<Service>(SQL_FIND_SERVICE_BY_ID, [id]);
    if (!rows[0]) {
      throw new ServicioNoEncontradoException();
    }
    return rows[0];
  }

  async create(input: CreateServiceInput): Promise<Service> {
    const { rows } = await this.db.query<Service>(SQL_INSERT_SERVICE, [
      input.businessId,
      input.name,
      input.description ?? null,
      input.durationMinutes === undefined || input.durationMinutes === null
        ? null
        : input.durationMinutes,
      input.prepMinutes ?? 0,
      input.bufferMinutes ?? 0,
      input.priceCents === undefined || input.priceCents === null
        ? null
        : input.priceCents,
      input.color ?? null,
      input.isActive ?? true,
    ]);
    const created = rows[0];

    await this.audit.log({
      userId: input.userId ?? null,
      action: AuditAction.CREATE,
      tableName: 'services',
      recordId: created.id,
      newValues: created as unknown as Record<string, unknown>,
    });

    return created;
  }

  async update(input: UpdateServiceInput): Promise<Service> {
    const existing = await this.findById(input.id);
    const { rows } = await this.db.query<Service>(SQL_UPDATE_SERVICE, [
      input.id,
      input.name ?? null,
      input.description === undefined ? null : input.description,
      input.durationMinutes === undefined ? null : input.durationMinutes,
      input.prepMinutes ?? null,
      input.bufferMinutes ?? null,
      input.priceCents === undefined ? null : input.priceCents,
      input.color === undefined ? null : input.color,
      input.isActive ?? null,
      input.priceCents !== undefined,
      input.durationMinutes !== undefined,
    ]);
    if (!rows[0]) {
      throw new ServicioNoEncontradoException();
    }

    const updated = rows[0];

    await this.audit.log({
      userId: input.userId ?? null,
      action: AuditAction.UPDATE,
      tableName: 'services',
      recordId: updated.id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  async deactivate(id: string): Promise<Service> {
    const { rows } = await this.db.query<Service>(SQL_DEACTIVATE_SERVICE, [id]);
    if (!rows[0]) {
      throw new ServicioNoEncontradoException();
    }
    return rows[0];
  }
}
