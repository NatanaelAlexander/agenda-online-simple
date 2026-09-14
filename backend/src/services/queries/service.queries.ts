export const SERVICE_COLUMNS = `
  id,
  business_id AS "businessId",
  name,
  description,
  duration_minutes AS "durationMinutes",
  prep_minutes AS "prepMinutes",
  buffer_minutes AS "bufferMinutes",
  price_cents AS "priceCents",
  color,
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SQL_FIND_SERVICE_BY_ID = `
  SELECT ${SERVICE_COLUMNS}
  FROM services
  WHERE id = $1
`;

export const SQL_FIND_ALL_SERVICES_BASE = `
  SELECT ${SERVICE_COLUMNS}
  FROM services
`;

export const SQL_COUNT_SERVICES_BASE = `
  SELECT COUNT(*)::int AS "total"
  FROM services
`;

export const SQL_INSERT_SERVICE = `
  INSERT INTO services (
    business_id,
    name,
    description,
    duration_minutes,
    prep_minutes,
    buffer_minutes,
    price_cents,
    color,
    is_active
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING ${SERVICE_COLUMNS}
`;

export const SQL_UPDATE_SERVICE = `
  UPDATE services
  SET
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    duration_minutes = CASE
      WHEN $11::boolean THEN $4::integer
      ELSE duration_minutes
    END,
    prep_minutes = COALESCE($5, prep_minutes),
    buffer_minutes = COALESCE($6, buffer_minutes),
    price_cents = CASE
      WHEN $10::boolean THEN $7::integer
      ELSE price_cents
    END,
    color = COALESCE($8, color),
    is_active = COALESCE($9, is_active),
    updated_at = NOW()
  WHERE id = $1
  RETURNING ${SERVICE_COLUMNS}
`;

export const SQL_DEACTIVATE_SERVICE = `
  UPDATE services
  SET is_active = FALSE, updated_at = NOW()
  WHERE id = $1
  RETURNING ${SERVICE_COLUMNS}
`;
