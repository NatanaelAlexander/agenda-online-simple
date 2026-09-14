import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class PortalCancelDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  @MaxLength(64)
  cancelToken!: string;
}
