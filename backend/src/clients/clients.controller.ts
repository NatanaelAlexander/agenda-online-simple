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
import { FindByIdDto } from '../common/dto/find-by-id.dto.js';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { FilterClientsDto } from './dto/filter-clients.dto.js';
import {
  ClientResponseDto,
  PaginatedClientsResponseDto,
} from './dto/responses/client-response.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('clients')
@ApiTags('Clients — Internal')
@Controller('internal/clients')
export class InternalClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiBody({ type: FilterClientsDto, required: false })
  @ApiOkResponse({ type: PaginatedClientsResponseDto })
  list(@Body() filters: FilterClientsDto = {}) {
    return this.clientsService.findAll(filters);
  }

  @Post('detalle')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Detalle de un cliente' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ClientResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.clientsService.findById(dto.id);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiBody({ type: CreateClientDto })
  @ApiOkResponse({ type: ClientResponseDto })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiBody({ type: UpdateClientDto })
  @ApiOkResponse({ type: ClientResponseDto })
  update(@Body() dto: UpdateClientDto) {
    return this.clientsService.update(dto);
  }

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('delete')
  @ApiOperation({ summary: 'Eliminar cliente' })
  @ApiBody({ type: FindByIdDto })
  delete(@Body() dto: FindByIdDto) {
    return this.clientsService.delete(dto.id);
  }
}
