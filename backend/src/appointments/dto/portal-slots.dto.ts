import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/** @deprecated Usar PortalSlotsDto en appointment.dto.ts */
export class PortalSlotsDto {
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

  @ApiProperty({ example: '2026-09-14' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe ser YYYY-MM-DD' })
  date!: string;
}
