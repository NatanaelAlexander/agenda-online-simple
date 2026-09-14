import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class LinkSystemAssetDto {
  @ApiProperty({ example: 'logo' })
  @IsString({ message: 'El kind es obligatorio' })
  @MinLength(1, { message: 'El kind es obligatorio' })
  @MaxLength(50, { message: 'El kind no puede superar 50 caracteres' })
  kind!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El assetId debe ser un UUID válido' })
  assetId!: string;
}

export class LinkBusinessAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El assetId debe ser un UUID válido' })
  assetId!: string;

  @ApiProperty({ example: 'logo' })
  @IsString({ message: 'El kind es obligatorio' })
  @MinLength(1, { message: 'El kind es obligatorio' })
  @MaxLength(50, { message: 'El kind no puede superar 50 caracteres' })
  kind!: string;
}

export class LinkProfessionalAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El assetId debe ser un UUID válido' })
  assetId!: string;

  @ApiProperty({ example: 'avatar' })
  @IsString({ message: 'El kind es obligatorio' })
  @MinLength(1, { message: 'El kind es obligatorio' })
  @MaxLength(50, { message: 'El kind no puede superar 50 caracteres' })
  kind!: string;
}

export class LinkServiceAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El serviceId debe ser un UUID válido' })
  serviceId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El assetId debe ser un UUID válido' })
  assetId!: string;

  @ApiProperty({ example: 'image' })
  @IsString({ message: 'El kind es obligatorio' })
  @MinLength(1, { message: 'El kind es obligatorio' })
  @MaxLength(50, { message: 'El kind no puede superar 50 caracteres' })
  kind!: string;
}
