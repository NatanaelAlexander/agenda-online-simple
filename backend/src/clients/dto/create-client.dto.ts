import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(200)
  fullName!: string;

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
  @IsString({ message: 'googleSub debe ser texto' })
  @MaxLength(255)
  googleSub?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string | null;
}
