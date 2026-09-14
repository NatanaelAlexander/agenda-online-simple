import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Barbería Demo' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(200, { message: 'El nombre no puede superar 200 caracteres' })
  name!: string;

  @ApiProperty({ example: 'barberia-demo' })
  @IsString({ message: 'El slug debe ser texto' })
  @MinLength(1, { message: 'El slug es obligatorio' })
  @MaxLength(120, { message: 'El slug no puede superar 120 caracteres' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede contener minúsculas, números y guiones',
  })
  slug!: string;

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

  @ApiPropertyOptional({ example: 'America/Santiago' })
  @IsOptional()
  @IsString({ message: 'La zona horaria debe ser texto' })
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject({ message: 'Los enlaces sociales deben ser un objeto' })
  socialLinks?: Record<string, unknown>;
}
