import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception.js';

export class AssetNoEncontradoException extends AppException {
  constructor() {
    super('Archivo no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class R2NoConfiguradoException extends AppException {
  constructor() {
    super(
      'Almacenamiento de archivos no configurado. Revisa R2_* en .env.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class ArchivoRequeridoException extends AppException {
  constructor() {
    super('Debes enviar un archivo en el campo file', HttpStatus.BAD_REQUEST);
  }
}

export class TipoArchivoNoPermitidoException extends AppException {
  constructor() {
    super(
      'Solo se permiten imágenes JPG, PNG o WEBP',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ArchivoDemasiadoGrandeException extends AppException {
  constructor(maxMb: number) {
    super(
      `El archivo no puede superar ${maxMb} MB`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
