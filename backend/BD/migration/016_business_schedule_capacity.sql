-- Agenda del local (horarios generales + cupos por horario)

CREATE TABLE IF NOT EXISTS business_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_business_schedules_business
  ON business_schedules (business_id, weekday);

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS max_bookings_per_slot INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_max_bookings_per_slot_check'
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_max_bookings_per_slot_check
      CHECK (max_bookings_per_slot >= 1 AND max_bookings_per_slot <= 50);
  END IF;
END $$;

COMMENT ON COLUMN businesses.max_bookings_per_slot IS
  'Máximo de clientes que pueden agendar el mismo horario (p. ej. 2 = dos cupos a la misma hora)';

COMMENT ON TABLE business_schedules IS
  'Horario semanal del local (ya no por profesional)';

-- Copiar horarios de profesionales al local si el negocio aún no tiene agenda
INSERT INTO business_schedules (business_id, weekday, start_time, end_time)
SELECT DISTINCT ON (p.business_id, sch.weekday, sch.start_time, sch.end_time)
  p.business_id,
  sch.weekday,
  sch.start_time,
  sch.end_time
FROM professional_schedules sch
INNER JOIN professionals p ON p.id = sch.professional_id
WHERE NOT EXISTS (
  SELECT 1 FROM business_schedules bs WHERE bs.business_id = p.business_id
)
ORDER BY p.business_id, sch.weekday, sch.start_time, sch.end_time;
