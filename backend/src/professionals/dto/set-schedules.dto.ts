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

export class ProfessionalScheduleItemDto {
  @ApiProperty({ example: 1, description: '0=domingo … 6=sábado' })
  @IsInt({ message: 'weekday debe ser un entero' })
  @Min(0, { message: 'weekday mínimo 0' })
  @Max(6, { message: 'weekday máximo 6' })
  weekday!: number;

  @ApiProperty({ example: '09:00' })
  @IsString({ message: 'startTime debe ser texto' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'startTime debe tener formato HH:mm o HH:mm:ss',
  })
  startTime!: string;

  @ApiProperty({ example: '18:00' })
  @IsString({ message: 'endTime debe ser texto' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'endTime debe tener formato HH:mm o HH:mm:ss',
  })
  endTime!: string;
}

export class SetSchedulesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido' })
  professionalId!: string;

  @ApiProperty({ type: [ProfessionalScheduleItemDto] })
  @IsArray({ message: 'schedules debe ser un arreglo' })
  @ArrayMaxSize(50, { message: 'Demasiados bloques de horario' })
  @ValidateNested({ each: true })
  @Type(() => ProfessionalScheduleItemDto)
  schedules!: ProfessionalScheduleItemDto[];
}
