import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { BusinessesService } from './businesses.service.js';
import { BusinessResponseDto } from './dto/responses/business-response.dto.js';

class PortalServiceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ nullable: true })
  description!: string | null;
  @ApiProperty({ nullable: true, description: 'null = sin duración publicada' })
  durationMinutes!: number | null;
  @ApiProperty({ nullable: true, description: 'null = sin precio' })
  priceCents!: number | null;
  @ApiProperty({ nullable: true })
  color!: string | null;
}

class PortalScheduleDto {
  @ApiProperty({ example: 1, description: '0=domingo … 6=sábado' })
  weekday!: number;
  @ApiProperty({ example: '09:00' })
  startTime!: string;
  @ApiProperty({ example: '18:00' })
  endTime!: string;
}

class PortalProfessionalDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  displayName!: string;
  @ApiProperty({ type: [String] })
  serviceIds!: string[];
}

class PortalExceptionDto {
  @ApiProperty({ example: '2026-12-25' })
  exceptionDate!: string;
  @ApiProperty()
  isClosed!: boolean;
  @ApiProperty({ nullable: true, format: 'uuid' })
  professionalId!: string | null;
  @ApiProperty({ nullable: true })
  reason!: string | null;
}

class PortalCatalogDto {
  @ApiProperty({ type: BusinessResponseDto })
  business!: BusinessResponseDto;
  @ApiProperty({
    nullable: true,
    description: 'URL firmada temporal del logo (R2), si existe',
  })
  logoUrl!: string | null;
  @ApiProperty({ type: [PortalServiceDto] })
  services!: PortalServiceDto[];
  @ApiProperty({ type: [PortalProfessionalDto] })
  professionals!: PortalProfessionalDto[];
  @ApiProperty({ type: [PortalScheduleDto] })
  schedules!: PortalScheduleDto[];
  @ApiProperty({ type: [PortalExceptionDto] })
  exceptions!: PortalExceptionDto[];
}

@Public()
@ApiTags('Businesses — Portal')
@Controller('portal/businesses')
export class PortalBusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Negocio público por slug' })
  @ApiParam({ name: 'slug', example: 'barberia-demo' })
  @ApiOkResponse({ type: BusinessResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.businessesService.findBySlug(slug);
  }

  @Get(':slug/catalog')
  @ApiOperation({
    summary: 'Catálogo público: negocio + servicios + profesionales activos',
  })
  @ApiParam({ name: 'slug', example: 'barberia-demo' })
  @ApiOkResponse({ type: PortalCatalogDto })
  catalog(@Param('slug') slug: string) {
    return this.businessesService.findPublicCatalog(slug);
  }
}
