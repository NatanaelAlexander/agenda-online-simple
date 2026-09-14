import { Injectable } from '@nestjs/common';
import { AssetsService } from '../assets/assets.service.js';
import { AuditAction } from '../audit/types/audit.types.js';
import { AuditService } from '../audit/audit.service.js';
import { DatabaseService } from '../common/database/database.service.js';
import {
  NegocioNoEncontradoException,
  ReservasDeshabilitadasException,
} from './exceptions/business.exceptions.js';
import {
  SQL_COUNT_BUSINESSES_BASE,
  SQL_DELETE_BUSINESS_SCHEDULES,
  SQL_FIND_ALL_BUSINESSES_BASE,
  SQL_FIND_BUSINESS_BY_ID,
  SQL_FIND_BUSINESS_BY_SLUG,
  SQL_INSERT_BUSINESS,
  SQL_INSERT_BUSINESS_SCHEDULE,
  SQL_LIST_BUSINESS_SCHEDULES,
  SQL_PUBLIC_EXCEPTIONS_BY_BUSINESS,
  SQL_PUBLIC_PROFESSIONALS_BY_BUSINESS,
  SQL_PUBLIC_SCHEDULES_BY_BUSINESS,
  SQL_PUBLIC_SERVICES_BY_BUSINESS,
  SQL_UPDATE_BUSINESS,
} from './queries/business.queries.js';
import type {
  Business,
  BusinessFilters,
  BusinessSchedule,
  CreateBusinessInput,
  PaginatedBusinesses,
  SetBusinessSchedulesInput,
  UpdateBusinessInput,
} from './types/business.types.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

export interface PublicCatalog {
  business: Business;
  logoUrl: string | null;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number | null;
    priceCents: number | null;
    color: string | null;
  }>;
  professionals: Array<{
    id: string;
    displayName: string;
    serviceIds: string[];
  }>;
  /** Horario semanal del local. */
  schedules: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
  }>;
  exceptions: Array<{
    exceptionDate: string;
    isClosed: boolean;
    professionalId: string | null;
    reason: string | null;
  }>;
}

