import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export interface ErrorResponse {
  statusCode: number;
  mensaje: string | string[];
}

export class ErrorResponseDto implements ErrorResponse {
  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode!: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Recurso no encontrado' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['El nombre es obligatorio'],
      },
    ],
  })
  mensaje!: string | string[];
}

export class AppException extends HttpException {
  constructor(mensaje: string, status: HttpStatus) {
    super({ statusCode: status, mensaje }, status);
  }
}
