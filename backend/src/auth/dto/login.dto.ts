import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@agenda.local' })
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'admin', format: 'password' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  @MaxLength(128)
  password!: string;
}
