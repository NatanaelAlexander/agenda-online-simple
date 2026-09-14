import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApiTestApp } from '../../../common/testing/create-api-test-app.js';
import { PortalAppointmentsController } from '../../appointments.controller.js';
import { AppointmentsService } from '../../appointments.service.js';
import {
  BookingTokenRequeridoException,
  CitaNoEncontradaException,
} from '../../exceptions/appointments.exceptions.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const CANCEL_TOKEN = 'a'.repeat(64);

const DETAIL = {
  id: UUID,
  statusCode: 'confirmed',
  businessSlug: 'barberia-demo',
  serviceName: 'Corte',
  professionalName: 'Barbero',
  clientName: 'Cliente',
  clientEmail: 'c@example.com',
  startsAt: '2026-09-14T10:00:00.000Z',
  endsAt: '2026-09-14T10:30:00.000Z',
  cancelToken: CANCEL_TOKEN,
};

describe('Portal Appointments API contract', () => {
  let app: INestApplication<App>;
  let service: {
    getPortalSlots: ReturnType<typeof vi.fn>;
    confirmPortal: ReturnType<typeof vi.fn>;
    cancelByToken: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    service = {
      getPortalSlots: vi.fn().mockResolvedValue({
        slots: [
          {
            startsAt: '2026-09-14T10:00:00.000Z',
            booked: 0,
            capacity: 1,
            remaining: 1,
          },
        ],
      }),
      confirmPortal: vi.fn().mockResolvedValue({
        appointment: DETAIL,
        cookiePayload: {
          email: 'c@example.com',
          name: 'Cliente',
          appointmentId: UUID,
          startsAt: DETAIL.startsAt,
          endsAt: DETAIL.endsAt,
          serviceName: 'Corte',
          professionalName: 'Barbero',
          businessSlug: 'barberia-demo',
          cancelToken: CANCEL_TOKEN,
        },
      }),
      cancelByToken: vi
        .fn()
        .mockResolvedValue({ ...DETAIL, statusCode: 'cancelled' }),
    };

    app = await createApiTestApp({
      controllers: [PortalAppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: service }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /portal/appointments/slots', async () => {
    const res = await request(app.getHttpServer())
      .post('/portal/appointments/slots')
      .send({
        businessSlug: 'barberia-demo',
        serviceId: UUID,
        professionalId: UUID,
        date: '2026-09-14',
      })
      .expect(200);
    expect(res.body.slots).toHaveLength(1);
    expect(service.getPortalSlots).toHaveBeenCalled();
  });

  it('POST /portal/appointments/slots rechaza date inválida', async () => {
    await request(app.getHttpServer())
      .post('/portal/appointments/slots')
      .send({
        businessSlug: 'barberia-demo',
        serviceId: UUID,
        professionalId: UUID,
        date: '14-09-2026',
      })
      .expect(400);
    expect(service.getPortalSlots).not.toHaveBeenCalled();
  });

  it('POST /portal/appointments/confirm', async () => {
    const res = await request(app.getHttpServer())
      .post('/portal/appointments/confirm')
      .set('Authorization', 'Bearer booking-token-xyz')
      .send({
        businessSlug: 'barberia-demo',
        serviceId: UUID,
        professionalId: UUID,
        startsAt: '2026-09-14T10:00:00.000Z',
      })
      .expect(201);
    expect(res.body.cookiePayload.appointmentId).toBe(UUID);
    expect(service.confirmPortal).toHaveBeenCalledWith(
      'booking-token-xyz',
      expect.objectContaining({ businessSlug: 'barberia-demo' }),
    );
  });

  it('POST /portal/appointments/confirm sin Bearer', async () => {
    service.confirmPortal.mockRejectedValue(new BookingTokenRequeridoException());
    await request(app.getHttpServer())
      .post('/portal/appointments/confirm')
      .send({
        businessSlug: 'barberia-demo',
        serviceId: UUID,
        professionalId: UUID,
        startsAt: '2026-09-14T10:00:00.000Z',
      })
      .expect(401);
  });

  it('POST /portal/appointments/cancel', async () => {
    await request(app.getHttpServer())
      .post('/portal/appointments/cancel')
      .send({ cancelToken: CANCEL_TOKEN })
      .expect(200);
    expect(service.cancelByToken).toHaveBeenCalledWith(CANCEL_TOKEN);
  });

  it('POST /portal/appointments/cancel 404', async () => {
    service.cancelByToken.mockRejectedValue(new CitaNoEncontradaException());
    await request(app.getHttpServer())
      .post('/portal/appointments/cancel')
      .send({ cancelToken: CANCEL_TOKEN })
      .expect(404);
  });
});
