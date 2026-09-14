import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface Asset {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedById: string | null;
  createdAt: string;
}

export interface BusinessLogo {
  asset: Asset;
  url: string;
  expiresInSeconds: number;
}

export async function getBusinessLogo(
  businessId: string,
): Promise<BusinessLogo | null> {
  const res = await apiFetchDetalle<{ logo: BusinessLogo | null }>(
    "/internal/assets/business-logo",
    { businessId },
    true,
  );
  return res.logo;
}

export async function setBusinessLogo(
  businessId: string,
  file: File,
): Promise<BusinessLogo> {
  const body = new FormData();
  body.append("businessId", businessId);
  body.append("file", file);
  return apiFetch<BusinessLogo>(
    "/internal/assets/set-business-logo",
    { method: "POST", body },
    true,
  );
}
