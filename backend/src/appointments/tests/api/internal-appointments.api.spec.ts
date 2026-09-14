import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApiTestApp } from '../../../common/testing/create-api-test-app.js';
import { InternalAppointmentsController } from '../../appointments.controller.js';
import { AppointmentsService } from '../../appointments.service.js';
import { CitaNoEncontradaException } from '../../exceptions/appointments.exceptions.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

const DETAIL = {
  id: UUID,
  businessId: UUID,
  serviceId: UUID,
  professionalId: UUID,
  clientId: UUID,
  statusCode: 'confirmed',
  statusName: 'Confirmada',
  startsAt: '2026-09-14T10:00:00.000Z',
  endsAt: '2026-09-14T10:30:00.000Z',
  businessName: 'Demo',
  businessSlug: 'barberia-demo',
  serviceName: 'Corte',
  professionalName: 'Barbero',
  clientName: 'Cliente',
  clientEmail: 'c@example.com',
};

describe('Internal Appointments API contract', () => {
  let app: INestApplication<App>;
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    changeStatus: ReturnType<typeof vi.fn>;
    reschedule: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    service = {
      findAll: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      }),
      findById: vi.fn().mockResolvedValue(DETAIL),
      create: vi.fn().mockResolvedValue(DETAIL),
      changeStatus: vi.fn().mockResolvedValue({ ...DETAIL, statusCode: 'attended' }),
      reschedule: vi.fn().mockResolvedValue(DETAIL),
      cancel: vi.fn().mockResolvedValue({ ...DETAIL, statusCode: 'cancelled' }),
    };

    app = await createApiTestApp({
      controllers: [InternalAppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: service }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /internal/appointments/listar', async () => {
    const res = await request(app.getHttpServer())
      .post('/internal/appointments/listar')
      .send({})
      .expect(200);
    expect(res.body.total).toBe(0);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('POST /internal/appointments/detalle', async () => {
    await request(app.getHttpServer())
      .post('/internal/appointments/detalle')
      .send({ id: UUID })
      .expect(200);
    expect(service.findById).toHaveBeenCalledWith(UUID);
  });

  it('POST /internal/appointments/detalle 404', async () => {
    service.findById.mockRejectedValue(new CitaNoEncontradaException());
    await request(app.getHttpServer())
      .post('/internal/appointments/detalle')
      .send({ id: UUID })
      .expect(404);
  });

  it('POST /internal/appointments/create', async () => {
    await request(app.getHttpServer())
      .post('/internal/appointments/create')
      .send({
        businessId: UUID,
        serviceId: UUID,
        professionalId: UUID,
        clientId: UUID,
        startsAt: '2026-09-14T10:00:00.000Z',
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: UUID,
        bookingSource: 'internal',
      }),
    );
  });

  it('POST /internal/appointments/create rechaza body inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/appointments/create')
      .send({ businessId: 'bad' })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('POST /internal/appointments/change-status', async () => {
    await request(app.getHttpServer())
      .post('/internal/appointments/change-status')
      .send({ id: UUID, statusCode: 'attended' })
      .expect(200);
    expect(service.changeStatus).toHaveBeenCalledWith(UUID, 'attended');
  });

  it('POST /internal/appointments/reschedule', async () => {
    await request(app.getHttpServer())
      .post('/internal/appointments/reschedule')
      .send({ id: UUID, startsAt: '2026-09-14T15:00:00.000Z' })
      .expect(200);
    expect(service.reschedule).toHaveBeenCalledWith(
      UUID,
      '2026-09-14T15:00:00.000Z',
    );
  });

  it('POST /internal/appointments/cancel', async () => {
    await request(app.getHttpServer())
      .post('/internal/appointments/cancel')
      .send({ id: UUID })
      .expect(200);
    expect(service.cancel).toHaveBeenCalledWith(UUID);
  });
});
