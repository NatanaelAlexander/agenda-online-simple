import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class FilterClientsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'El businessId debe ser un UUID válido' })
  businessId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por nombre' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Filtrar por correo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Filtrar por teléfono' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Mínimo de citas oficiales (excluye canceladas)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minVisits debe ser un entero' })
  @Min(0)
  minVisits?: number;

  @ApiPropertyOptional({ enum: ['name', 'visits'], default: 'name' })
  @IsOptional()
  @IsIn(['name', 'visits'], { message: 'sortBy inválido' })
  sortBy?: 'name' | 'visits';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortDir inválido' })
  sortDir?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un entero' })
  @Min(1)
  @Max(200)
  pageSize?: number;
}
