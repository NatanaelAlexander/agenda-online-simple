import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateScheduleExceptionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId?: string | null;

  @ApiProperty({ example: '2026-09-13' })
  @IsDateString({}, { message: 'exceptionDate debe ser una fecha válida' })
  exceptionDate!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'isClosed debe ser booleano' })
  isClosed?: boolean;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString({ message: 'startTime debe ser texto' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'startTime debe tener formato HH:mm o HH:mm:ss',
  })
  startTime?: string | null;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString({ message: 'endTime debe ser texto' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'endTime debe tener formato HH:mm o HH:mm:ss',
  })
  endTime?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La razón debe ser texto' })
  @MaxLength(255)
  reason?: string | null;
}
