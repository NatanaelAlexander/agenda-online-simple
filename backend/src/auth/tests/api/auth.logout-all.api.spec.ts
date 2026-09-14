/**
 * Contrato HTTP POST /auth/logout-all (sin DB).
 * AuthController + AuthService mock; inyecta request.user para @CurrentUser.
 */
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter.js';
import { factoryValidacion } from '../../../common/pipes/validation.factory.js';
import { AuthController } from '../../auth.controller.js';
import { AuthService } from '../../auth.service.js';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('Auth logout-all API contract (POST /auth/logout-all)', () => {
  let app: INestApplication<App>;
  let authService: { logoutAll: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    authService = { logoutAll: vi.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
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
      req.user = { sub: USER_ID };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revoca sesiones del usuario autenticado', async () => {
    authService.logoutAll.mockResolvedValue({ ok: true });

    const response = await request(app.getHttpServer())
      .post('/auth/logout-all')
      .send({})
      .expect(201);

    expect(response.body).toEqual({ ok: true });
    expect(authService.logoutAll).toHaveBeenCalledWith(USER_ID);
  });
});
