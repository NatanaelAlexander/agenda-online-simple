-- Data: servicio + profesional demo (horario Lun–Vie 09:00–18:00)

WITH biz AS (
  SELECT id FROM businesses WHERE slug = 'barberia-demo' LIMIT 1
),
svc AS (
  INSERT INTO services (
    business_id, name, description, duration_minutes, prep_minutes, buffer_minutes, price_cents, color, is_active
  )
  SELECT
    biz.id,
    'Corte clásico',
    'Corte de cabello estándar',
    30,
    0,
    10,
    1500000,
    '#2563eb',
    TRUE
  FROM biz
  WHERE NOT EXISTS (
    SELECT 1 FROM services s
    JOIN businesses b ON b.id = s.business_id
    WHERE b.slug = 'barberia-demo' AND s.name = 'Corte clásico'
  )
  RETURNING id, business_id
),
pro AS (
  INSERT INTO professionals (business_id, display_name, email, phone, is_active)
  SELECT biz.id, 'Barbero Demo', 'barbero@barberia-demo.cl', '+56987654321', TRUE
  FROM biz
  WHERE NOT EXISTS (
    SELECT 1 FROM professionals p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.slug = 'barberia-demo' AND p.display_name = 'Barbero Demo'
  )
  RETURNING id, business_id
)
INSERT INTO professional_services (professional_id, service_id)
SELECT pro.id, COALESCE(svc.id, s.id)
FROM pro
CROSS JOIN biz
LEFT JOIN svc ON TRUE
LEFT JOIN services s ON s.business_id = biz.id AND s.name = 'Corte clásico'
WHERE NOT EXISTS (
  SELECT 1 FROM professional_services ps
  WHERE ps.professional_id = pro.id
    AND ps.service_id = COALESCE(svc.id, s.id)
);

INSERT INTO professional_schedules (professional_id, weekday, start_time, end_time)
SELECT p.id, d.weekday, TIME '09:00', TIME '18:00'
FROM professionals p
JOIN businesses b ON b.id = p.business_id
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(weekday)
WHERE b.slug = 'barberia-demo'
  AND p.display_name = 'Barbero Demo'
  AND NOT EXISTS (
    SELECT 1 FROM professional_schedules ps
    WHERE ps.professional_id = p.id AND ps.weekday = d.weekday
  );
