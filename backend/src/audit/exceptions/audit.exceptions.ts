import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class AuditLogNoEncontradoException extends AppException {
  constructor() {
    super('Registro de auditoría no encontrado', HttpStatus.NOT_FOUND);
  }
}
