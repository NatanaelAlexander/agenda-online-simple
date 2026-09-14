import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsUUID,
} from 'class-validator';

export class SetServicesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId!: string;

  @ApiProperty({ type: 'string', format: 'uuid', isArray: true })
  @IsArray({ message: 'serviceIds debe ser un arreglo' })
  @ArrayMaxSize(200, { message: 'Demasiados servicios' })
  @IsUUID('4', { each: true, message: 'Cada serviceId debe ser un UUID válido' })
  serviceIds!: string[];
}
