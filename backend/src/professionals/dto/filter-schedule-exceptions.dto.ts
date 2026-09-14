import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class FilterScheduleExceptionsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'fromDate debe ser una fecha válida' })
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'toDate debe ser una fecha válida' })
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un entero' })
  @Min(1, { message: 'El tamaño de página mínimo es 1' })
  @Max(200, { message: 'El tamaño de página máximo es 200' })
  pageSize?: number;
}
