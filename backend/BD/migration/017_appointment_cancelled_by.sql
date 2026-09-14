-- Quién canceló/rechazó la cita (cliente vs local)

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_cancelled_by_check'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_cancelled_by_check
      CHECK (
        cancelled_by IS NULL
        OR cancelled_by IN ('client', 'staff')
      );
  END IF;
END $$;

COMMENT ON COLUMN appointments.cancelled_by IS
  'client = canceló el cliente; staff = el local rechazó o canceló';
