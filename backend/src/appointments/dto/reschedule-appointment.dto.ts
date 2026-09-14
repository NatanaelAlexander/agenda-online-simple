import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsUUID } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id!: string;

  @ApiProperty({ example: '2026-09-15T11:00:00.000Z' })
  @IsISO8601({}, { message: 'startsAt debe ser ISO-8601' })
  startsAt!: string;
}
