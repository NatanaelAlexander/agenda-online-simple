import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class CitaNoEncontradaException extends AppException {
  constructor() {
    super('Cita no encontrada', HttpStatus.NOT_FOUND);
  }
}

export class EstadoCitaNoEncontradoException extends AppException {
  constructor(code?: string) {
    super(
      code
        ? `Estado de cita no encontrado: ${code}`
        : 'Estado de cita no encontrado',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class NegocioNoEncontradoException extends AppException {
  constructor() {
    super('Negocio no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ReservasDeshabilitadasException extends AppException {
  constructor() {
    super(
      'Este negocio no acepta reservas online por ahora',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ServicioNoEncontradoException extends AppException {
  constructor() {
    super('Servicio no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ProfesionalNoEncontradoException extends AppException {
  constructor() {
    super('Profesional no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ClienteNoEncontradoException extends AppException {
  constructor() {
    super('Cliente no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ProfesionalServicioInvalidoException extends AppException {
  constructor() {
    super(
      'El profesional no ofrece este servicio',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class HorarioNoDisponibleException extends AppException {
  constructor() {
    super('El horario elegido no está disponible', HttpStatus.CONFLICT);
  }
}

export class CitaYaCanceladaException extends AppException {
  constructor() {
    super('La cita ya está cancelada', HttpStatus.CONFLICT);
  }
}

export class BookingTokenRequeridoException extends AppException {
  constructor() {
    super(
      'Se requiere Authorization Bearer con el token de reserva',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
