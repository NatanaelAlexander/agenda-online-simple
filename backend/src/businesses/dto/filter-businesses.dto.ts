import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FilterBusinessesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(200)
  search?: string;

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
  @Min(1, { message: 'El tamaño de página mínimo es 1' })
  @Max(200, { message: 'El tamaño de página máximo es 200' })
  pageSize?: number;
}
