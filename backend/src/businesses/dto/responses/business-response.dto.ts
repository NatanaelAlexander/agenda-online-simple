import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BusinessResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiProperty()
  timezone!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  socialLinks!: Record<string, unknown>;

  @ApiProperty({ description: 'Si el negocio acepta reservas online' })
  bookingEnabled!: boolean;

  @ApiPropertyOptional({ nullable: true })
  qrPosterHeadline!: string | null;

  @ApiPropertyOptional({ nullable: true })
  qrPosterFooter!: string | null;

  @ApiProperty({
    description: 'Máximo de clientes en el mismo horario',
    example: 2,
  })
  maxBookingsPerSlot!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedBusinessesResponseDto {
  @ApiProperty({ type: [BusinessResponseDto] })
  items!: BusinessResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
