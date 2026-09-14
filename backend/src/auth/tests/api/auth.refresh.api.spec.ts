/**
 * Contrato HTTP de POST /auth/refresh.
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
import { RefreshTokenInvalidoException } from '../../exceptions/auth.exceptions.js';

const REFRESH_RESULT = {
  accessToken: 'access-new',
  refreshToken: 'refresh-new',
  expiresIn: 86400,
  tokenType: 'Bearer' as const,
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@agenda.local',
    firstName: 'Admin',
    lastName: 'Sistema',
    roles: ['admin'],
    surfaces: ['internal'],
    permissions: ['appointments:read'],
    permVersion: 1,
  },
};

describe('Auth refresh API contract (POST /auth/refresh)', () => {
  let app: INestApplication<App>;
  let authService: { refresh: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    authService = { refresh: vi.fn() };

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

  it('renueva tokens con refresh válido', async () => {
    authService.refresh.mockResolvedValue(REFRESH_RESULT);

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'valid-refresh' })
      .expect(201);

    expect(response.body).toEqual(REFRESH_RESULT);
  });

  it('exige refreshToken', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('propaga 401 si el refresh es inválido', async () => {
    authService.refresh.mockRejectedValue(new RefreshTokenInvalidoException());

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'bad' })
      .expect(401);

    expect(response.body.mensaje).toBe('Sesión inválida o expirada');
  });
});
