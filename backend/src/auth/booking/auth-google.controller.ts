import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from '../../common/exceptions/app.exception.js';
import { Public } from '../decorators/public.decorator.js';
import { BookingSessionService } from './booking-session.service.js';
import type { GoogleBookingProfile } from './google-booking.strategy.js';

/**
 * Google OAuth solo para booking one-shot (cliente).
 * No crea `users`. Tras confirmar cita: BookingSessionService.consume().
 */
@ApiTags('Auth · Booking Google')
@UseGuards(ThrottlerGuard)
@Controller('auth/google')
export class AuthGoogleController {
  constructor(private readonly bookingSessions: BookingSessionService) {}

  @Public()
  @Get()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(AuthGuard('google-booking'))
  @ApiOperation({
    summary: 'Iniciar Google OAuth (reserva)',
    description:
      'Redirige a Google. Solo identidad para agendar; no es login del panel.',
  })
  googleAuth(): void {
    // Passport redirige
  }

  @Public()
  @Get('callback')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(AuthGuard('google-booking'))
  @ApiOperation({ summary: 'Callback Google → booking session JWT' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async googleCallback(
    @Req() request: Request & { user?: GoogleBookingProfile },
    @Res() response: Response,
  ): Promise<void> {
    const profile = request.user;
    if (!profile?.email) {
      response.status(401).json({
        statusCode: 401,
        mensaje: 'No se pudo autenticar con Google',
      });
      return;
    }

    const session = await this.bookingSessions.issueFromGoogleProfile(profile);

    const frontendBase =
      process.env.BOOKING_FRONTEND_REDIRECT?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      'http://localhost:3001';

    const redirectUrl = new URL('/r/booking/callback', frontendBase);
    redirectUrl.searchParams.set('booking_token', session.bookingToken);

    response.redirect(redirectUrl.toString());
  }
}
