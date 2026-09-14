/**
 * Contrato HTTP de POST /auth/logout (archivo dedicado; refresh queda en auth.refresh).
 * Complementa cobertura: cada endpoint auth con al menos un spec API.
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

describe('Auth logout API contract (POST /auth/logout)', () => {
  let app: INestApplication<App>;
  let authService: { logout: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    authService = { logout: vi.fn() };

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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exige refreshToken en body', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({})
      .expect(400);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('revoca refresh e idempotente ok', async () => {
    authService.logout.mockResolvedValue({ ok: true });

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'any-token' })
      .expect(201);

    expect(response.body).toEqual({ ok: true });
    expect(authService.logout).toHaveBeenCalledWith('any-token');
  });
});
