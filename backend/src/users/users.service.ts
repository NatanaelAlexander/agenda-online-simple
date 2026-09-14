import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service.js';
import {
  RolNoEncontradoException,
  RolUsuarioInvalidoException,
  UsuarioEmailDuplicadoException,
  UsuarioNoEncontradoException,
} from './exceptions/users.exceptions.js';
import {
  SQL_ASSIGN_USER_ROLE,
  SQL_COUNT_USERS,
  SQL_FIND_ROLE_BY_NAME,
  SQL_FIND_USER_BY_ID,
  SQL_FIND_USERS,
  SQL_INSERT_USER,
} from './queries/users.queries.js';
import type {
  CreateStaffUserInput,
  FilterStaffUsers,
  PaginatedStaffUsers,
  StaffRoleCode,
  StaffUser,
} from './types/users.types.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const ALLOWED_ROLES: StaffRoleCode[] = ['admin', 'super_admin'];

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(filters: FilterStaffUsers = {}): Promise<PaginatedStaffUsers> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const [countResult, listResult] = await Promise.all([
      this.db.query<{ total: number }>(SQL_COUNT_USERS),
      this.db.query<StaffUser>(SQL_FIND_USERS, [pageSize, offset]),
    ]);

    return {
      items: listResult.rows.map(normalizeUser),
      total: countResult.rows[0]?.total ?? 0,
      page,
      pageSize,
    };
  }

  async create(input: CreateStaffUserInput): Promise<StaffUser> {
    const role = input.role;
    if (!ALLOWED_ROLES.includes(role)) {
      throw new RolUsuarioInvalidoException();
    }

    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const phoneNumber = input.phoneNumber?.trim() || null;

    const roleResult = await this.db.query<{ id: string; name: string }>(
      SQL_FIND_ROLE_BY_NAME,
      [role],
    );
    if (!roleResult.rows[0]) {
      throw new RolNoEncontradoException();
    }

    try {
      const userId = await this.db.transaction(async (query) => {
        const inserted = await query<{ id: string }>(SQL_INSERT_USER, [
          email,
          input.password,
          firstName,
          lastName,
          phoneNumber,
        ]);
        const id = inserted.rows[0].id;
        await query(SQL_ASSIGN_USER_ROLE, [id, roleResult.rows[0].id]);
        return id;
      });

      return this.findById(userId);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UsuarioEmailDuplicadoException();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<StaffUser> {
    const { rows } = await this.db.query<StaffUser>(SQL_FIND_USER_BY_ID, [id]);
    if (!rows[0]) {
      throw new UsuarioNoEncontradoException();
    }
    return normalizeUser(rows[0]);
  }
}

function normalizeUser(row: StaffUser): StaffUser {
  return {
    ...row,
    roles: Array.isArray(row.roles) ? row.roles : [],
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}
