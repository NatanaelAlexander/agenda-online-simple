import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const STATUS_CODES = [
  'pending',
  'confirmed',
  'attended',
  'cancelled',
  'no_show',
] as const;

export class FilterAppointmentsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El serviceId debe ser un UUID válido' })
  serviceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El clientId debe ser un UUID válido' })
  clientId?: string;

  @ApiPropertyOptional({ enum: STATUS_CODES })
  @IsOptional()
  @IsIn(STATUS_CODES, { message: 'El statusCode no es válido' })
  statusCode?: string;

  @ApiPropertyOptional({ description: 'ISO date-time desde' })
  @IsOptional()
  @IsDateString({}, { message: 'dateFrom debe ser una fecha válida' })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date-time hasta' })
  @IsOptional()
  @IsDateString({}, { message: 'dateTo debe ser una fecha válida' })
  dateTo?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page mínimo 1' })
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize debe ser un entero' })
  @Min(1, { message: 'pageSize mínimo 1' })
  @Max(200, { message: 'pageSize máximo 200' })
  pageSize?: number;
}

export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El serviceId debe ser un UUID válido' })
  serviceId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El clientId debe ser un UUID válido' })
  clientId!: string;

  @ApiProperty({ description: 'Inicio ISO-8601' })
  @IsDateString({}, { message: 'startsAt debe ser una fecha válida' })
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'notes debe ser texto' })
  @MaxLength(2000, { message: 'notes no puede superar 2000 caracteres' })
  notes?: string;

  @ApiPropertyOptional({ enum: STATUS_CODES, default: 'confirmed' })
  @IsOptional()
  @IsIn(STATUS_CODES, { message: 'El statusCode no es válido' })
  statusCode?: string;
}

export class ChangeAppointmentStatusDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El id debe ser un UUID válido' })
  id!: string;

  @ApiProperty({ enum: STATUS_CODES })
  @IsIn(STATUS_CODES, { message: 'El statusCode no es válido' })
  statusCode!: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El id debe ser un UUID válido' })
  id!: string;

  @ApiProperty({ description: 'Nuevo inicio ISO-8601' })
  @IsDateString({}, { message: 'startsAt debe ser una fecha válida' })
  startsAt!: string;
}

export class CancelAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El id debe ser un UUID válido' })
  id!: string;
}

export class PortalSlotsDto {
  @ApiProperty({ example: 'barberia-demo' })
  @IsString({ message: 'El businessSlug es obligatorio' })
  @MinLength(1, { message: 'El businessSlug es obligatorio' })
  @MaxLength(120, { message: 'businessSlug demasiado largo' })
  businessSlug!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Omitir si el cliente no está seguro del servicio',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El serviceId debe ser un UUID válido' })
  serviceId?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Omitir si el cliente no está seguro del profesional',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId?: string | null;

  @ApiProperty({ example: '2026-09-14', description: 'YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe tener formato YYYY-MM-DD',
  })
  date!: string;
}

export class ConfirmPortalAppointmentDto {
  @ApiProperty({ example: 'barberia-demo' })
  @IsString({ message: 'El businessSlug es obligatorio' })
  @MinLength(1, { message: 'El businessSlug es obligatorio' })
  businessSlug!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El serviceId debe ser un UUID válido' })
  serviceId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId?: string | null;

  @ApiProperty({ description: 'Inicio ISO-8601 del slot elegido' })
  @IsDateString({}, { message: 'startsAt debe ser una fecha válida' })
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'notes debe ser texto' })
  @MaxLength(2000, { message: 'notes no puede superar 2000 caracteres' })
  notes?: string;
}

export class CancelPortalAppointmentDto {
  @ApiProperty({ description: 'Token de cancelación del email' })
  @IsString({ message: 'El cancelToken es obligatorio' })
  @MinLength(16, { message: 'cancelToken inválido' })
  @MaxLength(64, { message: 'cancelToken inválido' })
  cancelToken!: string;
}


export class PortalMineAppointmentsDto {
  @ApiProperty({ type: [String], description: 'cancelTokens de la cookie' })
  @IsArray({ message: 'cancelTokens debe ser un arreglo' })
  @IsString({ each: true, message: 'Cada cancelToken debe ser texto' })
  @MinLength(16, { each: true, message: 'cancelToken inválido' })
  @MaxLength(64, { each: true, message: 'cancelToken inválido' })
  cancelTokens!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessSlug?: string;
}
