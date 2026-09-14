import type { AuthSurface } from '../types/auth.types.js';

export interface UserAuthorization {
  userId: string;
  roles: string[];
  permissions: string[];
  surfaces: AuthSurface[];
  permissionsVersion: number;
}

export type PermissionMatchMode = 'all' | 'any';
