import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service.js';
import { ClienteNoEncontradoException } from './exceptions/client.exceptions.js';
import {
  SQL_CLIENT_VISIT_COUNT,
  SQL_COUNT_CLIENTS_BASE,
  SQL_DELETE_CLIENT,
  SQL_FIND_ALL_CLIENTS_BASE,
  SQL_FIND_CLIENT_BY_EMAIL,
  SQL_FIND_CLIENT_BY_GOOGLE_SUB,
  SQL_FIND_CLIENT_BY_ID,
  SQL_INSERT_CLIENT,
  SQL_UPDATE_CLIENT,
} from './queries/client.queries.js';
import type {
  Client,
  ClientFilters,
  CreateClientInput,
  PaginatedClients,
  UpdateClientInput,
  UpsertByGoogleInput,
} from './types/client.types.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class ClientsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(filters: ClientFilters = {}): Promise<PaginatedClients> {
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
    if (filters.search) {
      conditions.push(
        `(full_name ILIKE $${index} OR email ILIKE $${index} OR phone ILIKE $${index})`,
      );
      params.push(`%${filters.search}%`);
      index++;
    }
    if (filters.fullName?.trim()) {
      conditions.push(`full_name ILIKE $${index++}`);
      params.push(`%${filters.fullName.trim()}%`);
    }
    if (filters.email?.trim()) {
      conditions.push(`email ILIKE $${index++}`);
      params.push(`%${filters.email.trim()}%`);
    }
    if (filters.phone?.trim()) {
      conditions.push(`phone ILIKE $${index++}`);
      params.push(`%${filters.phone.trim()}%`);
    }
    if (filters.minVisits != null && filters.minVisits > 0) {
      conditions.push(`${SQL_CLIENT_VISIT_COUNT} >= $${index++}`);
      params.push(filters.minVisits);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortBy = filters.sortBy ?? 'name';
    const sortDir = (filters.sortDir ?? (sortBy === 'visits' ? 'desc' : 'asc'))
      .toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC';

    const orderBy =
      sortBy === 'visits'
        ? `"visitCount" ${sortDir}, full_name ASC`
        : `full_name ${sortDir}`;

    const countResult = await this.db.query<{ total: number }>(
      `${SQL_COUNT_CLIENTS_BASE} ${where}`,
      params,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const { rows } = await this.db.query<Client>(
      `${SQL_FIND_ALL_CLIENTS_BASE}
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${index}
       OFFSET $${index + 1}`,
      [...params, pageSize, offset],
    );

    return { items: rows, total, page, pageSize };
  }

  async findById(id: string): Promise<Client> {
    const { rows } = await this.db.query<Client>(SQL_FIND_CLIENT_BY_ID, [id]);
    if (!rows[0]) {
      throw new ClienteNoEncontradoException();
    }
    return rows[0];
  }

  async create(input: CreateClientInput): Promise<Client> {
    const { rows } = await this.db.query<Client>(SQL_INSERT_CLIENT, [
      input.businessId,
      input.fullName,
      input.phone ?? null,
      input.email ?? null,
      input.googleSub ?? null,
      input.notes ?? null,
    ]);
    return { ...rows[0], visitCount: 0 };
  }

  async update(input: UpdateClientInput): Promise<Client> {
    await this.findById(input.id);
    const { rows } = await this.db.query<Client>(SQL_UPDATE_CLIENT, [
      input.id,
      input.fullName ?? null,
      input.phone === undefined ? null : input.phone,
      input.email === undefined ? null : input.email,
      input.googleSub === undefined ? null : input.googleSub,
      input.notes === undefined ? null : input.notes,
    ]);
    if (!rows[0]) {
      throw new ClienteNoEncontradoException();
    }
    return this.findById(rows[0].id);
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.findById(id);
    await this.db.query(SQL_DELETE_CLIENT, [id]);
    return { id };
  }

  /** Upsert por google_sub o email del mismo negocio (flujo de reserva). */
  async upsertByGoogle(input: UpsertByGoogleInput): Promise<Client> {
    const bySub = await this.db.query<Client>(SQL_FIND_CLIENT_BY_GOOGLE_SUB, [
      input.businessId,
      input.googleSub,
    ]);
    if (bySub.rows[0]) {
      return this.update({
        id: bySub.rows[0].id,
        fullName: input.fullName,
        email: input.email,
        googleSub: input.googleSub,
        phone: input.phone ?? bySub.rows[0].phone,
      });
    }

    const byEmail = await this.db.query<Client>(SQL_FIND_CLIENT_BY_EMAIL, [
      input.businessId,
      input.email,
    ]);
    if (byEmail.rows[0]) {
      return this.update({
        id: byEmail.rows[0].id,
        fullName: input.fullName,
        email: input.email,
        googleSub: input.googleSub,
        phone: input.phone ?? byEmail.rows[0].phone,
      });
    }

    return this.create({
      businessId: input.businessId,
      fullName: input.fullName,
      email: input.email,
      googleSub: input.googleSub,
      phone: input.phone ?? null,
    });
  }
}
