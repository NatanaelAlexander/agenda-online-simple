import { Injectable, type OnModuleInit } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database/database.service.js';
import { MailService } from '../common/mail/mail.service.js';
import { passwordResetEmailHtml } from '../common/mail/mail.templates.js';
import {
  type AuthConfig,
  isAuthConfigured,
  loadAuthConfig,
  parseExpiresInToSeconds,
} from './auth.config.js';
import {
  AuthNoConfiguradoException,
  CodigoResetInvalidoException,
  ContrasenaActualIncorrectaException,
  CredencialesInvalidasException,
  RefreshTokenInvalidoException,
  TokenAccesoInvalidoException,
} from './exceptions/auth.exceptions.js';
import {
  accessTokenSignOptions,
  accessTokenVerifyOptions,
  assertAccessTokenPayload,
  assertRefreshTokenPayload,
  refreshTokenSignOptions,
  refreshTokenVerifyOptions,
} from './jwt-token.util.js';
import { PermissionsService } from './permissions/permissions.service.js';
import { RefreshSessionsService } from './refresh-sessions.service.js';
import {
  SQL_FIND_USER_BY_EMAIL_AND_PASSWORD,
  SQL_FIND_USER_BY_ID_ACTIVE,
  SQL_UPDATE_USER_PROFILE,
} from './queries/auth.queries.js';
import {
  SQL_FIND_USER_ID_BY_EMAIL,
  SQL_FIND_VALID_PASSWORD_RESET,
  SQL_MARK_PASSWORD_RESET_USED,
  SQL_UPDATE_PASSWORD,
  SQL_UPSERT_PASSWORD_RESET_CODE,
  SQL_VERIFY_PASSWORD,
} from './queries/password.queries.js';
import type {
  AuthLoginResult,
  AuthTokens,
  AuthUser,
  JwtAccessPayload,
  JwtRefreshPayload,
} from './types/auth.types.js';
import type { SessionClientContext } from './types/refresh-session.types.js';

