import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import type { JwtAccessPayload } from '../types/auth.types.js';

export const CurrentUser = createParamDecorator(
  (
    field: keyof JwtAccessPayload | undefined,
    ctx: ExecutionContext,
  ): JwtAccessPayload | JwtAccessPayload[keyof JwtAccessPayload] => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (field) {
      return user[field];
    }

    return user;
  },
);
