import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

export interface GoogleBookingProfile {
  email: string;
  name: string;
  googleSub: string;
  picture?: string;
}

@Injectable()
export class GoogleBookingStrategy extends PassportStrategy(
  Strategy,
  'google-booking',
) {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID?.trim() ?? '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? '';
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL?.trim() ||
      'http://localhost:3000/api/auth/google/callback';

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google no entregó email'), undefined);
      return;
    }

    const result: GoogleBookingProfile = {
      email,
      name: profile.displayName || email,
      googleSub: profile.id,
      picture: profile.photos?.[0]?.value,
    };

    done(null, result);
  }
}
