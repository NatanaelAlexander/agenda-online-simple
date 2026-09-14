/**
 * Contrato HTTP assets (sin R2) — AssetsService mockeado.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app.js';
import { InternalAssetsController } from '../../assets.controller.js';
import { AssetsService } from '../../assets.service.js';
import {
  AssetNoEncontradoException,
  R2NoConfiguradoException,
  TipoArchivoNoPermitidoException,
} from '../../exceptions/assets.exceptions.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const ASSET_ID = '660e8400-e29b-41d4-a716-446655440000';

const sampleLogo = {
  asset: {
    id: ASSET_ID,
    fileName: 'logo.png',
    filePath: 'businesses/x/logo.png',
    mimeType: 'image/png',
    fileSize: 1200,
    uploadedById: TEST_USER_ID,
    createdAt: new Date().toISOString(),
  },
  url: 'https://example.test/logo.png',
  expiresInSeconds: 3600,
};

describe('Assets API contract', () => {
  let app: INestApplication<App>;
  let assetsService: {
    upload: ReturnType<typeof vi.fn>;
    getSignedUrl: ReturnType<typeof vi.fn>;
    setBusinessLogo: ReturnType<typeof vi.fn>;
    getBusinessLogo: ReturnType<typeof vi.fn>;
    linkSystemAsset: ReturnType<typeof vi.fn>;
    linkBusinessAsset: ReturnType<typeof vi.fn>;
    linkProfessionalAsset: ReturnType<typeof vi.fn>;
    linkServiceAsset: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    assetsService = {
      upload: vi.fn().mockResolvedValue({ id: ASSET_ID }),
      getSignedUrl: vi
        .fn()
        .mockResolvedValue({ url: 'https://example.test/f', expiresInSeconds: 300 }),
      setBusinessLogo: vi.fn().mockResolvedValue(sampleLogo),
      getBusinessLogo: vi.fn().mockResolvedValue(sampleLogo),
      linkSystemAsset: vi.fn().mockResolvedValue({ kind: 'logo', assetId: ASSET_ID }),
      linkBusinessAsset: vi
        .fn()
        .mockResolvedValue({ businessId: UUID, assetId: ASSET_ID, kind: 'logo' }),
      linkProfessionalAsset: vi
        .fn()
        .mockResolvedValue({ professionalId: UUID, assetId: ASSET_ID, kind: 'avatar' }),
      linkServiceAsset: vi
        .fn()
        .mockResolvedValue({ serviceId: UUID, assetId: ASSET_ID, kind: 'image' }),
    };

    app = await createApiTestApp({
      controllers: [InternalAssetsController],
      providers: [{ provide: AssetsService, useValue: assetsService }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /internal/assets/subir', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/subir')
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);
    expect(assetsService.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
      }),
      TEST_USER_ID,
    );
  });

  it('POST /internal/assets/set-business-logo', async () => {
    const res = await request(app.getHttpServer())
      .post('/internal/assets/set-business-logo')
      .field('businessId', UUID)
      .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'logo.png')
      .expect(200);
    expect(res.body.url).toBe(sampleLogo.url);
    expect(assetsService.setBusinessLogo).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: 'logo.png' }),
      UUID,
      TEST_USER_ID,
    );
  });

  it('POST /internal/assets/set-business-logo rechaza tipo inválido', async () => {
    assetsService.setBusinessLogo.mockRejectedValue(
      new TipoArchivoNoPermitidoException(),
    );
    await request(app.getHttpServer())
      .post('/internal/assets/set-business-logo')
      .field('businessId', UUID)
      .attach('file', Buffer.from('%PDF'), 'x.pdf')
      .expect(400);
  });

  it('POST /internal/assets/business-logo', async () => {
    const res = await request(app.getHttpServer())
      .post('/internal/assets/business-logo')
      .send({ businessId: UUID })
      .expect(200);
    expect(res.body.logo.url).toBe(sampleLogo.url);
    expect(assetsService.getBusinessLogo).toHaveBeenCalledWith(UUID);
  });

  it('POST /internal/assets/signed-url', async () => {
    const res = await request(app.getHttpServer())
      .post('/internal/assets/signed-url')
      .send({ id: ASSET_ID })
      .expect(200);
    expect(res.body.url).toBe('https://example.test/f');
    expect(assetsService.getSignedUrl).toHaveBeenCalledWith(ASSET_ID);
  });

  it('POST /internal/assets/signed-url 404', async () => {
    assetsService.getSignedUrl.mockRejectedValue(new AssetNoEncontradoException());
    await request(app.getHttpServer())
      .post('/internal/assets/signed-url')
      .send({ id: ASSET_ID })
      .expect(404);
  });

  it('POST /internal/assets/signed-url propaga R2 no configurado', async () => {
    assetsService.getSignedUrl.mockRejectedValue(new R2NoConfiguradoException());
    await request(app.getHttpServer())
      .post('/internal/assets/signed-url')
      .send({ id: ASSET_ID })
      .expect(503);
  });

  it('POST /internal/assets/link-system', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/link-system')
      .send({ kind: 'logo', assetId: ASSET_ID })
      .expect(200);
    expect(assetsService.linkSystemAsset).toHaveBeenCalledWith('logo', ASSET_ID);
  });

  it('POST /internal/assets/link-business', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/link-business')
      .send({ businessId: UUID, assetId: ASSET_ID, kind: 'cover' })
      .expect(200);
    expect(assetsService.linkBusinessAsset).toHaveBeenCalledWith(
      UUID,
      ASSET_ID,
      'cover',
    );
  });

  it('POST /internal/assets/link-professional', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/link-professional')
      .send({ professionalId: UUID, assetId: ASSET_ID, kind: 'avatar' })
      .expect(200);
    expect(assetsService.linkProfessionalAsset).toHaveBeenCalledWith(
      UUID,
      ASSET_ID,
      'avatar',
    );
  });

  it('POST /internal/assets/link-service', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/link-service')
      .send({ serviceId: UUID, assetId: ASSET_ID, kind: 'image' })
      .expect(200);
    expect(assetsService.linkServiceAsset).toHaveBeenCalledWith(
      UUID,
      ASSET_ID,
      'image',
    );
  });

  it('POST /internal/assets/link-system rechaza body inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/link-system')
      .send({ kind: 'logo', assetId: 'bad' })
      .expect(400);
    expect(assetsService.linkSystemAsset).not.toHaveBeenCalled();
  });
});
