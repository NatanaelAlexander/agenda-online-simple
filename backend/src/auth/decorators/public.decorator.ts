import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'is_public';

/** Omite JWT y permisos (login, health, Google OAuth). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
