import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class BusinessScheduleItemDto {
  @ApiProperty({ example: 1, description: '0=domingo … 6=sábado' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'startTime debe ser HH:MM',
  })
  startTime!: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'endTime debe ser HH:MM',
  })
  endTime!: string;
}

export class SetBusinessSchedulesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  businessId!: string;

  @ApiProperty({ type: [BusinessScheduleItemDto] })
  @IsArray()
  @ArrayMaxSize(21)
  @ValidateNested({ each: true })
  @Type(() => BusinessScheduleItemDto)
  schedules!: BusinessScheduleItemDto[];
}

export class ListBusinessSchedulesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  businessId!: string;
}
