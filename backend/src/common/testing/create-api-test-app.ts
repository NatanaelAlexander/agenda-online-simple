/**
 * App mínima para tests/api (patrón TPD).
 * Inyecta request.user para @CurrentUser sin montar JwtAuthGuard.
 */
import {
  type INestApplication,
  type Type,
  ValidationPipe,
  type Provider,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppExceptionFilter } from '../filters/app-exception.filter.js';
import { factoryValidacion } from '../pipes/validation.factory.js';

export const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function createApiTestApp(options: {
  controllers: Type<unknown>[];
  providers: Provider[];
  user?: Record<string, unknown>;
}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: options.controllers,
    providers: options.providers,
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: factoryValidacion,
    }),
  );
  app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = options.user ?? {
      sub: TEST_USER_ID,
      email: 'test@agenda.local',
      firstName: 'Test',
      lastName: 'User',
      roles: ['admin'],
      permissions: [],
      permVersion: 1,
      type: 'access',
    };
    next();
  });
  await app.init();
  return app;
}
