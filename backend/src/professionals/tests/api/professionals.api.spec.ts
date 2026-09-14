/**
 * Contrato HTTP professionals internal, sin DB.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApiTestApp } from '../../../common/testing/create-api-test-app.js';
import {
  ExcepcionHorarioNoEncontradaException,
  ProfesionalNoEncontradoException,
} from '../../exceptions/professional.exceptions.js';
import { InternalProfessionalsController } from '../../professionals.controller.js';
import { ProfessionalsService } from '../../professionals.service.js';

const PRO_ID = '550e8400-e29b-41d4-a716-446655440020';
const BIZ_ID = '550e8400-e29b-41d4-a716-446655440001';
const EXC_ID = '550e8400-e29b-41d4-a716-446655440030';
const SVC_ID = '550e8400-e29b-41d4-a716-446655440010';

const samplePro = {
  id: PRO_ID,
  businessId: BIZ_ID,
  userId: null,
  displayName: 'Ana Pérez',
  email: 'ana@demo.local',
  phone: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleException = {
  id: EXC_ID,
  businessId: BIZ_ID,
  professionalId: PRO_ID,
  exceptionDate: '2026-09-13',
  isClosed: true,
  startTime: null,
  endTime: null,
  reason: 'Feriado',
};

describe('Professionals API contract', () => {
  let app: INestApplication<App>;
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
    setSchedules: ReturnType<typeof vi.fn>;
    listSchedules: ReturnType<typeof vi.fn>;
    setServices: ReturnType<typeof vi.fn>;
    listServiceIds: ReturnType<typeof vi.fn>;
    listExceptions: ReturnType<typeof vi.fn>;
    createException: ReturnType<typeof vi.fn>;
    deleteException: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    service = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
      setSchedules: vi.fn(),
      listSchedules: vi.fn(),
      setServices: vi.fn(),
      listServiceIds: vi.fn(),
      listExceptions: vi.fn(),
      createException: vi.fn(),
      deleteException: vi.fn(),
    };
    app = (await createApiTestApp({
      controllers: [InternalProfessionalsController],
      providers: [{ provide: ProfessionalsService, useValue: service }],
    })) as INestApplication<App>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => vi.clearAllMocks());

  it('POST /internal/professionals/listar', async () => {
    service.findAll.mockResolvedValue({
      items: [samplePro],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/listar')
      .send({ businessId: BIZ_ID })
      .expect(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('POST /internal/professionals/detalle', async () => {
    service.findById.mockResolvedValue(samplePro);
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/detalle')
      .send({ id: PRO_ID })
      .expect(200);
    expect(res.body.displayName).toBe('Ana Pérez');
  });

  it('POST /internal/professionals/detalle 404', async () => {
    service.findById.mockRejectedValue(new ProfesionalNoEncontradoException());
    await request(app.getHttpServer())
      .post('/internal/professionals/detalle')
      .send({ id: PRO_ID })
      .expect(404);
  });

  it('POST /internal/professionals/create', async () => {
    service.create.mockResolvedValue(samplePro);
    await request(app.getHttpServer())
      .post('/internal/professionals/create')
      .send({ businessId: BIZ_ID, displayName: 'Ana Pérez' })
      .expect(201);
  });

  it('PATCH /internal/professionals/update', async () => {
    service.update.mockResolvedValue({ ...samplePro, displayName: 'Ana G.' });
    const res = await request(app.getHttpServer())
      .patch('/internal/professionals/update')
      .send({ id: PRO_ID, displayName: 'Ana G.' })
      .expect(200);
    expect(res.body.displayName).toBe('Ana G.');
  });

  it('POST /internal/professionals/desactivar', async () => {
    service.deactivate.mockResolvedValue({ ...samplePro, isActive: false });
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/desactivar')
      .send({ id: PRO_ID })
      .expect(200);
    expect(res.body.isActive).toBe(false);
  });

  it('POST /internal/professionals/set-schedules', async () => {
    service.setSchedules.mockResolvedValue([
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        professionalId: PRO_ID,
        weekday: 1,
        startTime: '09:00:00',
        endTime: '18:00:00',
      },
    ]);
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/set-schedules')
      .send({
        professionalId: PRO_ID,
        schedules: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
      })
      .expect(200);
    expect(res.body.schedules).toHaveLength(1);
  });

  it('POST /internal/professionals/schedules/listar', async () => {
    service.listSchedules.mockResolvedValue([
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        professionalId: PRO_ID,
        weekday: 1,
        startTime: '09:00',
        endTime: '18:00',
      },
    ]);
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/schedules/listar')
      .send({ professionalId: PRO_ID })
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].weekday).toBe(1);
  });

  it('POST /internal/professionals/set-services', async () => {
    service.setServices.mockResolvedValue([SVC_ID]);
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/set-services')
      .send({ professionalId: PRO_ID, serviceIds: [SVC_ID] })
      .expect(200);
    expect(res.body.serviceIds).toEqual([SVC_ID]);
  });

  it('POST /internal/professionals/services/listar', async () => {
    service.listServiceIds.mockResolvedValue([SVC_ID]);
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/services/listar')
      .send({ professionalId: PRO_ID })
      .expect(200);
    expect(res.body.serviceIds).toEqual([SVC_ID]);
    expect(service.listServiceIds).toHaveBeenCalledWith(PRO_ID);
  });

  it('POST /internal/professionals/exceptions/listar', async () => {
    service.listExceptions.mockResolvedValue({
      items: [sampleException],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/exceptions/listar')
      .send({ businessId: BIZ_ID })
      .expect(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('POST /internal/professionals/exceptions/create', async () => {
    service.createException.mockResolvedValue(sampleException);
    const res = await request(app.getHttpServer())
      .post('/internal/professionals/exceptions/create')
      .send({
        businessId: BIZ_ID,
        professionalId: PRO_ID,
        exceptionDate: '2026-09-13',
        isClosed: true,
        reason: 'Feriado',
      })
      .expect(201);
    expect(res.body.reason).toBe('Feriado');
  });

  it('POST /internal/professionals/exceptions/eliminar', async () => {
    service.deleteException.mockResolvedValue(sampleException);
    await request(app.getHttpServer())
      .post('/internal/professionals/exceptions/eliminar')
      .send({ id: EXC_ID })
      .expect(200);
  });

  it('POST /internal/professionals/exceptions/eliminar 404', async () => {
    service.deleteException.mockRejectedValue(
      new ExcepcionHorarioNoEncontradaException(),
    );
    await request(app.getHttpServer())
      .post('/internal/professionals/exceptions/eliminar')
      .send({ id: EXC_ID })
      .expect(404);
  });
});
