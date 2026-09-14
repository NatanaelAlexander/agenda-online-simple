import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@agenda.local' })
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'admin@agenda.local' })
  @IsEmail({}, { message: 'El correo no es válido' })
  email!: string;

  @ApiProperty({ description: 'Código de 6 dígitos' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;

  @ApiProperty({ format: 'password' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(128)
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ format: 'password' })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(128)
  newPassword!: string;
}
