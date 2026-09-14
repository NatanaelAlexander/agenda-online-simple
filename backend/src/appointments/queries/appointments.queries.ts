export const APPOINTMENT_DETAIL_COLUMNS = `
  a.id,
  a.business_id AS "businessId",
  a.service_id AS "serviceId",
  a.professional_id AS "professionalId",
  a.client_id AS "clientId",
  a.status_id AS "statusId",
  a.starts_at AS "startsAt",
  a.ends_at AS "endsAt",
  a.cancel_token AS "cancelToken",
  a.reminder_sent_at AS "reminderSentAt",
  a.notes,
  a.booking_source AS "bookingSource",
  a.cancelled_by AS "cancelledBy",
  a.created_at AS "createdAt",
  a.updated_at AS "updatedAt",
  st.code AS "statusCode",
  st.name AS "statusName",
  b.name AS "businessName",
  b.slug AS "businessSlug",
  b.timezone,
  s.name AS "serviceName",
  s.duration_minutes AS "durationMinutes",
  COALESCE(s.prep_minutes, 0) AS "prepMinutes",
  COALESCE(s.buffer_minutes, 0) AS "bufferMinutes",
  p.display_name AS "professionalName",
  c.full_name AS "clientName",
  c.email AS "clientEmail",
  c.phone AS "clientPhone"
`;

export const SQL_APPOINTMENT_JOINS = `
  FROM appointments a
  INNER JOIN appointment_statuses st ON st.id = a.status_id
  INNER JOIN businesses b ON b.id = a.business_id
  LEFT JOIN services s ON s.id = a.service_id
  LEFT JOIN professionals p ON p.id = a.professional_id
  INNER JOIN clients c ON c.id = a.client_id
`;

export const SQL_FIND_APPOINTMENT_BY_ID = `
  SELECT ${APPOINTMENT_DETAIL_COLUMNS}
  ${SQL_APPOINTMENT_JOINS}
  WHERE a.id = $1
`;

export const SQL_FIND_APPOINTMENT_BY_CANCEL_TOKEN = `
  SELECT ${APPOINTMENT_DETAIL_COLUMNS}
  ${SQL_APPOINTMENT_JOINS}
  WHERE a.cancel_token = $1
`;

export const SQL_FIND_APPOINTMENTS_BY_CANCEL_TOKENS = `
  SELECT ${APPOINTMENT_DETAIL_COLUMNS}
  ${SQL_APPOINTMENT_JOINS}
  WHERE a.cancel_token = ANY($1::text[])
    AND ($2::text IS NULL OR b.slug = $2)
  ORDER BY a.starts_at ASC
`;

export const SQL_FIND_ALL_APPOINTMENTS_BASE = `
  SELECT ${APPOINTMENT_DETAIL_COLUMNS}
  ${SQL_APPOINTMENT_JOINS}
`;

export const SQL_COUNT_APPOINTMENTS_BASE = `
  SELECT COUNT(*)::int AS "total"
  ${SQL_APPOINTMENT_JOINS}
`;

export const SQL_FIND_STATUS_BY_CODE = `
  SELECT id, code, name
  FROM appointment_statuses
  WHERE code = $1
`;

export const SQL_FIND_SERVICE_TIMING = `
  SELECT
    id,
    business_id AS "businessId",
    name,
    duration_minutes AS "durationMinutes",
    prep_minutes AS "prepMinutes",
    buffer_minutes AS "bufferMinutes",
    is_active AS "isActive"
  FROM services
  WHERE id = $1
`;

export const SQL_FIND_BUSINESS_BY_SLUG = `
  SELECT
    id,
    name,
    slug,
    timezone,
    booking_enabled AS "bookingEnabled",
    max_bookings_per_slot AS "maxBookingsPerSlot"
  FROM businesses
  WHERE slug = $1
`;

export const SQL_FIND_BUSINESS_BY_ID = `
  SELECT
    id,
    name,
    slug,
    timezone,
    booking_enabled AS "bookingEnabled",
    max_bookings_per_slot AS "maxBookingsPerSlot"
  FROM businesses
  WHERE id = $1
`;

export const SQL_FIND_PROFESSIONAL = `
  SELECT
    id,
    business_id AS "businessId",
    display_name AS "displayName",
    is_active AS "isActive"
  FROM professionals
  WHERE id = $1
`;

export const SQL_ASSERT_PROFESSIONAL_SERVICE = `
  SELECT 1 AS ok
  FROM professional_services
  WHERE professional_id = $1 AND service_id = $2
`;

export const SQL_FIND_CLIENT_BY_ID = `
  SELECT id, business_id AS "businessId", full_name AS "fullName", email, google_sub AS "googleSub"
  FROM clients
  WHERE id = $1
`;

export const SQL_FIND_CLIENT_BY_GOOGLE = `
  SELECT id, business_id AS "businessId", full_name AS "fullName", email, google_sub AS "googleSub"
  FROM clients
  WHERE business_id = $1 AND google_sub = $2
`;

export const SQL_FIND_CLIENT_BY_EMAIL = `
  SELECT id, business_id AS "businessId", full_name AS "fullName", email, google_sub AS "googleSub"
  FROM clients
  WHERE business_id = $1 AND lower(email) = lower($2)
`;

/** Busca por google_sub o email (prioridad google). */
export const SQL_FIND_CLIENT_FOR_UPSERT = `
  SELECT id, business_id AS "businessId", full_name AS "fullName", email, google_sub AS "googleSub"
  FROM clients
  WHERE business_id = $1
    AND (
      ($3::text IS NOT NULL AND google_sub = $3)
      OR ($2::text IS NOT NULL AND lower(email) = lower($2))
    )
  ORDER BY
    CASE
      WHEN $3::text IS NOT NULL AND google_sub = $3 THEN 0
      ELSE 1
    END
  LIMIT 1
`;

