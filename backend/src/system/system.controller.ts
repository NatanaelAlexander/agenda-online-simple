import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthorizeAction,
  AuthorizeResource,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import {
  AppBrandingResponseDto,
  UpdateAppBrandingDto,
} from './dto/branding.dto.js';
import { SystemBrandingService } from './system-branding.service.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('system')
@ApiTags('System — Branding')
@Controller('internal/system/branding')
export class InternalSystemBrandingController {
  constructor(private readonly branding: SystemBrandingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('manage')
  @ApiOperation({ summary: 'Branding de la instalación' })
  @ApiOkResponse({ type: AppBrandingResponseDto })
  get() {
    return this.branding.get();
  }

  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('manage')
  @ApiOperation({ summary: 'Actualizar colores y layout de home' })
  @ApiBody({ type: UpdateAppBrandingDto })
  @ApiOkResponse({ type: AppBrandingResponseDto })
  update(@Body() dto: UpdateAppBrandingDto) {
    return this.branding.update(dto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('manage')
  @ApiOperation({ summary: 'Restablecer branding por defecto' })
  @ApiOkResponse({ type: AppBrandingResponseDto })
  reset() {
    return this.branding.reset();
  }
}

@Public()
@ApiTags('System — Portal')
@Controller('portal/system')
export class PortalSystemController {
  constructor(private readonly branding: SystemBrandingService) {}

  @Get('branding')
  @ApiOperation({ summary: 'Branding público (colores + layout home)' })
  @ApiOkResponse({ type: AppBrandingResponseDto })
  getBranding() {
    return this.branding.get();
  }
}