@Injectable()
export class BusinessesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly assets: AssetsService,
  ) {}

  async findAll(filters: BusinessFilters = {}): Promise<PaginatedBusinesses> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (filters.search) {
      conditions.push(
        `(name ILIKE $${index} OR slug ILIKE $${index} OR email ILIKE $${index})`,
      );
      params.push(`%${filters.search}%`);
      index++;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.db.query<{ total: number }>(
      `${SQL_COUNT_BUSINESSES_BASE} ${where}`,
      params,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const { rows } = await this.db.query<Business>(
      `${SQL_FIND_ALL_BUSINESSES_BASE}
       ${where}
       ORDER BY created_at DESC
       LIMIT $${index}
       OFFSET $${index + 1}`,
      [...params, pageSize, offset],
    );

    return { items: rows, total, page, pageSize };
  }

  async findById(id: string): Promise<Business> {
    const { rows } = await this.db.query<Business>(SQL_FIND_BUSINESS_BY_ID, [
      id,
    ]);
    if (!rows[0]) {
      throw new NegocioNoEncontradoException();
    }
    return rows[0];
  }

  async findBySlug(slug: string): Promise<Business> {
    const { rows } = await this.db.query<Business>(SQL_FIND_BUSINESS_BY_SLUG, [
      slug,
    ]);
    if (!rows[0]) {
      throw new NegocioNoEncontradoException();
    }
    return rows[0];
  }

  async findPublicCatalog(slug: string): Promise<PublicCatalog> {
    const business = await this.findBySlug(slug);
    if (!business.bookingEnabled) {
      throw new ReservasDeshabilitadasException();
    }

    const [
      servicesResult,
      professionalsResult,
      schedulesResult,
      exceptionsResult,
      logo,
    ] = await Promise.all([
      this.db.query<PublicCatalog['services'][number]>(
        SQL_PUBLIC_SERVICES_BY_BUSINESS,
        [business.id],
      ),
      this.db.query<{
        id: string;
        displayName: string;
        serviceIds: string[];
      }>(SQL_PUBLIC_PROFESSIONALS_BY_BUSINESS, [business.id]),
      this.db.query<PublicCatalog['schedules'][number]>(
        SQL_PUBLIC_SCHEDULES_BY_BUSINESS,
        [business.id],
      ),
      this.db.query<PublicCatalog['exceptions'][number]>(
        SQL_PUBLIC_EXCEPTIONS_BY_BUSINESS,
        [business.id],
      ),
      this.assets.getBusinessLogo(business.id).catch(() => null),
    ]);

    return {
      business,
      logoUrl: logo?.url ?? null,
      services: servicesResult.rows,
      professionals: professionalsResult.rows.map((row) => ({
        ...row,
        serviceIds: Array.isArray(row.serviceIds) ? row.serviceIds : [],
      })),
      schedules: schedulesResult.rows,
      exceptions: exceptionsResult.rows,
    };
  }

  async listSchedules(businessId: string): Promise<BusinessSchedule[]> {
    await this.findById(businessId);
    const { rows } = await this.db.query<BusinessSchedule>(
      SQL_LIST_BUSINESS_SCHEDULES,
      [businessId],
    );
    return rows;
  }

  async setSchedules(
    input: SetBusinessSchedulesInput,
  ): Promise<BusinessSchedule[]> {
    await this.findById(input.businessId);
    await this.db.transaction(async (query) => {
      await query(SQL_DELETE_BUSINESS_SCHEDULES, [input.businessId]);
      for (const schedule of input.schedules) {
        await query(SQL_INSERT_BUSINESS_SCHEDULE, [
          input.businessId,
          schedule.weekday,
          schedule.startTime,
          schedule.endTime,
        ]);
      }
    });
    return this.listSchedules(input.businessId);
  }

  async create(input: CreateBusinessInput): Promise<Business> {
    const { rows } = await this.db.query<Business>(SQL_INSERT_BUSINESS, [
      input.name,
      input.slug,
      input.description ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.address ?? null,
      input.timezone ?? 'America/Santiago',
      JSON.stringify(input.socialLinks ?? {}),
      input.bookingEnabled ?? true,
      input.qrPosterHeadline ?? null,
      input.qrPosterFooter ?? null,
      input.maxBookingsPerSlot ?? 1,
    ]);
    const created = rows[0];

    await this.audit.log({
      userId: input.userId ?? null,
      action: AuditAction.CREATE,
      tableName: 'businesses',
      recordId: created.id,
      newValues: created as unknown as Record<string, unknown>,
    });

    return created;
  }

  async update(input: UpdateBusinessInput): Promise<Business> {
    const existing = await this.findById(input.id);

    const { rows } = await this.db.query<Business>(SQL_UPDATE_BUSINESS, [
      input.id,
      input.name ?? null,
      input.slug ?? null,
      input.description === undefined ? null : input.description,
      input.phone === undefined ? null : input.phone,
      input.email === undefined ? null : input.email,
      input.address === undefined ? null : input.address,
      input.timezone ?? null,
      input.socialLinks === undefined
        ? null
        : JSON.stringify(input.socialLinks),
      input.bookingEnabled === undefined ? null : input.bookingEnabled,
      input.qrPosterHeadline === undefined ? null : input.qrPosterHeadline,
      input.qrPosterFooter === undefined ? null : input.qrPosterFooter,
      input.maxBookingsPerSlot === undefined
        ? null
        : input.maxBookingsPerSlot,
    ]);

    if (!rows[0]) {
      throw new NegocioNoEncontradoException();
    }

    const updated = rows[0];

    await this.audit.log({
      userId: input.userId ?? null,
      action: AuditAction.UPDATE,
      tableName: 'businesses',
      recordId: updated.id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }
}
