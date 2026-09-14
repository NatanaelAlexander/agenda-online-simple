import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  businessId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null = sin duración publicada' })
  durationMinutes!: number | null;

  @ApiProperty()
  prepMinutes!: number;

  @ApiProperty()
  bufferMinutes!: number;

  @ApiPropertyOptional({ nullable: true, description: 'null = sin precio' })
  priceCents!: number | null;

  @ApiPropertyOptional({ nullable: true })
  color!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedServicesResponseDto {
  @ApiProperty({ type: [ServiceResponseDto] })
  items!: ServiceResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
