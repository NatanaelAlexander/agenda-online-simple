import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppointmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  businessId!: string;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  serviceId!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  professionalId!: string | null;

  @ApiProperty({ format: 'uuid' })
  clientId!: string;

  @ApiProperty()
  statusCode!: string;

  @ApiProperty()
  statusName!: string;

  @ApiProperty()
  startsAt!: Date;

  @ApiProperty()
  endsAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  businessName!: string;

  @ApiProperty()
  businessSlug!: string;

  @ApiPropertyOptional({ nullable: true })
  serviceName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  professionalName!: string | null;

  @ApiProperty()
  clientName!: string;

  @ApiPropertyOptional({ nullable: true })
  clientEmail!: string | null;

  @ApiProperty({ enum: ['portal', 'internal'], example: 'internal' })
  bookingSource!: string;

  @ApiPropertyOptional({
    nullable: true,
    enum: ['client', 'staff'],
    description: 'Quién canceló/rechazó (si aplica)',
  })
  cancelledBy!: string | null;
}

export class PaginatedAppointmentsResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  items!: AppointmentResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export class PortalSlotsResponseDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        startsAt: { type: 'string', example: '2026-09-14T09:00:00.000Z' },
        booked: { type: 'number', example: 1 },
        capacity: { type: 'number', example: 2 },
        remaining: { type: 'number', example: 1 },
      },
    },
  })
  slots!: Array<{
    startsAt: string;
    booked: number;
    capacity: number;
    remaining: number;
  }>;
}

export class BookingCookiePayloadDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  appointmentId!: string;

  @ApiProperty()
  startsAt!: string;

  @ApiProperty()
  endsAt!: string;

  @ApiProperty()
  serviceName!: string;

  @ApiProperty()
  professionalName!: string;

  @ApiProperty()
  businessSlug!: string;

  @ApiProperty()
  cancelToken!: string;

  @ApiProperty({ example: 'pending' })
  statusCode!: string;

  @ApiPropertyOptional({ nullable: true, enum: ['client', 'staff'] })
  cancelledBy!: string | null;
}

export class PortalConfirmResponseDto {
  @ApiProperty({ type: AppointmentResponseDto })
  appointment!: AppointmentResponseDto;

  @ApiProperty({ type: BookingCookiePayloadDto })
  cookiePayload!: BookingCookiePayloadDto;
}
