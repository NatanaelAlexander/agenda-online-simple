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
import { CreateStaffUserDto } from './dto/create-staff-user.dto.js';
import { FilterStaffUsersDto } from './dto/filter-staff-users.dto.js';
import {
  PaginatedStaffUsersResponseDto,
  StaffUserResponseDto,
} from './dto/responses/staff-user-response.dto.js';
import { UsersService } from './users.service.js';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('users')
@ApiTags('Users — Internal')
@Controller('internal/users')
export class InternalUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar usuarios internos' })
  @ApiBody({ type: FilterStaffUsersDto, required: false })
  @ApiOkResponse({ type: PaginatedStaffUsersResponseDto })
  list(@Body() filters: FilterStaffUsersDto = {}) {
    return this.usersService.findAll(filters);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @AuthorizeAction('create')
  @ApiOperation({ summary: 'Crear usuario interno (admin o super_admin)' })
  @ApiBody({ type: CreateStaffUserDto })
  @ApiOkResponse({ type: StaffUserResponseDto })
  create(@Body() dto: CreateStaffUserDto) {
    return this.usersService.create(dto);
  }
}
