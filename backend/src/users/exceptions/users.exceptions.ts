import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class UsuarioEmailDuplicadoException extends AppException {
  constructor() {
    super('Ya existe un usuario con ese correo', HttpStatus.CONFLICT);
  }
}

export class RolUsuarioInvalidoException extends AppException {
  constructor() {
    super('El rol debe ser admin o super_admin', HttpStatus.BAD_REQUEST);
  }
}

export class RolNoEncontradoException extends AppException {
  constructor() {
    super('Rol no encontrado en el sistema', HttpStatus.NOT_FOUND);
  }
}

export class UsuarioNoEncontradoException extends AppException {
  constructor() {
    super('Usuario no encontrado', HttpStatus.NOT_FOUND);
  }
}
