import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  tableName!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  recordId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  oldValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  newValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  ipAddress!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedAuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items!: AuditLogResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
