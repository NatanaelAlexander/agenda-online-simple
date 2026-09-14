import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStaffUserDto {
  @ApiProperty({ example: 'admin2@agenda.local' })
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ minLength: 6 })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1, { message: 'El apellido es obligatorio' })
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string | null;

  @ApiProperty({ enum: ['admin', 'super_admin'] })
  @IsIn(['admin', 'super_admin'], {
    message: 'El rol debe ser admin o super_admin',
  })
  role!: 'admin' | 'super_admin';
}
