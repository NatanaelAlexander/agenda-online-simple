import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ErrorResponseDto } from '../exceptions/app.exception.js';

/**
 * OpenAPI vía @nestjs/swagger + UI Scalar (igual que Team Prime Digital).
 * - UI:     GET /api/reference
 * - JSON:   GET /api/docs/json
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('agenda-online-simple API')
    .setDescription(
      [
        'API de agenda online (instalación propia, no SaaS multi-tenant gigante).',
        '',
        '**Auth panel (internos):** `POST /api/auth/login` → Bearer access + refresh.',
        'Rutas `internal/*` requieren `Authorization: Bearer <accessToken>`.',
        '',
        '**Reserva (cliente):** Google OAuth → booking session JWT one-shot (Redis).',
        'No crea filas en `users`. Tras confirmar cita se invalida la sesión.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token de POST /api/auth/login (panel interno)',
      },
      'access-token',
    )
    .addTag('Auth', 'Login panel interno (email + password + JWT/refresh)')
    .addTag(
      'Auth · Booking Google',
      'OAuth Google solo para confirmar identidad al agendar (one-shot)',
    )
    .addTag('Audit — Internal', 'Consulta de audit_logs')
    .addTag('Assets — Internal', 'Upload R2 + vínculos system/business/professional/service')
    .addTag('Businesses — Internal', 'CRUD negocio')
    .addTag('Businesses — Portal', 'Negocio público por slug')
    .addTag('Services — Internal', 'Servicios del negocio')
    .addTag('Professionals — Internal', 'Profesionales, horarios y excepciones')
    .addTag('Clients — Internal', 'Fichas de clientes')
    .addTag('Appointments — Internal', 'Citas del panel')
    .addTag(
      'Appointments — Portal',
      'Slots públicos, confirmar con booking JWT, cancelar',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });

  app.getHttpAdapter().get(
    '/api/docs/json',
    (_req: unknown, res: { json: (body: unknown) => void }) => {
      res.json(document);
    },
  );

  app.use(
    '/api/reference',
    apiReference({
      content: document,
    }),
  );
}
