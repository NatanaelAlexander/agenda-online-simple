import { SetMetadata } from '@nestjs/common';
import type { PermissionModule } from '../permissions/permission.constants.js';
import type { AuthSurface } from '../types/auth.types.js';

export const AUTHORIZE_RESOURCE_KEY = 'authorize_resource';
export const AUTHORIZE_SURFACE_KEY = 'authorize_surface';
export const AUTHORIZE_ACTION_KEY = 'authorize_action';
export const AUTHENTICATED_ONLY_KEY = 'authenticated_only';

export const AuthorizeResource = (resource: PermissionModule) =>
  SetMetadata(AUTHORIZE_RESOURCE_KEY, resource);

export const AuthorizeSurface = (surface: AuthSurface) =>
  SetMetadata(AUTHORIZE_SURFACE_KEY, surface);

export const AuthorizeAction = (action: string) =>
  SetMetadata(AUTHORIZE_ACTION_KEY, action);

export const AuthenticatedOnly = () =>
  SetMetadata(AUTHENTICATED_ONLY_KEY, true);
