import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { ErrorResponseDto } from '../common/exceptions/app.exception.js';
import { AuthenticatedOnly } from './decorators/authorize.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import {
  AuthMeResponseDto,
  AuthOkResponseDto,
  AuthTokensResponseDto,
} from './dto/responses/auth-response.dto.js';
import type { SessionClientContext } from './types/refresh-session.types.js';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión (panel interno)' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ErrorResponseDto })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(
      dto.email,
      dto.password,
      this.clientContext(request),
    );
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Renovar tokens (rotación)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(
      dto.refreshToken,
      this.clientContext(request),
    );
  }

  @Public()
  @Post('logout')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cerrar sesión (revoca refresh)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: AuthOkResponseDto })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @AuthenticatedOnly()
  @Post('logout-all')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cerrar sesión en todos los dispositivos' })
  @ApiOkResponse({ type: AuthOkResponseDto })
  logoutAll(@CurrentUser('sub') userId: string) {
    return this.authService.logoutAll(userId);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Solicitar código de recuperación (email)' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ type: AuthOkResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Restablecer contraseña con código' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ type: AuthOkResponseDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }

  @AuthenticatedOnly()
  @Post('change-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cambiar contraseña (sesión activa)' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ type: AuthOkResponseDto })
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @AuthenticatedOnly()
  @Post('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  @ApiOkResponse({ type: AuthMeResponseDto })
  me(@CurrentUser('sub') userId: string) {
    return this.authService.getMe(userId);
  }

  @AuthenticatedOnly()
  @Post('update-profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Actualizar nombre/apellido/teléfono (no correo) y reemitir tokens',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
    @Req() request: Request,
  ) {
    return this.authService.updateProfile(
      userId,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
      },
      this.clientContext(request),
    );
  }

  private clientContext(request: Request): SessionClientContext {
    return {
      userAgent: request.headers['user-agent'] ?? null,
      ipAddress: request.ip ?? null,
    };
  }
}
