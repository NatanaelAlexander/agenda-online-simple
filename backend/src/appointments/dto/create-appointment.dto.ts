import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  businessId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  serviceId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  professionalId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  clientId!: string;

  @ApiProperty({ example: '2026-09-14T10:00:00.000Z' })
  @IsISO8601({}, { message: 'startsAt debe ser ISO-8601' })
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ example: 'confirmed' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  statusCode?: string;
}
