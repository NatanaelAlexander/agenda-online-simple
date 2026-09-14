import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class ProfesionalNoEncontradoException extends AppException {
  constructor() {
    super('Profesional no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ExcepcionHorarioNoEncontradaException extends AppException {
  constructor() {
    super('Excepción de horario no encontrada', HttpStatus.NOT_FOUND);
  }
}
