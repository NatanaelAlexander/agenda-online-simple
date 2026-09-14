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

export class UpdateServiceDto {
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
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'La duración debe ser un entero' })
  @Min(1, { message: 'La duración debe ser mayor a 0' })
  durationMinutes?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'prepMinutes debe ser un entero' })
  @Min(0)
  prepMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'bufferMinutes debe ser un entero' })
  @Min(0)
  bufferMinutes?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'priceCents debe ser un entero' })
  @Min(0)
  priceCents?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El color debe ser texto' })
  @MaxLength(32)
  color?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser booleano' })
  isActive?: boolean;
}
