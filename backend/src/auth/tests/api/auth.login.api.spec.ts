/**
 * Contrato HTTP de POST /auth/login (sin DB ni prefijo /api).
 */
import { ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { INestApplication } from '@nestjs/common';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter.js';
import { factoryValidacion } from '../../../common/pipes/validation.factory.js';
import { AuthController } from '../../auth.controller.js';
import { AuthService } from '../../auth.service.js';
import { CredencialesInvalidasException } from '../../exceptions/auth.exceptions.js';

const LOGIN_RESULT = {
  accessToken: 'access-token-example',
  refreshToken: 'refresh-token-example',
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

describe('Auth login API contract (POST /auth/login)', () => {
  let app: INestApplication<App>;
  let authService: { login: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    authService = {
      login: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
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

  it('acepta credenciales válidas y devuelve tokens', async () => {
    authService.login.mockResolvedValue(LOGIN_RESULT);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@agenda.local', password: 'admin' })
      .expect(201);

    expect(response.body).toEqual(LOGIN_RESULT);
    expect(authService.login).toHaveBeenCalledWith(
      'admin@agenda.local',
      'admin',
      expect.objectContaining({
        userAgent: null,
        ipAddress: expect.any(String),
      }),
    );
  });

  it('rechaza email inválido con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'no-es-email', password: 'admin' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        mensaje: expect.arrayContaining([expect.stringMatching(/correo/i)]),
      }),
    );
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('rechaza password vacío con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@agenda.local', password: '' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('propaga 401 cuando las credenciales son inválidas', async () => {
    authService.login.mockRejectedValue(new CredencialesInvalidasException());

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@agenda.local', password: 'wrong' })
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      mensaje: 'Correo o contraseña incorrectos',
    });
  });
});