export const SQL_INSERT_CLIENT = `
  INSERT INTO clients (business_id, full_name, email, google_sub)
  VALUES ($1, $2, $3, $4)
  RETURNING id, business_id AS "businessId", full_name AS "fullName", email, google_sub AS "googleSub"
`;

export const SQL_UPDATE_CLIENT = `
  UPDATE clients
  SET
    full_name = $2,
    email = COALESCE($3, email),
    google_sub = COALESCE($4, google_sub),
    updated_at = NOW()
  WHERE id = $1
  RETURNING id, business_id AS "businessId", full_name AS "fullName", email, google_sub AS "googleSub"
`;
export const SQL_FIND_SCHEDULES = `
  SELECT
    weekday,
    to_char(start_time, 'HH24:MI:SS') AS "startTime",
    to_char(end_time, 'HH24:MI:SS') AS "endTime"
  FROM business_schedules
  WHERE business_id = $1
`;

export const SQL_FIND_PROFESSIONAL_SCHEDULES = `
  SELECT
    weekday,
    to_char(start_time, 'HH24:MI:SS') AS "startTime",
    to_char(end_time, 'HH24:MI:SS') AS "endTime"
  FROM professional_schedules
  WHERE professional_id = $1
`;

export const SQL_FIND_EXCEPTIONS = `
  SELECT
    to_char(exception_date, 'YYYY-MM-DD') AS "exceptionDate",
    is_closed AS "isClosed",
    CASE WHEN start_time IS NULL THEN NULL ELSE to_char(start_time, 'HH24:MI:SS') END AS "startTime",
    CASE WHEN end_time IS NULL THEN NULL ELSE to_char(end_time, 'HH24:MI:SS') END AS "endTime",
    professional_id AS "professionalId"
  FROM schedule_exceptions
  WHERE exception_date = $1::date
    AND business_id = $2
    AND (
      ($3::uuid IS NULL AND professional_id IS NULL)
      OR (
        $3::uuid IS NOT NULL
        AND (professional_id IS NULL OR professional_id = $3::uuid)
      )
    )
  ORDER BY CASE WHEN professional_id IS NULL THEN 1 ELSE 0 END
`;

export const SQL_FIND_BUSY_APPOINTMENTS = `
  SELECT
    a.starts_at AS "startsAt",
    a.ends_at AS "endsAt"
  FROM appointments a
  INNER JOIN appointment_statuses st ON st.id = a.status_id
  WHERE a.business_id = $1
    AND st.code IN ('pending', 'confirmed', 'attended')
    AND a.starts_at < $3::timestamptz
    AND a.ends_at > $2::timestamptz
    AND ($4::uuid IS NULL OR a.professional_id = $4::uuid)
`;

export const SQL_LOCK_OVERLAPPING_APPOINTMENTS = `
  SELECT a.id
  FROM appointments a
  INNER JOIN appointment_statuses st ON st.id = a.status_id
  WHERE a.business_id = $1
    AND st.code IN ('pending', 'confirmed', 'attended')
    AND a.starts_at < $3::timestamptz
    AND a.ends_at > $2::timestamptz
    AND ($4::uuid IS NULL OR a.id <> $4::uuid)
    AND ($5::uuid IS NULL OR a.professional_id = $5::uuid)
  FOR UPDATE OF a
`;

export const SQL_INSERT_APPOINTMENT = `
  INSERT INTO appointments (
    business_id,
    service_id,
    professional_id,
    client_id,
    status_id,
    starts_at,
    ends_at,
    cancel_token,
    notes,
    booking_source
  )
  VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, $8, $9, $10)
  RETURNING
    id,
    business_id AS "businessId",
    service_id AS "serviceId",
    professional_id AS "professionalId",
    client_id AS "clientId",
    status_id AS "statusId",
    starts_at AS "startsAt",
    ends_at AS "endsAt",
    cancel_token AS "cancelToken",
    reminder_sent_at AS "reminderSentAt",
    notes,
    booking_source AS "bookingSource",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

export const SQL_UPDATE_STATUS = `
  UPDATE appointments
  SET
    status_id = $2,
    cancelled_by = NULL,
    updated_at = NOW()
  WHERE id = $1
  RETURNING id
`;

export const SQL_UPDATE_STATUS_WITH_CANCELLED_BY = `
  UPDATE appointments
  SET
    status_id = $2,
    cancelled_by = $3,
    updated_at = NOW()
  WHERE id = $1
  RETURNING id
`;

export const SQL_UPDATE_SCHEDULE = `
  UPDATE appointments
  SET
    starts_at = $2::timestamptz,
    ends_at = $3::timestamptz,
    reminder_sent_at = NULL,
    updated_at = NOW()
  WHERE id = $1
  RETURNING id
`;

export const SQL_FIND_REMINDER_CANDIDATES = `
  SELECT ${APPOINTMENT_DETAIL_COLUMNS}
  ${SQL_APPOINTMENT_JOINS}
  WHERE st.code = 'confirmed'
    AND a.reminder_sent_at IS NULL
    AND a.starts_at >= NOW() + INTERVAL '23 hours'
    AND a.starts_at < NOW() + INTERVAL '25 hours'
`;

export const SQL_MARK_REMINDER_SENT = `
  UPDATE appointments
  SET reminder_sent_at = NOW(), updated_at = NOW()
  WHERE id = $1
`;
