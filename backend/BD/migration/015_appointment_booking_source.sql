-- Feature: origen de la cita (portal público vs panel interno)

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS booking_source VARCHAR(20) NOT NULL DEFAULT 'portal';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_booking_source_check'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_booking_source_check
      CHECK (booking_source IN ('portal', 'internal'));
  END IF;
END $$;

COMMENT ON COLUMN appointments.booking_source IS
  'portal = reserva desde la web pública; internal = agendada en el panel';

CREATE INDEX IF NOT EXISTS idx_appointments_booking_source
  ON appointments (business_id, booking_source);
