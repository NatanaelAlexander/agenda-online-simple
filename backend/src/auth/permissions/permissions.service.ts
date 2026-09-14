import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service.js';
import {
  SQL_FIND_USER_PERMISSIONS,
  SQL_FIND_USER_PERMISSIONS_VERSION,
  SQL_FIND_USER_ROLES,
} from '../queries/authorization.queries.js';
import type { AuthSurface } from '../types/auth.types.js';
import { SUPER_ADMIN_ROLE } from './permission.constants.js';
import type { UserAuthorization } from './permissions.types.js';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: UserAuthorization;
  expiresAt: number;
}

@Injectable()
export class PermissionsService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly db: DatabaseService) {}

  async resolveAuthorization(
    userId: string,
  ): Promise<UserAuthorization | null> {
    const { rows: versionRows } = await this.db.query<{
      permissionsVersion: number;
    }>(SQL_FIND_USER_PERMISSIONS_VERSION, [userId]);

    if (!versionRows[0]) {
      this.cache.delete(userId);
      return null;
    }

    const currentVersion = versionRows[0].permissionsVersion;
    const cached = this.cache.get(userId);
    if (
      cached &&
      cached.expiresAt > Date.now() &&
      cached.value.permissionsVersion === currentVersion
    ) {
      return cached.value;
    }

    const [roles, permissions] = await Promise.all([
      this.findUserRoles(userId),
      this.findUserPermissions(userId),
    ]);

    const authorization: UserAuthorization = {
      userId,
      roles,
      permissions,
      surfaces: this.resolveSurfaces(roles),
      permissionsVersion: currentVersion,
    };

    this.cache.set(userId, {
      value: authorization,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return authorization;
  }

  invalidateUser(userId: string): void {
    this.cache.delete(userId);
  }

  isSuperAdmin(roles: string[]): boolean {
    return roles.includes(SUPER_ADMIN_ROLE);
  }

  hasSystemManage(permissions: string[]): boolean {
    return permissions.includes('system:manage');
  }

  bypassesPermissionChecks(authorization: UserAuthorization): boolean {
    return (
      this.isSuperAdmin(authorization.roles) ||
      this.hasSystemManage(authorization.permissions)
    );
  }

  private async findUserRoles(userId: string): Promise<string[]> {
    const { rows } = await this.db.query<{ name: string }>(
      SQL_FIND_USER_ROLES,
      [userId],
    );
    return rows.map((row) => row.name);
  }

  private async findUserPermissions(userId: string): Promise<string[]> {
    const { rows } = await this.db.query<{ name: string }>(
      SQL_FIND_USER_PERMISSIONS,
      [userId],
    );
    return rows.map((row) => row.name);
  }

  private resolveSurfaces(roles: string[]): AuthSurface[] {
    if (
      roles.some((role) => role === 'admin' || role === SUPER_ADMIN_ROLE)
    ) {
      return ['internal'];
    }
    return [];
  }
}
