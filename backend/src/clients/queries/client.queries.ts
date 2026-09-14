export const CLIENT_COLUMNS = `
  id,
  business_id AS "businessId",
  full_name AS "fullName",
  phone,
  email,
  google_sub AS "googleSub",
  notes,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

/** Citas oficiales: excluye canceladas (el registro existe, no cuenta como visita). */
export const SQL_CLIENT_VISIT_COUNT = `
  (
    SELECT COUNT(*)::int
    FROM appointments a
    INNER JOIN appointment_statuses st ON st.id = a.status_id
    WHERE a.client_id = clients.id
      AND st.code <> 'cancelled'
  )
`;

export const SQL_FIND_CLIENT_BY_ID = `
  SELECT
    ${CLIENT_COLUMNS},
    ${SQL_CLIENT_VISIT_COUNT} AS "visitCount"
  FROM clients
  WHERE id = $1
`;

export const SQL_FIND_ALL_CLIENTS_BASE = `
  SELECT
    ${CLIENT_COLUMNS},
    ${SQL_CLIENT_VISIT_COUNT} AS "visitCount"
  FROM clients
`;

export const SQL_COUNT_CLIENTS_BASE = `
  SELECT COUNT(*)::int AS "total"
  FROM clients
`;

export const SQL_INSERT_CLIENT = `
  INSERT INTO clients (
    business_id, full_name, phone, email, google_sub, notes
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING ${CLIENT_COLUMNS}
`;

export const SQL_UPDATE_CLIENT = `
  UPDATE clients
  SET
    full_name = COALESCE($2, full_name),
    phone = COALESCE($3, phone),
    email = COALESCE($4, email),
    google_sub = COALESCE($5, google_sub),
    notes = COALESCE($6, notes),
    updated_at = NOW()
  WHERE id = $1
  RETURNING ${CLIENT_COLUMNS}
`;

export const SQL_DELETE_CLIENT = `
  DELETE FROM clients WHERE id = $1
  RETURNING id
`;

export const SQL_FIND_CLIENT_BY_GOOGLE_SUB = `
  SELECT ${CLIENT_COLUMNS}
  FROM clients
  WHERE business_id = $1 AND google_sub = $2
`;

export const SQL_FIND_CLIENT_BY_EMAIL = `
  SELECT ${CLIENT_COLUMNS}
  FROM clients
  WHERE business_id = $1 AND lower(email) = lower($2)
`;
