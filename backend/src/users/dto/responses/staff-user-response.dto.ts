import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StaffUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  phoneNumber!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [String], example: ['admin'] })
  roles!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedStaffUsersResponseDto {
  @ApiProperty({ type: [StaffUserResponseDto] })
  items!: StaffUserResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