const LOGIN_FAILURE_DELAY_MS = 400;
const RESET_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService implements OnModuleInit {
  private config: AuthConfig = loadAuthConfig();

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
    private readonly refreshSessions: RefreshSessionsService,
    private readonly mail: MailService,
  ) {}

  onModuleInit(): void {
    this.config = loadAuthConfig();
  }

  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    this.ensureConfigured();

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        accessTokenVerifyOptions(this.config.accessSecret),
      );

      assertAccessTokenPayload(payload);

      return payload;
    } catch (error) {
      if (error instanceof TokenAccesoInvalidoException) {
        throw error;
      }
      throw new TokenAccesoInvalidoException();
    }
  }

  async login(
    email: string,
    password: string,
    context: SessionClientContext = {},
  ): Promise<AuthLoginResult> {
    this.ensureConfigured();

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.findUserByCredentials(normalizedEmail, password);

    if (!user || !user.isActive) {
      await this.delay(LOGIN_FAILURE_DELAY_MS);
      throw new CredencialesInvalidasException();
    }

    this.permissionsService.invalidateUser(user.id);
    const authorization = await this.permissionsService.resolveAuthorization(
      user.id,
    );

    if (!authorization) {
      throw new CredencialesInvalidasException();
    }

    const tokens = await this.issueTokens(user, authorization, context);

    return {
      ...tokens,
      user: this.buildUserResponse(user, authorization),
    };
  }

  async refresh(
    refreshToken: string,
    context: SessionClientContext = {},
  ): Promise<AuthLoginResult> {
    this.ensureConfigured();

    const payload = await this.verifyRefreshToken(refreshToken);

    await this.refreshSessions.assertValidForRefresh(
      refreshToken,
      payload.sid,
      payload.sub,
    );

    const user = await this.findActiveUserById(payload.sub);
    if (!user) {
      throw new RefreshTokenInvalidoException();
    }

    this.permissionsService.invalidateUser(user.id);
    const authorization = await this.permissionsService.resolveAuthorization(
      user.id,
    );

    if (!authorization) {
      throw new RefreshTokenInvalidoException();
    }

    const tokens = await this.issueTokens(user, authorization, context, {
      rotateFromSessionId: payload.sid,
    });

    return {
      ...tokens,
      user: this.buildUserResponse(user, authorization),
    };
  }

  async logout(refreshToken: string): Promise<{ ok: true }> {
    this.ensureConfigured();

    const payload = this.decodeRefreshTokenLoose(refreshToken);
    if (!payload?.sid || !payload.sub) {
      return { ok: true };
    }

    await this.refreshSessions.revokeSession(payload.sid, payload.sub);
    return { ok: true };
  }

  async logoutAll(userId: string): Promise<{ ok: true }> {
    this.ensureConfigured();
    await this.refreshSessions.revokeAllForUser(userId);
    return { ok: true };
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.refreshSessions.revokeAllForUser(userId);
  }

  /**
   * Siempre responde ok (no revela si el email existe).
   */
  async forgotPassword(email: string): Promise<{ ok: true }> {
    const normalized = email.trim().toLowerCase();
    const { rows } = await this.db.query<{
      id: string;
      email: string;
      firstName: string;
    }>(SQL_FIND_USER_ID_BY_EMAIL, [normalized]);

    const user = rows[0];
    if (!user) {
      return { ok: true };
    }

    const code = String(randomInt(100_000, 999_999));
    const codeHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);

    await this.db.query(SQL_UPSERT_PASSWORD_RESET_CODE, [
      user.id,
      codeHash,
      expiresAt,
    ]);

    await this.mail.send({
      to: user.email,
      subject: 'Código para recuperar contraseña',
      html: passwordResetEmailHtml(code),
    });

    return { ok: true };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const normalized = email.trim().toLowerCase();
    const { rows: users } = await this.db.query<{ id: string }>(
      SQL_FIND_USER_ID_BY_EMAIL,
      [normalized],
    );
    const user = users[0];
    if (!user) {
      throw new CodigoResetInvalidoException();
    }

    const { rows } = await this.db.query<{
      id: string;
      userId: string;
      codeHash: string;
    }>(SQL_FIND_VALID_PASSWORD_RESET, [user.id]);

    const reset = rows[0];
    const codeHash = createHash('sha256').update(code.trim()).digest('hex');
    if (!reset || reset.codeHash !== codeHash) {
      throw new CodigoResetInvalidoException();
    }

    await this.db.query(SQL_UPDATE_PASSWORD, [user.id, newPassword]);
    await this.db.query(SQL_MARK_PASSWORD_RESET_USED, [reset.id]);
    await this.refreshSessions.revokeAllForUser(user.id);
    return { ok: true };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const { rows } = await this.db.query<{ id: string }>(SQL_VERIFY_PASSWORD, [
      userId,
      currentPassword,
    ]);
    if (!rows[0]) {
      throw new ContrasenaActualIncorrectaException();
    }

    await this.db.query(SQL_UPDATE_PASSWORD, [userId, newPassword]);
    await this.refreshSessions.revokeAllForUser(userId);
    return { ok: true };
  }

  async getMe(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  }> {
    const user = await this.findActiveUserById(userId);
    if (!user) {
      throw new TokenAccesoInvalidoException();
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? null,
    };
  }

  async updateProfile(
    userId: string,
    input: {
      firstName: string;
      lastName: string;
      phoneNumber?: string | null;
    },
    context: SessionClientContext = {},
  ): Promise<AuthLoginResult> {
    this.ensureConfigured();

    const existing = await this.findActiveUserById(userId);
    if (!existing) {
      throw new TokenAccesoInvalidoException();
    }

    const phoneNumber =
      input.phoneNumber === undefined
        ? (existing.phoneNumber ?? null)
        : input.phoneNumber?.trim() || null;

    const { rows } = await this.db.query<AuthUser>(SQL_UPDATE_USER_PROFILE, [
      userId,
      input.firstName.trim(),
      input.lastName.trim(),
      phoneNumber,
    ]);
    const user = rows[0];
    if (!user) {
      throw new TokenAccesoInvalidoException();
    }

    this.permissionsService.invalidateUser(user.id);
    const authorization = await this.permissionsService.resolveAuthorization(
      user.id,
    );
    if (!authorization) {
      throw new CredencialesInvalidasException();
    }

    await this.refreshSessions.revokeAllForUser(user.id);
    const tokens = await this.issueTokens(user, authorization, context);

    return {
      ...tokens,
      user: this.buildUserResponse(user, authorization),
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<JwtRefreshPayload> {
    try {
      const verified = await this.jwtService.verifyAsync(
        refreshToken,
        refreshTokenVerifyOptions(this.config.refreshSecret),
      );
      assertRefreshTokenPayload(verified);
      return verified;
    } catch (error) {
      if (error instanceof RefreshTokenInvalidoException) {
        throw error;
      }
      throw new RefreshTokenInvalidoException();
    }
  }

  private decodeRefreshTokenLoose(
    refreshToken: string,
  ): Partial<JwtRefreshPayload> | null {
    const decoded = this.jwtService.decode(refreshToken);
    if (!decoded || typeof decoded === 'string') {
      return null;
    }

    return decoded as Partial<JwtRefreshPayload>;
  }

  private async findUserByCredentials(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const { rows } = await this.db.query<AuthUser>(
      SQL_FIND_USER_BY_EMAIL_AND_PASSWORD,
      [email, password],
    );
    return rows[0] ?? null;
  }

  private async findActiveUserById(id: string): Promise<AuthUser | null> {
    const { rows } = await this.db.query<AuthUser>(SQL_FIND_USER_BY_ID_ACTIVE, [
      id,
    ]);
    return rows[0] ?? null;
  }

  private buildAccessPayload(
    user: AuthUser,
    authorization: NonNullable<
      Awaited<ReturnType<PermissionsService['resolveAuthorization']>>
    >,
  ): JwtAccessPayload {
    return {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: authorization.roles,
      surfaces: authorization.surfaces,
      permissions: authorization.permissions,
      permVersion: authorization.permissionsVersion,
      type: 'access',
    };
  }

  private async issueTokens(
    user: AuthUser,
    authorization: NonNullable<
      Awaited<ReturnType<PermissionsService['resolveAuthorization']>>
    >,
    context: SessionClientContext = {},
    options: { rotateFromSessionId?: string } = {},
  ): Promise<AuthTokens> {
    const accessPayload = this.buildAccessPayload(user, authorization);
    const sessionId = randomUUID();

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      sid: sessionId,
      type: 'refresh',
    };

    const accessExpiresIn = this.config.accessExpiresIn;

    const accessSignOptions = accessTokenSignOptions(
      this.config.accessSecret,
      accessExpiresIn as JwtSignOptions['expiresIn'],
    );

    const refreshSignOptions = refreshTokenSignOptions(
      this.config.refreshSecret,
      this.config.refreshExpiresIn as JwtSignOptions['expiresIn'],
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, accessSignOptions),
      this.jwtService.signAsync(refreshPayload, refreshSignOptions),
    ]);

    await this.refreshSessions.createSession(
      sessionId,
      user.id,
      refreshToken,
      this.config.refreshExpiresIn,
      context,
    );

    if (options.rotateFromSessionId) {
      await this.refreshSessions.revokeSession(
        options.rotateFromSessionId,
        user.id,
        sessionId,
      );
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: parseExpiresInToSeconds(accessExpiresIn),
      tokenType: 'Bearer',
    };
  }

  private buildUserResponse(
    user: AuthUser,
    authorization: NonNullable<
      Awaited<ReturnType<PermissionsService['resolveAuthorization']>>
    >,
  ) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? null,
      roles: authorization.roles,
      surfaces: authorization.surfaces,
      permissions: authorization.permissions,
      permVersion: authorization.permissionsVersion,
    };
  }

  private ensureConfigured(): void {
    this.config = loadAuthConfig();
    if (!isAuthConfigured(this.config)) {
      throw new AuthNoConfiguradoException();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
