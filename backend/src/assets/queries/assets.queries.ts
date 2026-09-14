export const ASSET_COLUMNS = `
  id,
  file_name AS "fileName",
  file_path AS "filePath",
  mime_type AS "mimeType",
  file_size AS "fileSize",
  uploaded_by_id AS "uploadedById",
  created_at AS "createdAt"
`;

export const SQL_FIND_ASSET_BY_ID = `
  SELECT ${ASSET_COLUMNS}
  FROM assets
  WHERE id = $1
`;

export const SQL_INSERT_ASSET = `
  INSERT INTO assets (file_name, file_path, mime_type, file_size, uploaded_by_id)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING ${ASSET_COLUMNS}
`;

export const SQL_LINK_SYSTEM_ASSET = `
  INSERT INTO system_assets (kind, asset_id)
  VALUES ($1, $2)
  ON CONFLICT (kind) DO UPDATE SET asset_id = EXCLUDED.asset_id
  RETURNING kind, asset_id AS "assetId"
`;

export const SQL_LINK_BUSINESS_ASSET = `
  INSERT INTO businesses_assets (business_id, asset_id, kind)
  VALUES ($1, $2, $3)
  ON CONFLICT (business_id, asset_id) DO UPDATE SET kind = EXCLUDED.kind
  RETURNING business_id AS "businessId", asset_id AS "assetId", kind
`;

/** Kinds exclusivos (logo/cover): un solo asset por negocio. */
export const SQL_UNLINK_BUSINESS_ASSETS_BY_KIND = `
  DELETE FROM businesses_assets
  WHERE business_id = $1
    AND kind = $2
`;

export const SQL_FIND_BUSINESS_ASSET_BY_KIND = `
  SELECT ${ASSET_COLUMNS}
  FROM assets a
  INNER JOIN businesses_assets ba ON ba.asset_id = a.id
  WHERE ba.business_id = $1
    AND ba.kind = $2
  ORDER BY a.created_at DESC
  LIMIT 1
`;

export const SQL_LINK_PROFESSIONAL_ASSET = `
  INSERT INTO professionals_assets (professional_id, asset_id, kind)
  VALUES ($1, $2, $3)
  ON CONFLICT (professional_id, asset_id) DO UPDATE SET kind = EXCLUDED.kind
  RETURNING professional_id AS "professionalId", asset_id AS "assetId", kind
`;

export const SQL_LINK_SERVICE_ASSET = `
  INSERT INTO services_assets (service_id, asset_id, kind)
  VALUES ($1, $2, $3)
  ON CONFLICT (service_id, asset_id) DO UPDATE SET kind = EXCLUDED.kind
  RETURNING service_id AS "serviceId", asset_id AS "assetId", kind
`;
