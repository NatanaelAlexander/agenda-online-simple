import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** @deprecated Usar ConfirmPortalAppointmentDto en appointment.dto.ts */
export class PortalConfirmDto {
  @ApiProperty({ example: 'barberia-demo' })
  @IsString()
  @MaxLength(120)
  businessSlug!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  serviceId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  professionalId?: string | null;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  @IsISO8601({}, { message: 'startsAt debe ser ISO-8601' })
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
