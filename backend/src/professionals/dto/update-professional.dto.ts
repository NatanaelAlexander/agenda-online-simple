import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfessionalDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El id debe ser un UUID válido' })
  id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(50)
  phone?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El userId debe ser un UUID válido' })
  userId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser booleano' })
  isActive?: boolean;
}
