import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class NegocioNoEncontradoException extends AppException {
  constructor() {
    super('Negocio no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ReservasDeshabilitadasException extends AppException {
  constructor() {
    super('Este negocio no acepta reservas online por ahora', HttpStatus.FORBIDDEN);
  }
}
