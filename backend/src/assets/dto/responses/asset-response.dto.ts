import { ApiProperty } from '@nestjs/swagger';

export class AssetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'logo.png' })
  fileName!: string;

  @ApiProperty({
    description: 'Object key privado en R2 (no URL pública)',
    example: 'assets/uuid/1710000000000_logo.png',
  })
  filePath!: string;

  @ApiProperty({ example: 'image/png' })
  mimeType!: string;

  @ApiProperty({ example: 102400 })
  fileSize!: number;

  @ApiProperty({ format: 'uuid', nullable: true })
  uploadedById!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class AssetSignedUrlResponseDto {
  @ApiProperty({ description: 'URL firmada temporal' })
  url!: string;

  @ApiProperty({ example: 300 })
  expiresInSeconds!: number;
}

export class LinkedAssetResponseDto {
  @ApiProperty({ example: 'logo' })
  kind!: string;

  @ApiProperty({ format: 'uuid' })
  assetId!: string;
}

export class BusinessLogoResponseDto {
  @ApiProperty({ type: AssetResponseDto })
  asset!: AssetResponseDto;

  @ApiProperty({ description: 'URL firmada temporal para previsualizar' })
  url!: string;

  @ApiProperty({ example: 3600 })
  expiresInSeconds!: number;
}

export class BusinessLogoOptionalResponseDto {
  @ApiProperty({ type: BusinessLogoResponseDto, nullable: true })
  logo!: BusinessLogoResponseDto | null;
}
