export const BUSINESS_COLUMNS = `
  id,
  name,
  slug,
  description,
  phone,
  email,
  address,
  timezone,
  social_links AS "socialLinks",
  booking_enabled AS "bookingEnabled",
  qr_poster_headline AS "qrPosterHeadline",
  qr_poster_footer AS "qrPosterFooter",
  max_bookings_per_slot AS "maxBookingsPerSlot",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SQL_FIND_BUSINESS_BY_ID = `
  SELECT ${BUSINESS_COLUMNS}
  FROM businesses
  WHERE id = $1
`;

export const SQL_FIND_BUSINESS_BY_SLUG = `
  SELECT ${BUSINESS_COLUMNS}
  FROM businesses
  WHERE slug = $1
`;

export const SQL_FIND_ALL_BUSINESSES_BASE = `
  SELECT ${BUSINESS_COLUMNS}
  FROM businesses
`;

export const SQL_COUNT_BUSINESSES_BASE = `
  SELECT COUNT(*)::int AS "total"
  FROM businesses
`;

export const SQL_INSERT_BUSINESS = `
  INSERT INTO businesses (
    name,
    slug,
    description,
    phone,
    email,
    address,
    timezone,
    social_links,
    booking_enabled,
    qr_poster_headline,
    qr_poster_footer,
    max_bookings_per_slot
  )
  VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8::jsonb,
    COALESCE($9, TRUE),
    $10,
    $11,
    COALESCE($12, 1)
  )
  RETURNING ${BUSINESS_COLUMNS}
`;

export const SQL_UPDATE_BUSINESS = `
  UPDATE businesses
  SET
    name = COALESCE($2, name),
    slug = COALESCE($3, slug),
    description = COALESCE($4, description),
    phone = COALESCE($5, phone),
    email = COALESCE($6, email),
    address = COALESCE($7, address),
    timezone = COALESCE($8, timezone),
    social_links = COALESCE($9::jsonb, social_links),
    booking_enabled = COALESCE($10, booking_enabled),
    qr_poster_headline = COALESCE($11, qr_poster_headline),
    qr_poster_footer = COALESCE($12, qr_poster_footer),
    max_bookings_per_slot = COALESCE($13, max_bookings_per_slot),
    updated_at = NOW()
  WHERE id = $1
  RETURNING ${BUSINESS_COLUMNS}
`;

export const SQL_PUBLIC_SERVICES_BY_BUSINESS = `
  SELECT
    id,
    name,
    description,
    duration_minutes AS "durationMinutes",
    price_cents AS "priceCents",
    color
  FROM services
  WHERE business_id = $1
    AND is_active = TRUE
  ORDER BY name ASC
`;

export const SQL_PUBLIC_PROFESSIONALS_BY_BUSINESS = `
  SELECT
    p.id,
    p.display_name AS "displayName",
    COALESCE(
      array_agg(DISTINCT ps.service_id::text) FILTER (WHERE ps.service_id IS NOT NULL),
      '{}'
    ) AS "serviceIds"
  FROM professionals p
  LEFT JOIN professional_services ps ON ps.professional_id = p.id
  WHERE p.business_id = $1
    AND p.is_active = TRUE
  GROUP BY p.id, p.display_name
  ORDER BY p.display_name ASC
`;

export const SQL_PUBLIC_SCHEDULES_BY_BUSINESS = `
  SELECT
    weekday,
    to_char(start_time, 'HH24:MI') AS "startTime",
    to_char(end_time, 'HH24:MI') AS "endTime"
  FROM business_schedules
  WHERE business_id = $1
  ORDER BY weekday, start_time
`;

export const SQL_LIST_BUSINESS_SCHEDULES = `
  SELECT
    id,
    business_id AS "businessId",
    weekday,
    to_char(start_time, 'HH24:MI') AS "startTime",
    to_char(end_time, 'HH24:MI') AS "endTime"
  FROM business_schedules
  WHERE business_id = $1
  ORDER BY weekday, start_time
`;

export const SQL_DELETE_BUSINESS_SCHEDULES = `
  DELETE FROM business_schedules
  WHERE business_id = $1
`;

export const SQL_INSERT_BUSINESS_SCHEDULE = `
  INSERT INTO business_schedules (business_id, weekday, start_time, end_time)
  VALUES ($1, $2, $3::time, $4::time)
  RETURNING
    id,
    business_id AS "businessId",
    weekday,
    to_char(start_time, 'HH24:MI') AS "startTime",
    to_char(end_time, 'HH24:MI') AS "endTime"
`;

export const SQL_PUBLIC_EXCEPTIONS_BY_BUSINESS = `
  SELECT
    to_char(exception_date, 'YYYY-MM-DD') AS "exceptionDate",
    is_closed AS "isClosed",
    professional_id AS "professionalId",
    reason
  FROM schedule_exceptions
  WHERE business_id = $1
    AND exception_date >= (CURRENT_DATE - INTERVAL '1 day')
  ORDER BY exception_date ASC
`;
