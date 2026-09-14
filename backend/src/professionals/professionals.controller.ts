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
import { CreateProfessionalDto } from './dto/create-professional.dto.js';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto.js';
import { FilterProfessionalsDto } from './dto/filter-professionals.dto.js';
import { FilterScheduleExceptionsDto } from './dto/filter-schedule-exceptions.dto.js';
import {
  PaginatedProfessionalsResponseDto,
  ProfessionalResponseDto,
  ProfessionalScheduleResponseDto,
  SetSchedulesResponseDto,
  SetServicesResponseDto,
} from './dto/responses/professional-response.dto.js';
import {
  PaginatedScheduleExceptionsResponseDto,
  ScheduleExceptionResponseDto,
} from './dto/responses/schedule-exception-response.dto.js';
import { SetSchedulesDto } from './dto/set-schedules.dto.js';
import { ProfessionalIdDto } from './dto/professional-id.dto.js';
import { SetServicesDto } from './dto/set-services.dto.js';
import { UpdateProfessionalDto } from './dto/update-professional.dto.js';
import { ProfessionalsService } from './professionals.service.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('professionals')
@ApiTags('Professionals — Internal')
@Controller('internal/professionals')
export class InternalProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar profesionales (filtros en body)' })
  @ApiBody({ type: FilterProfessionalsDto, required: false })
  @ApiOkResponse({ type: PaginatedProfessionalsResponseDto })
  list(@Body() filters: FilterProfessionalsDto = {}) {
    return this.professionalsService.findAll(filters);
  }

  @Post('detalle')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Detalle de un profesional' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ProfessionalResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.professionalsService.findById(dto.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear profesional' })
  @ApiBody({ type: CreateProfessionalDto })
  @ApiOkResponse({ type: ProfessionalResponseDto })
  create(
    @Body() dto: CreateProfessionalDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.professionalsService.create({ ...dto, auditUserId: userId });
  }

  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar profesional' })
  @ApiBody({ type: UpdateProfessionalDto })
  @ApiOkResponse({ type: ProfessionalResponseDto })
  update(
    @Body() dto: UpdateProfessionalDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.professionalsService.update({ ...dto, auditUserId: userId });
  }

  @Post('desactivar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('delete')
  @ApiOperation({ summary: 'Desactivar profesional (soft delete)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ProfessionalResponseDto })
  deactivate(@Body() dto: FindByIdDto) {
    return this.professionalsService.deactivate(dto.id);
  }

  @Post('set-schedules')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Reemplazar horarios semanales del profesional' })
  @ApiBody({ type: SetSchedulesDto })
  @ApiOkResponse({ type: SetSchedulesResponseDto })
  async setSchedules(@Body() dto: SetSchedulesDto) {
    const schedules = await this.professionalsService.setSchedules(dto);
    return { schedules };
  }

  @Post('schedules/listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar horarios semanales del profesional' })
  @ApiBody({ type: ProfessionalIdDto })
  @ApiOkResponse({ type: [ProfessionalScheduleResponseDto] })
  listSchedules(@Body() dto: ProfessionalIdDto) {
    return this.professionalsService.listSchedules(dto.professionalId);
  }

  @Post('set-services')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Reemplazar servicios del profesional' })
  @ApiBody({ type: SetServicesDto })
  @ApiOkResponse({ type: SetServicesResponseDto })
  async setServices(@Body() dto: SetServicesDto) {
    const serviceIds = await this.professionalsService.setServices(dto);
    return { serviceIds };
  }

  @Post('services/listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar servicios asignados al profesional' })
  @ApiBody({ type: ProfessionalIdDto })
  @ApiOkResponse({ type: SetServicesResponseDto })
  async listServices(@Body() dto: ProfessionalIdDto) {
    const serviceIds = await this.professionalsService.listServiceIds(
      dto.professionalId,
    );
    return { serviceIds };
  }

  @Post('exceptions/listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar excepciones de horario' })
  @ApiBody({ type: FilterScheduleExceptionsDto })
  @ApiOkResponse({ type: PaginatedScheduleExceptionsResponseDto })
  listExceptions(@Body() filters: FilterScheduleExceptionsDto) {
    return this.professionalsService.listExceptions(filters);
  }

  @Post('exceptions/create')
  @HttpCode(HttpStatus.CREATED)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Crear excepción de horario' })
  @ApiBody({ type: CreateScheduleExceptionDto })
  @ApiOkResponse({ type: ScheduleExceptionResponseDto })
  createException(@Body() dto: CreateScheduleExceptionDto) {
    return this.professionalsService.createException(dto);
  }

  @Post('exceptions/eliminar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('delete')
  @ApiOperation({ summary: 'Eliminar excepción de horario' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ScheduleExceptionResponseDto })
  deleteException(@Body() dto: FindByIdDto) {
    return this.professionalsService.deleteException(dto.id);
  }
}
