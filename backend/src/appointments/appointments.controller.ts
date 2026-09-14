import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
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
import { FindByIdDto } from '../common/dto/find-by-id.dto.js';
import {
  AppointmentsService,
  extractBearerToken,
} from './appointments.service.js';
import {
  CancelAppointmentDto,
  CancelPortalAppointmentDto,
  ChangeAppointmentStatusDto,
  ConfirmPortalAppointmentDto,
  CreateAppointmentDto,
  FilterAppointmentsDto,
  PortalMineAppointmentsDto,
  PortalSlotsDto,
  RescheduleAppointmentDto,
} from './dto/appointment.dto.js';
import {
  AppointmentResponseDto,
  PortalConfirmResponseDto,
  PaginatedAppointmentsResponseDto,
  PortalSlotsResponseDto,
} from './dto/responses/appointment-response.dto.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('appointments')
@ApiTags('Appointments — Internal')
@Controller('internal/appointments')
export class InternalAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar citas (filtros en body)' })
  @ApiBody({ type: FilterAppointmentsDto, required: false })
  @ApiOkResponse({ type: PaginatedAppointmentsResponseDto })
  list(@Body() filters: FilterAppointmentsDto = {}) {
    return this.appointmentsService.findAll(filters);
  }

  @Post('detalle')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Detalle de una cita' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  detalle(@Body() dto: FindByIdDto) {
    return this.appointmentsService.findById(dto.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @AuthorizeAction('create')
  @ApiOperation({ summary: 'Crear cita (staff)' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create({
      ...dto,
      bookingSource: 'internal',
    });
  }

  @Post('change-status')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('change_status')
  @ApiOperation({ summary: 'Cambiar estado de una cita' })
  @ApiBody({ type: ChangeAppointmentStatusDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  changeStatus(@Body() dto: ChangeAppointmentStatusDto) {
    return this.appointmentsService.changeStatus(dto.id, dto.statusCode);
  }

  @Post('reschedule')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Reprogramar cita' })
  @ApiBody({ type: RescheduleAppointmentDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  reschedule(@Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(dto.id, dto.startsAt);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Cancelar cita (staff)' })
  @ApiBody({ type: CancelAppointmentDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  cancel(@Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel(dto.id);
  }

  @Post('aceptar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('change_status')
  @ApiOperation({ summary: 'Aceptar cita pendiente (portal)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  accept(@Body() dto: FindByIdDto) {
    return this.appointmentsService.accept(dto.id);
  }

  @Post('rechazar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('change_status')
  @ApiOperation({ summary: 'Rechazar cita pendiente (portal)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  reject(@Body() dto: FindByIdDto) {
    return this.appointmentsService.reject(dto.id);
  }
}

@Public()
@ApiTags('Appointments — Portal')
@Controller('portal/appointments')
export class PortalAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('slots')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Slots disponibles (público)' })
  @ApiBody({ type: PortalSlotsDto })
  @ApiOkResponse({ type: PortalSlotsResponseDto })
  slots(@Body() dto: PortalSlotsDto) {
    return this.appointmentsService.getPortalSlots(dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('booking-token')
  @ApiOperation({
    summary: 'Confirmar reserva (Bearer booking token)',
  })
  @ApiBody({ type: ConfirmPortalAppointmentDto })
  @ApiOkResponse({ type: PortalConfirmResponseDto })
  confirm(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: ConfirmPortalAppointmentDto,
  ) {
    return this.appointmentsService.confirmPortal(
      extractBearerToken(authorization),
      dto,
    );
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar cita con cancelToken' })
  @ApiBody({ type: CancelPortalAppointmentDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  cancel(@Body() dto: CancelPortalAppointmentDto) {
    return this.appointmentsService.cancelByToken(dto.cancelToken);
  }

  @Post('estado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar estado de reserva con cancelToken' })
  @ApiBody({ type: CancelPortalAppointmentDto })
  @ApiOkResponse({ type: AppointmentResponseDto })
  status(@Body() dto: CancelPortalAppointmentDto) {
    return this.appointmentsService.getPortalStatus(dto.cancelToken);
  }

  @Post('mias')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar mis citas por cancelTokens (cookie como caché)' })
  @ApiBody({ type: PortalMineAppointmentsDto })
  @ApiOkResponse({ type: [AppointmentResponseDto] })
  mine(@Body() dto: PortalMineAppointmentsDto) {
    return this.appointmentsService.listPortalByCancelTokens({
      cancelTokens: dto.cancelTokens,
      businessSlug: dto.businessSlug,
    });
  }
}
