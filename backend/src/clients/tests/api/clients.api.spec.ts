/**
 * Contrato HTTP clients internal, sin DB.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApiTestApp } from '../../../common/testing/create-api-test-app.js';
import { InternalClientsController } from '../../clients.controller.js';
import { ClientsService } from '../../clients.service.js';
import { ClienteNoEncontradoException } from '../../exceptions/client.exceptions.js';

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440040';
const BIZ_ID = '550e8400-e29b-41d4-a716-446655440001';

const sample = {
  id: CLIENT_ID,
  businessId: BIZ_ID,
  fullName: 'Juan Pérez',
  phone: null,
  email: 'juan@example.com',
  googleSub: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Clients API contract', () => {
  let app: INestApplication<App>;
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    service = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    app = (await createApiTestApp({
      controllers: [InternalClientsController],
      providers: [{ provide: ClientsService, useValue: service }],
    })) as INestApplication<App>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => vi.clearAllMocks());

  it('POST /internal/clients/listar', async () => {
    service.findAll.mockResolvedValue({
      items: [{ ...sample, visitCount: 2 }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app.getHttpServer())
      .post('/internal/clients/listar')
      .send({ businessId: BIZ_ID, sortBy: 'visits', minVisits: 1 })
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].visitCount).toBe(2);
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: BIZ_ID,
        sortBy: 'visits',
        minVisits: 1,
      }),
    );
  });

  it('POST /internal/clients/detalle', async () => {
    service.findById.mockResolvedValue(sample);
    const res = await request(app.getHttpServer())
      .post('/internal/clients/detalle')
      .send({ id: CLIENT_ID })
      .expect(200);
    expect(res.body.fullName).toBe('Juan Pérez');
  });

  it('POST /internal/clients/detalle 404', async () => {
    service.findById.mockRejectedValue(new ClienteNoEncontradoException());
    await request(app.getHttpServer())
      .post('/internal/clients/detalle')
      .send({ id: CLIENT_ID })
      .expect(404);
  });

  it('POST /internal/clients/create', async () => {
    service.create.mockResolvedValue(sample);
    await request(app.getHttpServer())
      .post('/internal/clients/create')
      .send({
        businessId: BIZ_ID,
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
      })
      .expect(201);
  });

  it('PATCH /internal/clients/update', async () => {
    service.update.mockResolvedValue({ ...sample, fullName: 'Juan P.' });
    const res = await request(app.getHttpServer())
      .patch('/internal/clients/update')
      .send({ id: CLIENT_ID, fullName: 'Juan P.' })
      .expect(200);
    expect(res.body.fullName).toBe('Juan P.');
  });

  it('POST /internal/clients/delete', async () => {
    service.delete.mockResolvedValue({ id: CLIENT_ID });
    const res = await request(app.getHttpServer())
      .post('/internal/clients/delete')
      .send({ id: CLIENT_ID })
      .expect(200);
    expect(res.body.id).toBe(CLIENT_ID);
  });
});
