import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { PermissionMatchMode } from '../permissions/permissions.types.js';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';
export const PERMISSIONS_MATCH_MODE_KEY = 'permissions_match_mode';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);

export const RequireAnyPermission = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions),
    SetMetadata(
      PERMISSIONS_MATCH_MODE_KEY,
      'any' satisfies PermissionMatchMode,
    ),
  );

export const PermissionMatch = (mode: PermissionMatchMode) =>
  SetMetadata(PERMISSIONS_MATCH_MODE_KEY, mode);
