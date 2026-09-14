import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { loadSecurityConfig } from './security.config.js';

export function setupSecurity(app: INestApplication): void {
  const config = loadSecurityConfig();

  if (config.trustProxy) {
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance() as {
      set?: (key: string, value: unknown) => void;
    };
    instance.set?.('trust proxy', 1);
  }

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });
}
