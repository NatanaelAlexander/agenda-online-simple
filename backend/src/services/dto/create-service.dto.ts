import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;

  @ApiProperty({ example: 'Corte clásico' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(200, { message: 'El nombre no puede superar 200 caracteres' })
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 30,
    description: 'Opcional. Minutos; null u omitido = sin duración publicada (slots usan 30)',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'La duración debe ser un entero' })
  @Min(1, { message: 'La duración debe ser mayor a 0' })
  durationMinutes?: number | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt({ message: 'prepMinutes debe ser un entero' })
  @Min(0, { message: 'prepMinutes no puede ser negativo' })
  prepMinutes?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt({ message: 'bufferMinutes debe ser un entero' })
  @Min(0, { message: 'bufferMinutes no puede ser negativo' })
  bufferMinutes?: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Opcional. Centavos (CLP × 100). null u omitido = sin precio',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'priceCents debe ser un entero' })
  @Min(0, { message: 'priceCents no puede ser negativo' })
  priceCents?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El color debe ser texto' })
  @MaxLength(32)
  color?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser booleano' })
  isActive?: boolean;
}
