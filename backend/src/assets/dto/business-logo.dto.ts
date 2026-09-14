import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BusinessIdDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId!: string;
}
