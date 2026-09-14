import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ProfessionalIdDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId!: string;
}
