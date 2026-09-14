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
import { BusinessesService } from './businesses.service.js';
import { CreateBusinessDto } from './dto/create-business.dto.js';
import { FilterBusinessesDto } from './dto/filter-businesses.dto.js';
import {
  ListBusinessSchedulesDto,
  SetBusinessSchedulesDto,
} from './dto/set-business-schedules.dto.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';
import {
  BusinessResponseDto,
  PaginatedBusinessesResponseDto,
} from './dto/responses/business-response.dto.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('businesses')
@ApiTags('Businesses — Internal')
@Controller('internal/businesses')
export class InternalBusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar negocios (filtros en body)' })
  @ApiBody({ type: FilterBusinessesDto, required: false })
  @ApiOkResponse({ type: PaginatedBusinessesResponseDto })
  list(@Body() filters: FilterBusinessesDto = {}) {
    return this.businessesService.findAll(filters);
  }

  @Post('detalle')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Detalle de un negocio' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: BusinessResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.businessesService.findById(dto.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear negocio' })
  @ApiBody({ type: CreateBusinessDto })
  @ApiOkResponse({ type: BusinessResponseDto })
  create(
    @Body() dto: CreateBusinessDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.businessesService.create({ ...dto, userId });
  }

  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar negocio' })
  @ApiBody({ type: UpdateBusinessDto })
  @ApiOkResponse({ type: BusinessResponseDto })
  update(
    @Body() dto: UpdateBusinessDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.businessesService.update({ ...dto, userId });
  }

  @Post('schedules/listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar horarios semanales del local' })
  @ApiBody({ type: ListBusinessSchedulesDto })
  listSchedules(@Body() dto: ListBusinessSchedulesDto) {
    return this.businessesService.listSchedules(dto.businessId);
  }

  @Post('set-schedules')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Reemplazar horarios semanales del local' })
  @ApiBody({ type: SetBusinessSchedulesDto })
  async setSchedules(@Body() dto: SetBusinessSchedulesDto) {
    const schedules = await this.businessesService.setSchedules(dto);
    return { schedules };
  }
}
