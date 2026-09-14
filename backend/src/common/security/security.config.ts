export interface SecurityConfig {
  throttleTtlMs: number;
  throttleLimit: number;
  trustProxy: boolean;
  corsOrigins: string[];
  /** OpenAPI + Scalar. On en dev; off en production salvo SWAGGER_ENABLED=true. */
  swaggerEnabled: boolean;
}

export function loadSecurityConfig(): SecurityConfig {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    throttleTtlMs: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
    throttleLimit: Number(process.env.THROTTLE_LIMIT ?? 60),
    trustProxy: process.env.TRUST_PROXY === 'true',
    corsOrigins: (process.env.CORS_ORIGINS ??
      'http://localhost:3001,http://agenda.localhost')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    swaggerEnabled:
      process.env.SWAGGER_ENABLED === 'true' ||
      (process.env.SWAGGER_ENABLED !== 'false' && nodeEnv !== 'production'),
  };
}
