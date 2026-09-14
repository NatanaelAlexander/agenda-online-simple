import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter.js';
import { factoryValidacion } from '../../../common/pipes/validation.factory.js';
import { InternalAuditController } from '../../audit.controller.js';
import { AuditService } from '../../audit.service.js';
import { AuditLogNoEncontradoException } from '../../exceptions/audit.exceptions.js';

describe('Audit API contract', () => {
  let app: INestApplication<App>;
  let auditService: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    auditService = {
      findAll: vi.fn(),
      findById: vi.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [InternalAuditController],
      providers: [{ provide: AuditService, useValue: auditService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AppExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: factoryValidacion,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /internal/audit-logs/listar', async () => {
    auditService.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .send({})
      .expect(200);
    expect(res.body.total).toBe(0);
  });

  it('POST /internal/audit-logs/detalle 404', async () => {
    auditService.findById.mockRejectedValue(new AuditLogNoEncontradoException());
    await request(app.getHttpServer())
      .post('/internal/audit-logs/detalle')
      .send({ id: '550e8400-e29b-41d4-a716-446655440000' })
      .expect(404);
  });
});
