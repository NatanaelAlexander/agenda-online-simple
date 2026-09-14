export const AUDIT_LOG_COLUMNS = `
  id,
  user_id AS "userId",
  action,
  table_name AS "tableName",
  record_id AS "recordId",
  old_values AS "oldValues",
  new_values AS "newValues",
  ip_address AS "ipAddress",
  created_at AS "createdAt"
`;

export const SQL_INSERT_AUDIT_LOG = `
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address
  )
  VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::inet)
  RETURNING ${AUDIT_LOG_COLUMNS}
`;

export const SQL_FIND_AUDIT_LOG_BY_ID = `
  SELECT ${AUDIT_LOG_COLUMNS}
  FROM audit_logs
  WHERE id = $1
`;

export const SQL_FIND_ALL_AUDIT_LOGS_BASE = `
  SELECT ${AUDIT_LOG_COLUMNS}
  FROM audit_logs
`;

export const SQL_COUNT_AUDIT_LOGS_BASE = `
  SELECT COUNT(*)::int AS "total"
  FROM audit_logs
`;
