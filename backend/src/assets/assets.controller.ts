import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import {
  AuthorizeAction,
  AuthorizeResource,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { FindByIdDto } from '../common/dto/find-by-id.dto.js';
import { AssetsService } from './assets.service.js';
import { BusinessIdDto } from './dto/business-logo.dto.js';
import {
  LinkBusinessAssetDto,
  LinkProfessionalAssetDto,
  LinkServiceAssetDto,
  LinkSystemAssetDto,
} from './dto/link-asset.dto.js';
import {
  AssetResponseDto,
  AssetSignedUrlResponseDto,
  BusinessLogoOptionalResponseDto,
  BusinessLogoResponseDto,
  LinkedAssetResponseDto,
} from './dto/responses/asset-response.dto.js';

const LOGO_MAX_BYTES = 30 * 1024 * 1024;

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('assets')
@ApiTags('Assets — Internal')
@Controller('internal/assets')
export class InternalAssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('subir')
  @AuthorizeAction('create')
  @ApiOperation({ summary: 'Subir archivo a R2 e insertar metadata' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: AssetResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser('sub') actorUserId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assetsService.upload(file, actorUserId);
  }

  @Post('set-business-logo')
  @AuthorizeAction('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Subir y vincular logo del negocio (JPG/PNG/WEBP, máx. 30 MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'businessId'],
      properties: {
        businessId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: BusinessLogoResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: LOGO_MAX_BYTES },
    }),
  )
  setBusinessLogo(
    @CurrentUser('sub') actorUserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: BusinessIdDto,
  ) {
    return this.assetsService.setBusinessLogo(file, body.businessId, actorUserId);
  }

  @Post('business-logo')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Logo actual del negocio (URL firmada)' })
  @ApiBody({ type: BusinessIdDto })
  @ApiOkResponse({ type: BusinessLogoOptionalResponseDto })
  async getBusinessLogo(@Body() dto: BusinessIdDto) {
    const logo = await this.assetsService.getBusinessLogo(dto.businessId);
    return { logo };
  }

  @Post('signed-url')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'URL firmada temporal para descargar' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AssetSignedUrlResponseDto })
  getSignedUrl(@Body() dto: FindByIdDto) {
    return this.assetsService.getSignedUrl(dto.id);
  }

  @Post('link-system')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Vincular asset de sistema (logo/favicon)' })
  @ApiBody({ type: LinkSystemAssetDto })
  @ApiOkResponse({ type: LinkedAssetResponseDto })
  linkSystem(@Body() dto: LinkSystemAssetDto) {
    return this.assetsService.linkSystemAsset(dto.kind, dto.assetId);
  }

  @Post('link-business')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Vincular asset a un negocio' })
  @ApiBody({ type: LinkBusinessAssetDto })
  @ApiOkResponse({ type: LinkedAssetResponseDto })
  linkBusiness(@Body() dto: LinkBusinessAssetDto) {
    return this.assetsService.linkBusinessAsset(
      dto.businessId,
      dto.assetId,
      dto.kind,
    );
  }

  @Post('link-professional')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Vincular asset a un profesional' })
  @ApiBody({ type: LinkProfessionalAssetDto })
  @ApiOkResponse({ type: LinkedAssetResponseDto })
  linkProfessional(@Body() dto: LinkProfessionalAssetDto) {
    return this.assetsService.linkProfessionalAsset(
      dto.professionalId,
      dto.assetId,
      dto.kind,
    );
  }

  @Post('link-service')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Vincular asset a un servicio' })
  @ApiBody({ type: LinkServiceAssetDto })
  @ApiOkResponse({ type: LinkedAssetResponseDto })
  linkService(@Body() dto: LinkServiceAssetDto) {
    return this.assetsService.linkServiceAsset(
      dto.serviceId,
      dto.assetId,
      dto.kind,
    );
  }
}
