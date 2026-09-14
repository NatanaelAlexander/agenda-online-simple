export interface AuthConfig {
  accessSecret: string;
  refreshSecret: string;
  bookingSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  bookingExpiresIn: string;
}

export function loadAuthConfig(): AuthConfig {
  return {
    accessSecret: process.env.JWT_ACCESS_SECRET?.trim() ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET?.trim() ?? '',
    bookingSecret:
      process.env.JWT_BOOKING_SECRET?.trim() ||
      process.env.JWT_ACCESS_SECRET?.trim() ||
      '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || '7d',
    bookingExpiresIn: process.env.JWT_BOOKING_EXPIRES_IN?.trim() || '15m',
  };
}

export function isAuthConfigured(config: AuthConfig): boolean {
  return Boolean(config.accessSecret && config.refreshSecret);
}

export function isBookingAuthConfigured(config: AuthConfig): boolean {
  return Boolean(config.bookingSecret);
}

/** Convierte `12h`, `1d`, `15m`… a segundos. */
export function parseExpiresInToSeconds(raw: string): number {
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) {
    return 43_200;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 43_200;
  }
}
