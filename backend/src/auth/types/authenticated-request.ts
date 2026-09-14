import type { Request } from 'express';
import type { UserAuthorization } from '../permissions/permissions.types.js';
import type { JwtAccessPayload } from './auth.types.js';

export interface AuthenticatedRequest extends Request {
  user: JwtAccessPayload;
  authorization?: UserAuthorization;
}
