export interface Asset {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedById: string | null;
  createdAt: Date;
}

export interface AssetSignedUrl {
  url: string;
  expiresInSeconds: number;
}

export interface BusinessLogoView {
  asset: Asset;
  url: string;
  expiresInSeconds: number;
}

export interface UploadAssetInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  uploadedById?: string | null;
  ownerType?: string;
  ownerId?: string;
}

export interface SystemAssetLink {
  kind: string;
  assetId: string;
}

export interface BusinessAssetLink {
  businessId: string;
  assetId: string;
  kind: string;
}

export interface ProfessionalAssetLink {
  professionalId: string;
  assetId: string;
  kind: string;
}

export interface ServiceAssetLink {
  serviceId: string;
  assetId: string;
  kind: string;
}
