/**
 * Contrato HTTP forgot / reset / change password.
 */
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter.js';
import { factoryValidacion } from '../../../common/pipes/validation.factory.js';
import { AuthController } from '../../auth.controller.js';
import { AuthService } from '../../auth.service.js';
import { CodigoResetInvalidoException } from '../../exceptions/auth.exceptions.js';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('Auth password API contract', () => {
  let app: INestApplication<App>;
  let authService: {
    forgotPassword: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
    getMe: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    logoutAll: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    authService = {
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      changePassword: vi.fn(),
      getMe: vi.fn(),
      updateProfile: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      logoutAll: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
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

  it('POST /auth/forgot-password', async () => {
    authService.forgotPassword.mockResolvedValue({ ok: true });
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'admin@agenda.local' })
      .expect(201);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /auth/reset-password propaga código inválido', async () => {
    authService.resetPassword.mockRejectedValue(
      new CodigoResetInvalidoException(),
    );
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        email: 'admin@agenda.local',
        code: '000000',
        newPassword: 'nueva123',
      })
      .expect(400);
  });

  it('POST /auth/change-password', async () => {
    authService.changePassword.mockResolvedValue({ ok: true });
    const res = await request(app.getHttpServer())
      .post('/auth/change-password')
      .send({ currentPassword: 'admin', newPassword: 'nueva123' })
      .expect(201);
    expect(res.body).toEqual({ ok: true });
    expect(authService.changePassword).toHaveBeenCalledWith(
      USER_ID,
      'admin',
      'nueva123',
    );
  });

  it('POST /auth/me', async () => {
    authService.getMe.mockResolvedValue({
      id: USER_ID,
      email: 'admin@agenda.local',
      firstName: 'Admin',
      lastName: 'Sistema',
      phoneNumber: null,
    });
    const res = await request(app.getHttpServer())
      .post('/auth/me')
      .send({})
      .expect(201);
    expect(res.body.email).toBe('admin@agenda.local');
    expect(authService.getMe).toHaveBeenCalledWith(USER_ID);
  });

  it('POST /auth/update-profile', async () => {
    authService.updateProfile.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: {
        id: USER_ID,
        email: 'admin@agenda.local',
        firstName: 'Ana',
        lastName: 'Pérez',
        phoneNumber: null,
        roles: ['admin'],
        surfaces: ['internal'],
        permissions: [],
        permVersion: 1,
      },
    });
    const res = await request(app.getHttpServer())
      .post('/auth/update-profile')
      .send({ firstName: 'Ana', lastName: 'Pérez' })
      .expect(201);
    expect(res.body.accessToken).toBe('a');
    expect(authService.updateProfile).toHaveBeenCalledWith(
      USER_ID,
      { firstName: 'Ana', lastName: 'Pérez', phoneNumber: undefined },
      expect.any(Object),
    );
  });
});
