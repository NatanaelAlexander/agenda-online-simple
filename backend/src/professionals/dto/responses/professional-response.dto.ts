import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfessionalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  businessId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedProfessionalsResponseDto {
  @ApiProperty({ type: [ProfessionalResponseDto] })
  items!: ProfessionalResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export class ProfessionalScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  professionalId!: string;

  @ApiProperty()
  weekday!: number;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;
}

export class ScheduleExceptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  businessId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  professionalId!: string | null;

  @ApiProperty()
  exceptionDate!: string;

  @ApiProperty()
  isClosed!: boolean;

  @ApiPropertyOptional({ nullable: true })
  startTime!: string | null;

  @ApiPropertyOptional({ nullable: true })
  endTime!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;
}

export class SetServicesResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [String] })
  serviceIds!: string[];
}

export class SetSchedulesResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: 'array' })
  schedules!: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
  }>;
}
