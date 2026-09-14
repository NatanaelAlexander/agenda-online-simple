export type AuthTokenType = 'access' | 'refresh';

export type AuthSurface = 'internal';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  permissionsVersion: number;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  surfaces: AuthSurface[];
  permissions: string[];
  permVersion: number;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthLoginResult extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    roles: string[];
    surfaces: AuthSurface[];
    permissions: string[];
    permVersion: number;
  };
}
