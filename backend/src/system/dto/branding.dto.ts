import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const COLOR_PATTERN =
  /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|oklch\([^)]+\))$/;

export class UpdateAppBrandingDto {
  @ApiPropertyOptional({ example: 'default' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  themeId?: string;

  @ApiPropertyOptional({ example: 'oklch(0.48 0.1 175)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(COLOR_PATTERN, {
    message: 'primaryColor debe ser hex (#RGB/#RRGGBB) u oklch(...)',
  })
  primaryColor?: string;

  @ApiPropertyOptional({ example: 'oklch(0.93 0.03 175)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(COLOR_PATTERN, {
    message: 'accentColor debe ser hex (#RGB/#RRGGBB) u oklch(...)',
  })
  accentColor?: string;

  @ApiPropertyOptional({ example: 'oklch(0.985 0.012 90)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(COLOR_PATTERN, {
    message: 'backgroundColor debe ser hex (#RGB/#RRGGBB) u oklch(...)',
  })
  backgroundColor?: string;

  @ApiPropertyOptional({ example: 'oklch(0.28 0.045 195)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(COLOR_PATTERN, {
    message: 'foregroundColor debe ser hex (#RGB/#RRGGBB) u oklch(...)',
  })
  foregroundColor?: string;

  @ApiPropertyOptional({ example: 'classic' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bookingHomeLayout?: string;
}

export class AppBrandingResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'default' })
  themeId!: string;

  @ApiProperty({ example: 'oklch(0.48 0.1 175)' })
  primaryColor!: string;

  @ApiProperty({ example: 'oklch(0.93 0.03 175)' })
  accentColor!: string;

  @ApiProperty({ example: 'oklch(0.985 0.012 90)' })
  backgroundColor!: string;

  @ApiProperty({ example: 'oklch(0.28 0.045 195)' })
  foregroundColor!: string;

  @ApiProperty({ example: 'classic' })
  bookingHomeLayout!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
