import { Injectable, type OnModuleInit } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../../common/redis/redis.service.js';
import {
  type AuthConfig,
  isBookingAuthConfigured,
  loadAuthConfig,
  parseExpiresInToSeconds,
} from '../auth.config.js';
import {
  AuthNoConfiguradoException,
  BookingSessionInvalidaException,
  BookingSessionUsadaException,
} from '../exceptions/auth.exceptions.js';
import { JWT_ALGORITHM, isUuidV4 } from '../jwt-token.util.js';
import type {
  BookingSessionIssueResult,
  BookingSessionPayload,
  BookingSessionRecord,
} from './booking-session.types.js';

const REDIS_PREFIX = 'booking:session:';

@Injectable()
export class BookingSessionService implements OnModuleInit {
  private config: AuthConfig = loadAuthConfig();

  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    this.config = loadAuthConfig();
  }

  /**
   * Emite JWT corto + registro Redis (one-shot).
   * No crea fila en `users`.
   */
  async issueFromGoogleProfile(profile: {
    email: string;
    name: string;
    googleSub: string;
    picture?: string;
  }): Promise<BookingSessionIssueResult> {
    this.ensureConfigured();

    const jti = randomUUID();
    const ttl = parseExpiresInToSeconds(this.config.bookingExpiresIn);
    const record: BookingSessionRecord = {
      email: profile.email.trim().toLowerCase(),
      name: profile.name.trim(),
      googleSub: profile.googleSub,
      picture: profile.picture,
      used: false,
      createdAt: new Date().toISOString(),
    };

    await this.redis.setJson(`${REDIS_PREFIX}${jti}`, record, ttl);

    const payload: BookingSessionPayload = {
      type: 'booking',
      jti,
      email: record.email,
      name: record.name,
      googleSub: record.googleSub,
      picture: record.picture,
    };

    const bookingToken = await this.jwtService.signAsync(payload, {
      secret: this.config.bookingSecret,
      expiresIn: this.config.bookingExpiresIn as JwtSignOptions['expiresIn'],
      algorithm: JWT_ALGORITHM,
    });

    return {
      bookingToken,
      expiresIn: ttl,
      tokenType: 'Bearer',
      client: {
        email: record.email,
        name: record.name,
        picture: record.picture,
      },
    };
  }

  /**
   * Valida booking JWT + Redis. Lanza si ya se usó o expiró.
   * No consume (consume aparte al confirmar cita).
   */
  async assertValid(bookingToken: string): Promise<BookingSessionPayload> {
    this.ensureConfigured();
    const payload = await this.verifyToken(bookingToken);
    const record = await this.redis.getJson<BookingSessionRecord>(
      `${REDIS_PREFIX}${payload.jti}`,
    );

    if (!record) {
      throw new BookingSessionInvalidaException();
    }

    if (record.used) {
      throw new BookingSessionUsadaException();
    }

    return payload;
  }

  /** Marca one-shot como usada (tras confirmar cita). */
  async consume(bookingToken: string): Promise<BookingSessionPayload> {
    const payload = await this.assertValid(bookingToken);
    const key = `${REDIS_PREFIX}${payload.jti}`;
    const record = await this.redis.getJson<BookingSessionRecord>(key);

    if (!record) {
      throw new BookingSessionInvalidaException();
    }

    record.used = true;
    const ttl = parseExpiresInToSeconds(this.config.bookingExpiresIn);
    await this.redis.setJson(key, record, ttl);
    return payload;
  }

  async invalidate(jti: string): Promise<void> {
    if (!isUuidV4(jti)) return;
    await this.redis.del(`${REDIS_PREFIX}${jti}`);
  }

  private async verifyToken(token: string): Promise<BookingSessionPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<BookingSessionPayload>(
        token,
        {
          secret: this.config.bookingSecret,
          algorithms: [JWT_ALGORITHM],
        },
      );

      if (
        !payload ||
        payload.type !== 'booking' ||
        !isUuidV4(payload.jti) ||
        typeof payload.email !== 'string'
      ) {
        throw new BookingSessionInvalidaException();
      }

      return payload;
    } catch (error) {
      if (
        error instanceof BookingSessionInvalidaException ||
        error instanceof BookingSessionUsadaException
      ) {
        throw error;
      }
      throw new BookingSessionInvalidaException();
    }
  }

  private ensureConfigured(): void {
    this.config = loadAuthConfig();
    if (!isBookingAuthConfigured(this.config)) {
      throw new AuthNoConfiguradoException();
    }
  }
}
