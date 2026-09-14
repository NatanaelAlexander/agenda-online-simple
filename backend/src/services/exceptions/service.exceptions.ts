import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class ServicioNoEncontradoException extends AppException {
  constructor() {
    super('Servicio no encontrado', HttpStatus.NOT_FOUND);
  }
}
