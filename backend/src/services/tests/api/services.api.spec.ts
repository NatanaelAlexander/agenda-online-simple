/**
 * Contrato HTTP services internal, sin DB.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApiTestApp } from '../../../common/testing/create-api-test-app.js';
import { ServicioNoEncontradoException } from '../../exceptions/service.exceptions.js';
import { InternalServicesController } from '../../services.controller.js';
import { ServicesService } from '../../services.service.js';

const SVC_ID = '550e8400-e29b-41d4-a716-446655440010';
const BIZ_ID = '550e8400-e29b-41d4-a716-446655440001';

const sample = {
  id: SVC_ID,
  businessId: BIZ_ID,
  name: 'Corte clásico',
  description: null,
  durationMinutes: 30,
  prepMinutes: 0,
  bufferMinutes: 10,
  priceCents: 12000,
  color: '#2563eb',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Services API contract', () => {
  let app: INestApplication<App>;
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    service = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
    };
    app = (await createApiTestApp({
      controllers: [InternalServicesController],
      providers: [{ provide: ServicesService, useValue: service }],
    })) as INestApplication<App>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => vi.clearAllMocks());

  it('POST /internal/services/listar', async () => {
    service.findAll.mockResolvedValue({
      items: [sample],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app.getHttpServer())
      .post('/internal/services/listar')
      .send({ businessId: BIZ_ID })
      .expect(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('POST /internal/services/detalle', async () => {
    service.findById.mockResolvedValue(sample);
    const res = await request(app.getHttpServer())
      .post('/internal/services/detalle')
      .send({ id: SVC_ID })
      .expect(200);
    expect(res.body.name).toBe('Corte clásico');
  });

  it('POST /internal/services/detalle 404', async () => {
    service.findById.mockRejectedValue(new ServicioNoEncontradoException());
    await request(app.getHttpServer())
      .post('/internal/services/detalle')
      .send({ id: SVC_ID })
      .expect(404);
  });

  it('POST /internal/services/create', async () => {
    service.create.mockResolvedValue(sample);
    await request(app.getHttpServer())
      .post('/internal/services/create')
      .send({
        businessId: BIZ_ID,
        name: 'Corte clásico',
        durationMinutes: 30,
      })
      .expect(201);
  });

  it('POST /internal/services/create sin precio (opcional)', async () => {
    service.create.mockResolvedValue({ ...sample, priceCents: null });
    const res = await request(app.getHttpServer())
      .post('/internal/services/create')
      .send({
        businessId: BIZ_ID,
        name: 'Consulta',
        durationMinutes: 20,
        priceCents: null,
      })
      .expect(201);
    expect(res.body.priceCents).toBeNull();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Consulta',
        priceCents: null,
      }),
    );
  });

  it('POST /internal/services/create sin duración ni precio', async () => {
    service.create.mockResolvedValue({
      ...sample,
      durationMinutes: null,
      priceCents: null,
    });
    const res = await request(app.getHttpServer())
      .post('/internal/services/create')
      .send({
        businessId: BIZ_ID,
        name: 'Servicio libre',
        durationMinutes: null,
        priceCents: null,
      })
      .expect(201);
    expect(res.body.durationMinutes).toBeNull();
    expect(res.body.priceCents).toBeNull();
  });

  it('PATCH /internal/services/update', async () => {
    service.update.mockResolvedValue({ ...sample, name: 'Corte premium' });
    const res = await request(app.getHttpServer())
      .patch('/internal/services/update')
      .send({ id: SVC_ID, name: 'Corte premium' })
      .expect(200);
    expect(res.body.name).toBe('Corte premium');
  });

  it('POST /internal/services/desactivar', async () => {
    service.deactivate.mockResolvedValue({ ...sample, isActive: false });
    const res = await request(app.getHttpServer())
      .post('/internal/services/desactivar')
      .send({ id: SVC_ID })
      .expect(200);
    expect(res.body.isActive).toBe(false);
  });
});
