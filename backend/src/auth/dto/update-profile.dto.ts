import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Admin' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  firstName!: string;

  @ApiProperty({ example: 'Sistema' })
  @IsString({ message: 'El apellido debe ser texto' })
  @MinLength(1, { message: 'El apellido es obligatorio' })
  @MaxLength(100, { message: 'El apellido no puede superar 100 caracteres' })
  lastName!: string;

  @ApiPropertyOptional({ example: '+56912345678', nullable: true })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(50, { message: 'El teléfono no puede superar 50 caracteres' })
  phoneNumber?: string | null;
}
