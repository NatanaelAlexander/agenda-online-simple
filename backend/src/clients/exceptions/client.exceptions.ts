import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class ClienteNoEncontradoException extends AppException {
  constructor() {
    super('Cliente no encontrado', HttpStatus.NOT_FOUND);
  }
}
