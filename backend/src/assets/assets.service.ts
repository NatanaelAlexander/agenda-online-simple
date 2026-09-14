import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database/database.service.js';
import { R2StorageService } from '../common/storage/r2-storage.service.js';
import {
  ArchivoDemasiadoGrandeException,
  ArchivoRequeridoException,
  AssetNoEncontradoException,
  R2NoConfiguradoException,
  TipoArchivoNoPermitidoException,
} from './exceptions/assets.exceptions.js';
import {
  SQL_FIND_ASSET_BY_ID,
  SQL_FIND_BUSINESS_ASSET_BY_KIND,
  SQL_INSERT_ASSET,
  SQL_LINK_BUSINESS_ASSET,
  SQL_LINK_PROFESSIONAL_ASSET,
  SQL_LINK_SERVICE_ASSET,
  SQL_LINK_SYSTEM_ASSET,
  SQL_UNLINK_BUSINESS_ASSETS_BY_KIND,
} from './queries/assets.queries.js';
import type {
  Asset,
  AssetSignedUrl,
  BusinessAssetLink,
  BusinessLogoView,
  ProfessionalAssetLink,
  ServiceAssetLink,
  SystemAssetLink,
  UploadAssetInput,
} from './types/asset.types.js';

const SIGNED_URL_TTL_SECONDS = 300;
const LOGO_SIGNED_URL_TTL_SECONDS = 3600;
const MAX_LOGO_BYTES = 30 * 1024 * 1024;
const MAX_LOGO_MB = 30;

const ALLOWED_LOGO_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/** Kinds con un solo asset por negocio. */
const EXCLUSIVE_BUSINESS_KINDS = new Set(['logo', 'cover']);

@Injectable()
export class AssetsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly r2Storage: R2StorageService,
  ) {}

  async findById(id: string): Promise<Asset> {
    const { rows } = await this.db.query<Asset>(SQL_FIND_ASSET_BY_ID, [id]);
    if (!rows[0]) {
      throw new AssetNoEncontradoException();
    }
    return rows[0];
  }

  async upload(
    file: Express.Multer.File,
    uploadedById?: string | null,
  ): Promise<Asset> {
    if (!file?.buffer?.length) {
      throw new ArchivoRequeridoException();
    }
    this.ensureR2Ready();

    return this.uploadBuffer({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      uploadedById,
    });
  }

  async uploadBuffer(input: UploadAssetInput): Promise<Asset> {
    if (!input.buffer?.length) {
      throw new ArchivoRequeridoException();
    }
    this.ensureR2Ready();

    const uploaded = await this.r2Storage.upload({
      ownerType: input.ownerType ?? 'assets',
      ownerId: input.ownerId ?? randomUUID(),
      fileName: input.originalName,
      mimeType: input.mimeType || 'application/octet-stream',
      body: input.buffer,
    });

    const { rows } = await this.db.query<Asset>(SQL_INSERT_ASSET, [
      input.originalName,
      uploaded.key,
      uploaded.mimeType,
      uploaded.fileSize,
      input.uploadedById ?? null,
    ]);

    return rows[0];
  }

  async getSignedUrl(
    id: string,
    expiresInSeconds = SIGNED_URL_TTL_SECONDS,
  ): Promise<AssetSignedUrl> {
    const asset = await this.findById(id);
    this.ensureR2Ready();

    const url = await this.r2Storage.getSignedDownloadUrl(
      asset.filePath,
      expiresInSeconds,
    );

    return { url, expiresInSeconds };
  }

  async findBusinessAssetByKind(
    businessId: string,
    kind: string,
  ): Promise<Asset | null> {
    const { rows } = await this.db.query<Asset>(SQL_FIND_BUSINESS_ASSET_BY_KIND, [
      businessId,
      kind,
    ]);
    return rows[0] ?? null;
  }

  async getBusinessLogo(businessId: string): Promise<BusinessLogoView | null> {
    const asset = await this.findBusinessAssetByKind(businessId, 'logo');
    if (!asset) {
      return null;
    }
    if (!this.r2Storage.isConfigured()) {
      return null;
    }
    const url = await this.r2Storage.getSignedDownloadUrl(
      asset.filePath,
      LOGO_SIGNED_URL_TTL_SECONDS,
    );
    return {
      asset,
      url,
      expiresInSeconds: LOGO_SIGNED_URL_TTL_SECONDS,
    };
  }

  /**
   * Sube imagen (JPG/PNG/WEBP ≤30 MB), la vincula como logo del negocio
   * y reemplaza el logo anterior.
   */
  async setBusinessLogo(
    file: Express.Multer.File,
    businessId: string,
    uploadedById?: string | null,
  ): Promise<BusinessLogoView> {
    this.assertLogoFile(file);
    this.ensureR2Ready();

    const asset = await this.uploadBuffer({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedById,
      ownerType: 'businesses',
      ownerId: businessId,
    });

    await this.linkBusinessAsset(businessId, asset.id, 'logo');

    const url = await this.r2Storage.getSignedDownloadUrl(
      asset.filePath,
      LOGO_SIGNED_URL_TTL_SECONDS,
    );

    return {
      asset,
      url,
      expiresInSeconds: LOGO_SIGNED_URL_TTL_SECONDS,
    };
  }

  async linkSystemAsset(kind: string, assetId: string): Promise<SystemAssetLink> {
    await this.findById(assetId);
    const { rows } = await this.db.query<SystemAssetLink>(SQL_LINK_SYSTEM_ASSET, [
      kind,
      assetId,
    ]);
    return rows[0];
  }

  async linkBusinessAsset(
    businessId: string,
    assetId: string,
    kind: string,
  ): Promise<BusinessAssetLink> {
    await this.findById(assetId);

    if (EXCLUSIVE_BUSINESS_KINDS.has(kind)) {
      await this.db.query(SQL_UNLINK_BUSINESS_ASSETS_BY_KIND, [businessId, kind]);
    }

    const { rows } = await this.db.query<BusinessAssetLink>(
      SQL_LINK_BUSINESS_ASSET,
      [businessId, assetId, kind],
    );
    return rows[0];
  }

  async linkProfessionalAsset(
    professionalId: string,
    assetId: string,
    kind: string,
  ): Promise<ProfessionalAssetLink> {
    await this.findById(assetId);
    const { rows } = await this.db.query<ProfessionalAssetLink>(
      SQL_LINK_PROFESSIONAL_ASSET,
      [professionalId, assetId, kind],
    );
    return rows[0];
  }

  async linkServiceAsset(
    serviceId: string,
    assetId: string,
    kind: string,
  ): Promise<ServiceAssetLink> {
    await this.findById(assetId);
    const { rows } = await this.db.query<ServiceAssetLink>(
      SQL_LINK_SERVICE_ASSET,
      [serviceId, assetId, kind],
    );
    return rows[0];
  }

  private assertLogoFile(file: Express.Multer.File): void {
    if (!file?.buffer?.length) {
      throw new ArchivoRequeridoException();
    }
    if (file.size > MAX_LOGO_BYTES || file.buffer.byteLength > MAX_LOGO_BYTES) {
      throw new ArchivoDemasiadoGrandeException(MAX_LOGO_MB);
    }
    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_LOGO_MIME.has(mime)) {
      throw new TipoArchivoNoPermitidoException();
    }
  }

  private ensureR2Ready(): void {
    if (!this.r2Storage.isConfigured()) {
      throw new R2NoConfiguradoException();
    }
  }
}
