/**
 * Contrato HTTP branding (service mock).
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createApiTestApp } from '../../../common/testing/create-api-test-app.js';
import {
  InternalSystemBrandingController,
  PortalSystemController,
} from '../../system.controller.js';
import { SystemBrandingService } from '../../system-branding.service.js';

const sample = {
  id: 1,
  themeId: 'default',
  primaryColor: '#2A7A6E',
  accentColor: '#D6EFE9',
  backgroundColor: '#F9F7F0',
  foregroundColor: '#2A3F44',
  bookingHomeLayout: 'classic',
  updatedAt: new Date().toISOString(),
};

describe('System branding API contract', () => {
  let app: INestApplication<App>;
  let service: {
    get: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    service = {
      get: vi.fn().mockResolvedValue(sample),
      update: vi.fn().mockResolvedValue({ ...sample, primaryColor: '#111111' }),
      reset: vi.fn().mockResolvedValue(sample),
    };

    app = await createApiTestApp({
      controllers: [InternalSystemBrandingController, PortalSystemController],
      providers: [{ provide: SystemBrandingService, useValue: service }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => vi.clearAllMocks());

  it('GET /portal/system/branding', async () => {
    const res = await request(app.getHttpServer())
      .get('/portal/system/branding')
      .expect(200);
    expect(res.body.bookingHomeLayout).toBe('classic');
  });

  it('POST /internal/system/branding', async () => {
    const res = await request(app.getHttpServer())
      .post('/internal/system/branding')
      .send({})
      .expect(200);
    expect(res.body.primaryColor).toBe('#2A7A6E');
  });

  it('PATCH /internal/system/branding/update', async () => {
    const res = await request(app.getHttpServer())
      .patch('/internal/system/branding/update')
      .send({ primaryColor: '#111111' })
      .expect(200);
    expect(res.body.primaryColor).toBe('#111111');
    expect(service.update).toHaveBeenCalledWith({ primaryColor: '#111111' });
  });

  it('POST /internal/system/branding/reset', async () => {
    await request(app.getHttpServer())
      .post('/internal/system/branding/reset')
      .send({})
      .expect(200);
    expect(service.reset).toHaveBeenCalled();
  });
});
