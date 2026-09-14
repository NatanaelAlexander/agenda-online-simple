import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
import { FindByIdDto } from '../common/dto/find-by-id.dto.js';
import { AuditService } from './audit.service.js';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto.js';
import {
  AuditLogResponseDto,
  PaginatedAuditLogsResponseDto,
} from './dto/responses/audit-log-response.dto.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('audit_logs')
@ApiTags('Audit — Internal')
@Controller('internal/audit-logs')
export class InternalAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar audit_logs (filtros en body)' })
  @ApiBody({ type: FilterAuditLogsDto, required: false })
  @ApiOkResponse({ type: PaginatedAuditLogsResponseDto })
  list(@Body() filters: FilterAuditLogsDto = {}) {
    return this.auditService.findAll(filters);
  }

  @Post('detalle')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Detalle de un audit_log' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AuditLogResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.auditService.findById(dto.id);
  }
}
