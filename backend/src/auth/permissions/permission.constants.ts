export const SUPER_ADMIN_ROLE = 'super_admin';
export const ADMIN_ROLE = 'admin';

export const PERMISSION_MODULES = [
  'users',
  'roles',
  'permissions',
  'businesses',
  'services',
  'professionals',
  'availability',
  'appointments',
  'clients',
  'assets',
  'audit_logs',
  'system',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];
