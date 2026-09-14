-- Duración de servicio opcional (null = no publicada; slots usan default 30 min)
ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_duration_minutes_check;

ALTER TABLE services
  ALTER COLUMN duration_minutes DROP NOT NULL;

ALTER TABLE services
  ADD CONSTRAINT services_duration_minutes_check
  CHECK (duration_minutes IS NULL OR duration_minutes > 0);

COMMENT ON COLUMN services.duration_minutes IS
  'Duración en minutos; NULL = no informada (opcional). Al agendar se usa 30 min por defecto.';
