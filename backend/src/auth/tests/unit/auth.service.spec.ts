import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../../common/database/database.service.js';
import { MailService } from '../../../common/mail/mail.service.js';
import { AuthService } from '../../auth.service.js';
import {
  RefreshTokenInvalidoException,
  TokenAccesoInvalidoException,
} from '../../exceptions/auth.exceptions.js';
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
} from '../../jwt-token.util.js';
import { PermissionsService } from '../../permissions/permissions.service.js';
import { RefreshSessionsService } from '../../refresh-sessions.service.js';

const ACCESS_SECRET = 'test-access-secret-32-chars-minimum!!';
const REFRESH_SECRET = 'test-refresh-secret-32-chars-minimum!';
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const SESSION_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('AuthService JWT verification', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  const refreshSessionsMock = {
    hashToken: vi.fn(),
    createSession: vi.fn(),
    assertValidForRefresh: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllForUser: vi.fn(),
    computeExpiresAt: vi.fn(),
  };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: DatabaseService,
          useValue: { query: vi.fn() },
        },
        {
          provide: PermissionsService,
          useValue: {
            invalidateUser: vi.fn(),
            resolveAuthorization: vi.fn(),
          },
        },
        {
          provide: RefreshSessionsService,
          useValue: refreshSessionsMock,
        },
        {
          provide: MailService,
          useValue: { send: vi.fn().mockResolvedValue({ id: null, skipped: true }) },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
    authService.onModuleInit();
  });

  it('rechaza un Bearer arbitrario que no es JWT', async () => {
    await expect(
      authService.verifyAccessToken('cualquier-cosa'),
    ).rejects.toBeInstanceOf(TokenAccesoInvalidoException);
  });

  it('rechaza un JWT firmado con otro secreto', async () => {
    const foreignToken = await jwtService.signAsync(
      { sub: USER_ID, type: 'access', permVersion: 1 },
      accessTokenSignOptions('otro-secreto-completamente-distinto', '1h'),
    );

    await expect(
      authService.verifyAccessToken(foreignToken),
    ).rejects.toBeInstanceOf(TokenAccesoInvalidoException);
  });

  it('rechaza un refresh token usado como access token', async () => {
    const refreshAsAccess = await jwtService.signAsync(
      { sub: USER_ID, sid: SESSION_ID, type: 'refresh' },
      refreshTokenSignOptions(REFRESH_SECRET, '1h'),
    );

    await expect(
      authService.verifyAccessToken(refreshAsAccess),
    ).rejects.toBeInstanceOf(TokenAccesoInvalidoException);
  });

  it('acepta un access token válido', async () => {
    const token = await jwtService.signAsync(
      {
        sub: USER_ID,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['admin'],
        surfaces: ['internal'],
        permissions: ['appointments:read'],
        permVersion: 1,
        type: 'access',
      },
      accessTokenSignOptions(ACCESS_SECRET, '1h'),
    );

    const payload = await authService.verifyAccessToken(token);

    expect(payload.sub).toBe(USER_ID);
    expect(payload.type).toBe('access');
  });

  it('rechaza refresh token con sub inválido', async () => {
    const badRefresh = await jwtService.signAsync(
      { sub: 'no-es-uuid', sid: SESSION_ID, type: 'refresh' },
      refreshTokenSignOptions(REFRESH_SECRET, '1h'),
    );

    await expect(authService.refresh(badRefresh)).rejects.toBeInstanceOf(
      RefreshTokenInvalidoException,
    );
  });

  it('logout revoca la sesión cuando el refresh es decodificable', async () => {
    const refreshToken = await jwtService.signAsync(
      { sub: USER_ID, sid: SESSION_ID, type: 'refresh' },
      refreshTokenSignOptions(REFRESH_SECRET, '1h'),
    );

    await expect(authService.logout(refreshToken)).resolves.toEqual({
      ok: true,
    });
    expect(refreshSessionsMock.revokeSession).toHaveBeenCalledWith(
      SESSION_ID,
      USER_ID,
    );
  });

  it('logout es idempotente con token basura', async () => {
    await expect(authService.logout('no-jwt')).resolves.toEqual({ ok: true });
    expect(refreshSessionsMock.revokeSession).not.toHaveBeenCalled();
  });
});
