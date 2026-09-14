import { Body, Controller, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { FindByIdDto } from '../common/dto/find-by-id.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { FilterServicesDto } from './dto/filter-services.dto.js';
import {
  PaginatedServicesResponseDto,
  ServiceResponseDto,
} from './dto/responses/service-response.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { ServicesService } from './services.service.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('services')
@ApiTags('Services — Internal')
@Controller('internal/services')
export class InternalServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar servicios (filtros en body)' })
  @ApiBody({ type: FilterServicesDto, required: false })
  @ApiOkResponse({ type: PaginatedServicesResponseDto })
  list(@Body() filters: FilterServicesDto = {}) {
    return this.servicesService.findAll(filters);
  }

  @Post('detalle')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Detalle de un servicio' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ServiceResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.servicesService.findById(dto.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear servicio' })
  @ApiBody({ type: CreateServiceDto })
  @ApiOkResponse({ type: ServiceResponseDto })
  create(
    @Body() dto: CreateServiceDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.servicesService.create({ ...dto, userId });
  }

  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar servicio' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiOkResponse({ type: ServiceResponseDto })
  update(
    @Body() dto: UpdateServiceDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.servicesService.update({ ...dto, userId });
  }

  @Post('desactivar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('delete')
  @ApiOperation({ summary: 'Desactivar servicio (soft delete)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ServiceResponseDto })
  deactivate(@Body() dto: FindByIdDto) {
    return this.servicesService.deactivate(dto.id);
  }
}
