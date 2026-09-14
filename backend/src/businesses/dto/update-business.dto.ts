import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateBusinessDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El id debe ser un UUID válido' })
  id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El slug debe ser texto' })
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede contener minúsculas, números y guiones',
  })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(50)
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La zona horaria debe ser texto' })
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject({ message: 'Los enlaces sociales deben ser un objeto' })
  socialLinks?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Activar/desactivar reservas online' })
  @IsOptional()
  @IsBoolean({ message: 'bookingEnabled debe ser verdadero o falso' })
  bookingEnabled?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'El título del afiche debe ser texto' })
  @MaxLength(200)
  qrPosterHeadline?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'El pie del afiche debe ser texto' })
  @MaxLength(300)
  qrPosterFooter?: string | null;

  @ApiPropertyOptional({
    description: 'Máximo de clientes en el mismo horario (1–50)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'maxBookingsPerSlot debe ser un entero' })
  @Min(1)
  @Max(50)
  maxBookingsPerSlot?: number;
}
