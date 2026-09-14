import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { loadAuthConfig } from './auth.config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGoogleController } from './booking/auth-google.controller.js';
import { BookingSessionService } from './booking/booking-session.service.js';
import { GoogleBookingStrategy } from './booking/google-booking.strategy.js';
import { ApiAuthorizationGuard } from './guards/api-authorization.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { JWT_ALGORITHM } from './jwt-token.util.js';
import { PermissionsService } from './permissions/permissions.service.js';
import { RefreshSessionsService } from './refresh-sessions.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'google-booking' }),
    JwtModule.register({
      global: true,
      secret: loadAuthConfig().accessSecret || undefined,
      signOptions: { algorithm: JWT_ALGORITHM },
    }),
  ],
  controllers: [AuthController, AuthGoogleController],
  providers: [
    AuthService,
    PermissionsService,
    RefreshSessionsService,
    BookingSessionService,
    GoogleBookingStrategy,
    ApiAuthorizationGuard,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    PermissionsService,
    RefreshSessionsService,
    BookingSessionService,
    ApiAuthorizationGuard,
    JwtModule,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
