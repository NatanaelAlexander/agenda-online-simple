import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import {
  AUTHORIZE_ACTION_KEY,
  AUTHORIZE_RESOURCE_KEY,
  AUTHORIZE_SURFACE_KEY,
} from '../decorators/authorize.decorator.js';
import {
  PERMISSIONS_MATCH_MODE_KEY,
  REQUIRE_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator.js';
import type { PermissionMatchMode } from './permissions.types.js';
import type { AuthSurface } from '../types/auth.types.js';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ResolvedPermission {
  permissions: string[];
  mode: PermissionMatchMode;
}

const HTTP_ACTION: Record<HttpMethod, string | null> = {
  GET: 'read',
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

export class RoutePermissionResolver {
  constructor(private readonly reflector: Reflector) {}

  resolve(context: ExecutionContext): ResolvedPermission | null {
    const explicit = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (explicit?.length) {
      const mode =
        this.reflector.getAllAndOverride<PermissionMatchMode>(
          PERMISSIONS_MATCH_MODE_KEY,
          [context.getHandler(), context.getClass()],
        ) ?? 'all';

      return { permissions: explicit, mode };
    }

    const actionOverride = this.reflector.getAllAndOverride<string>(
      AUTHORIZE_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const resource = this.reflector.getAllAndOverride<string>(
      AUTHORIZE_RESOURCE_KEY,
      [context.getClass()],
    );

    const surface = this.reflector.getAllAndOverride<AuthSurface>(
      AUTHORIZE_SURFACE_KEY,
      [context.getClass()],
    );

    if (!resource || !surface) {
      return null;
    }

    const { method } = this.extractRoute(context);
    const action = actionOverride ?? HTTP_ACTION[method];
    if (!action) {
      return null;
    }

    return {
      permissions: [`${resource}:${action}`],
      mode: 'all',
    };
  }

  getSurface(context: ExecutionContext): AuthSurface | null {
    return (
      this.reflector.getAllAndOverride<AuthSurface>(AUTHORIZE_SURFACE_KEY, [
        context.getClass(),
      ]) ?? null
    );
  }

  private extractRoute(context: ExecutionContext): {
    path: string;
    method: HttpMethod;
  } {
    const request = context.switchToHttp().getRequest<{
      method: string;
      route?: { path: string };
    }>();

    const controllerPath =
      Reflect.getMetadata(PATH_METADATA, context.getClass()) ?? '';
    const handlerPath =
      Reflect.getMetadata(PATH_METADATA, context.getHandler()) ?? '';

    const declared = [controllerPath, handlerPath]
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/');

    const path = (request.route?.path ?? declared).replace(/\/+/g, '/');
    const method = request.method.toUpperCase() as HttpMethod;

    return { path, method };
  }
}
