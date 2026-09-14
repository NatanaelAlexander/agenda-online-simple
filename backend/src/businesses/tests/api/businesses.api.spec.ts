/**
 * Contrato HTTP businesses (internal + portal), sin DB.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApiTestApp } from '../../../common/testing/create-api-test-app.js';
import { InternalBusinessesController } from '../../businesses.controller.js';
import { BusinessesService } from '../../businesses.service.js';
import { NegocioNoEncontradoException } from '../../exceptions/business.exceptions.js';
import { PortalBusinessesController } from '../../portal-businesses.controller.js';

const BIZ_ID = '550e8400-e29b-41d4-a716-446655440001';
const PRO_ID = '550e8400-e29b-41d4-a716-446655440020';
const SVC_ID = '550e8400-e29b-41d4-a716-446655440010';

const sampleBusiness = {
  id: BIZ_ID,
  name: 'Barbería Demo',
  slug: 'barberia-demo',
  description: null,
  phone: null,
  email: null,
  address: null,
  timezone: 'America/Santiago',
  socialLinks: {},
  bookingEnabled: true,
  qrPosterHeadline: 'Agenda tu hora',
  qrPosterFooter: 'Escanea el código y reserva en segundos',
  maxBookingsPerSlot: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleCatalog = {
  business: sampleBusiness,
  services: [
    {
      id: SVC_ID,
      name: 'Corte',
      description: null,
      durationMinutes: 30,
      priceCents: 1500000,
      color: null,
    },
  ],
  professionals: [
    {
      id: PRO_ID,
      displayName: 'Barbero Demo',
      serviceIds: [SVC_ID],
    },
  ],
  schedules: [
    { weekday: 1, startTime: '09:00', endTime: '18:00' },
    { weekday: 5, startTime: '09:00', endTime: '18:00' },
  ],
  exceptions: [] as Array<{
    exceptionDate: string;
    isClosed: boolean;
    professionalId: string | null;
    reason: string | null;
  }>,
  logoUrl: null as string | null,
};

describe('Businesses API contract', () => {
  let app: INestApplication<App>;
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findBySlug: ReturnType<typeof vi.fn>;
    findPublicCatalog: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    service = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findPublicCatalog: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    app = (await createApiTestApp({
      controllers: [InternalBusinessesController, PortalBusinessesController],
      providers: [{ provide: BusinessesService, useValue: service }],
    })) as INestApplication<App>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /internal/businesses/listar', async () => {
    service.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app.getHttpServer())
      .post('/internal/businesses/listar')
      .send({})
      .expect(200);
    expect(res.body.total).toBe(0);
  });

  it('POST /internal/businesses/detalle 404', async () => {
    service.findById.mockRejectedValue(new NegocioNoEncontradoException());
    await request(app.getHttpServer())
      .post('/internal/businesses/detalle')
      .send({ id: BIZ_ID })
      .expect(404);
  });

  it('POST /internal/businesses/detalle', async () => {
    service.findById.mockResolvedValue(sampleBusiness);
    const res = await request(app.getHttpServer())
      .post('/internal/businesses/detalle')
      .send({ id: BIZ_ID })
      .expect(200);
    expect(res.body.slug).toBe('barberia-demo');
  });

  it('POST /internal/businesses/create', async () => {
    service.create.mockResolvedValue(sampleBusiness);
    const res = await request(app.getHttpServer())
      .post('/internal/businesses/create')
      .send({ name: 'Barbería Demo', slug: 'barberia-demo' })
      .expect(201);
    expect(res.body.id).toBe(BIZ_ID);
    expect(service.create).toHaveBeenCalled();
  });

  it('PATCH /internal/businesses/update', async () => {
    service.update.mockResolvedValue({ ...sampleBusiness, name: 'Nuevo' });
    const res = await request(app.getHttpServer())
      .patch('/internal/businesses/update')
      .send({ id: BIZ_ID, name: 'Nuevo' })
      .expect(200);
    expect(res.body.name).toBe('Nuevo');
  });

  it('PATCH /internal/businesses/update con textos QR', async () => {
    service.update.mockResolvedValue({
      ...sampleBusiness,
      qrPosterHeadline: 'Reserva aquí',
      bookingEnabled: false,
    });
    const res = await request(app.getHttpServer())
      .patch('/internal/businesses/update')
      .send({
        id: BIZ_ID,
        qrPosterHeadline: 'Reserva aquí',
        bookingEnabled: false,
      })
      .expect(200);
    expect(res.body.qrPosterHeadline).toBe('Reserva aquí');
    expect(res.body.bookingEnabled).toBe(false);
  });

  it('GET /portal/businesses/:slug', async () => {
    service.findBySlug.mockResolvedValue(sampleBusiness);
    const res = await request(app.getHttpServer())
      .get('/portal/businesses/barberia-demo')
      .expect(200);
    expect(res.body.slug).toBe('barberia-demo');
  });

  it('GET /portal/businesses/:slug 404', async () => {
    service.findBySlug.mockRejectedValue(new NegocioNoEncontradoException());
    await request(app.getHttpServer())
      .get('/portal/businesses/no-existe')
      .expect(404);
  });

  it('GET /portal/businesses/:slug/catalog incluye schedules', async () => {
    service.findPublicCatalog.mockResolvedValue(sampleCatalog);
    const res = await request(app.getHttpServer())
      .get('/portal/businesses/barberia-demo/catalog')
      .expect(200);
    expect(res.body.professionals).toHaveLength(1);
    expect(res.body.schedules).toHaveLength(2);
    expect(res.body.schedules[0]).toEqual({
      weekday: 1,
      startTime: '09:00',
      endTime: '18:00',
    });
    expect(service.findPublicCatalog).toHaveBeenCalledWith('barberia-demo');
  });

  it('GET /portal/businesses/:slug/catalog incluye exceptions cerradas', async () => {
    service.findPublicCatalog.mockResolvedValue({
      ...sampleCatalog,
      exceptions: [
        {
          exceptionDate: '2026-12-25',
          isClosed: true,
          professionalId: null,
          reason: 'Navidad',
        },
      ],
    });
    const res = await request(app.getHttpServer())
      .get('/portal/businesses/barberia-demo/catalog')
      .expect(200);
    expect(res.body.exceptions).toHaveLength(1);
    expect(res.body.exceptions[0].exceptionDate).toBe('2026-12-25');
    expect(res.body.exceptions[0].isClosed).toBe(true);
  });
});
