/**
 * Contrato HTTP GET /auth/google y /auth/google/callback (sin Google real ni Redis).
 * AuthGuard mockeado; BookingSessionService mockeado.
 */
import {
  CanActivate,
  ExecutionContext,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter.js';
import { factoryValidacion } from '../../../common/pipes/validation.factory.js';
import { AuthGoogleController } from '../../booking/auth-google.controller.js';
import { BookingSessionService } from '../../booking/booking-session.service.js';

class MockGoogleAuthGuard implements CanActivate {
  constructor(private readonly profile: Record<string, unknown> | null) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: unknown }>();
    if (this.profile) {
      req.user = this.profile;
    }
    return true;
  }
}

describe('Auth Google booking API contract', () => {
  let app: INestApplication<App>;
  let bookingSessions: {
    issueFromGoogleProfile: ReturnType<typeof vi.fn>;
  };

  async function createApp(
    profile: Record<string, unknown> | null,
  ): Promise<INestApplication<App>> {
    bookingSessions = {
      issueFromGoogleProfile: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthGoogleController],
      providers: [
        { provide: BookingSessionService, useValue: bookingSessions },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard('google-booking'))
      .useValue(new MockGoogleAuthGuard(profile))
      .compile();

    const nestApp = moduleFixture.createNestApplication();
    nestApp.useGlobalFilters(new AppExceptionFilter());
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: factoryValidacion,
      }),
    );
    await nestApp.init();
    return nestApp;
  }

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /auth/google pasa el guard (inicio OAuth)', async () => {
    app = await createApp({
      email: 'cliente@gmail.com',
      name: 'Cliente',
      googleSub: 'g-1',
    });

    await request(app.getHttpServer()).get('/auth/google').expect(200);
  });

  it('GET /auth/google/callback sin email → 401', async () => {
    app = await createApp({ name: 'Sin email', googleSub: 'g-1' });

    const response = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      mensaje: 'No se pudo autenticar con Google',
    });
    expect(bookingSessions.issueFromGoogleProfile).not.toHaveBeenCalled();
  });

  it('GET /auth/google/callback con perfil → redirect con booking_token', async () => {
    process.env.BOOKING_FRONTEND_REDIRECT = 'http://localhost:3001';

    app = await createApp({
      email: 'cliente@gmail.com',
      name: 'Cliente Demo',
      googleSub: 'google-123',
    });

    bookingSessions.issueFromGoogleProfile.mockResolvedValue({
      bookingToken: 'booking-jwt-example',
      expiresIn: 900,
      tokenType: 'Bearer',
      client: {
        email: 'cliente@gmail.com',
        name: 'Cliente Demo',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(302);

    expect(response.headers.location).toBe(
      'http://localhost:3001/r/booking/callback?booking_token=booking-jwt-example',
    );
    expect(bookingSessions.issueFromGoogleProfile).toHaveBeenCalledWith({
      email: 'cliente@gmail.com',
      name: 'Cliente Demo',
      googleSub: 'google-123',
    });
  });
});
