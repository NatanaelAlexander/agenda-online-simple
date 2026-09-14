import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class PaginatedScheduleExceptionsResponseDto {
  @ApiProperty({ type: [ScheduleExceptionResponseDto] })
  items!: ScheduleExceptionResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
