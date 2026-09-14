import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class FilterExceptionsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'dateFrom debe ser una fecha válida' })
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'dateTo debe ser una fecha válida' })
  dateTo?: string;
}

export class CreateExceptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId?: string | null;

  @ApiProperty({ example: '2026-09-18' })
  @IsDateString({}, { message: 'La fecha de excepción no es válida' })
  exceptionDate!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'isClosed debe ser booleano' })
  isClosed?: boolean;

  @ApiPropertyOptional({ example: '10:00' })
  @ValidateIf((o: CreateExceptionDto) => o.isClosed === false)
  @IsString({ message: 'La hora de inicio debe ser texto' })
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'La hora de inicio debe tener formato HH:MM',
  })
  startTime?: string | null;

  @ApiPropertyOptional({ example: '14:00' })
  @ValidateIf((o: CreateExceptionDto) => o.isClosed === false)
  @IsString({ message: 'La hora de fin debe ser texto' })
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'La hora de fin debe tener formato HH:MM',
  })
  endTime?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(255)
  reason?: string | null;
}
