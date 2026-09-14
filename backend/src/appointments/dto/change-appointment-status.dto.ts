import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class ChangeAppointmentStatusDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id!: string;

  @ApiProperty({ example: 'attended' })
  @IsString()
  @MaxLength(50)
  statusCode!: string;
}
