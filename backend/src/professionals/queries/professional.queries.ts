export const PROFESSIONAL_COLUMNS = `
  id,
  business_id AS "businessId",
  user_id AS "userId",
  display_name AS "displayName",
  email,
  phone,
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SCHEDULE_COLUMNS = `
  id,
  professional_id AS "professionalId",
  weekday,
  start_time AS "startTime",
  end_time AS "endTime"
`;

export const EXCEPTION_COLUMNS = `
  id,
  business_id AS "businessId",
  professional_id AS "professionalId",
  to_char(exception_date, 'YYYY-MM-DD') AS "exceptionDate",
  is_closed AS "isClosed",
  CASE WHEN start_time IS NULL THEN NULL ELSE to_char(start_time, 'HH24:MI') END AS "startTime",
  CASE WHEN end_time IS NULL THEN NULL ELSE to_char(end_time, 'HH24:MI') END AS "endTime",
  reason
`;

export const SQL_FIND_PROFESSIONAL_BY_ID = `
  SELECT ${PROFESSIONAL_COLUMNS}
  FROM professionals
  WHERE id = $1
`;

export const SQL_FIND_ALL_PROFESSIONALS_BASE = `
  SELECT ${PROFESSIONAL_COLUMNS}
  FROM professionals
`;

export const SQL_COUNT_PROFESSIONALS_BASE = `
  SELECT COUNT(*)::int AS "total"
  FROM professionals
`;

export const SQL_INSERT_PROFESSIONAL = `
  INSERT INTO professionals (
    business_id,
    user_id,
    display_name,
    email,
    phone,
    is_active
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING ${PROFESSIONAL_COLUMNS}
`;

export const SQL_UPDATE_PROFESSIONAL = `
  UPDATE professionals
  SET
    display_name = COALESCE($2, display_name),
    email = COALESCE($3, email),
    phone = COALESCE($4, phone),
    user_id = COALESCE($5, user_id),
    is_active = COALESCE($6, is_active),
    updated_at = NOW()
  WHERE id = $1
  RETURNING ${PROFESSIONAL_COLUMNS}
`;

export const SQL_DEACTIVATE_PROFESSIONAL = `
  UPDATE professionals
  SET is_active = FALSE, updated_at = NOW()
  WHERE id = $1
  RETURNING ${PROFESSIONAL_COLUMNS}
`;

export const SQL_DELETE_PROFESSIONAL_SCHEDULES = `
  DELETE FROM professional_schedules
  WHERE professional_id = $1
`;

export const SQL_INSERT_PROFESSIONAL_SCHEDULE = `
  INSERT INTO professional_schedules (professional_id, weekday, start_time, end_time)
  VALUES ($1, $2, $3::time, $4::time)
  RETURNING ${SCHEDULE_COLUMNS}
`;

export const SQL_LIST_PROFESSIONAL_SCHEDULES = `
  SELECT ${SCHEDULE_COLUMNS}
  FROM professional_schedules
  WHERE professional_id = $1
  ORDER BY weekday, start_time
`;

export const SQL_DELETE_PROFESSIONAL_SERVICES = `
  DELETE FROM professional_services
  WHERE professional_id = $1
`;

export const SQL_INSERT_PROFESSIONAL_SERVICE = `
  INSERT INTO professional_services (professional_id, service_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

export const SQL_LIST_PROFESSIONAL_SERVICE_IDS = `
  SELECT service_id AS "serviceId"
  FROM professional_services
  WHERE professional_id = $1
  ORDER BY service_id
`;

export const SQL_FIND_ALL_EXCEPTIONS_BASE = `
  SELECT ${EXCEPTION_COLUMNS}
  FROM schedule_exceptions
`;

export const SQL_COUNT_EXCEPTIONS_BASE = `
  SELECT COUNT(*)::int AS "total"
  FROM schedule_exceptions
`;

export const SQL_INSERT_SCHEDULE_EXCEPTION = `
  INSERT INTO schedule_exceptions (
    business_id,
    professional_id,
    exception_date,
    is_closed,
    start_time,
    end_time,
    reason
  )
  VALUES ($1, $2, $3::date, $4, $5::time, $6::time, $7)
  RETURNING ${EXCEPTION_COLUMNS}
`;

export const SQL_DELETE_SCHEDULE_EXCEPTION = `
  DELETE FROM schedule_exceptions
  WHERE id = $1
  RETURNING ${EXCEPTION_COLUMNS}
`;
