import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { parseBearerToken } from '../jwt-token.util.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = parseBearerToken(request.headers.authorization);
    request.user = await this.authService.verifyAccessToken(token);
    return true;
  }
}
