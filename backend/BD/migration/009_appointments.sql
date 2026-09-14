-- Feature: appointments

CREATE TABLE IF NOT EXISTS appointment_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals (id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  status_id UUID NOT NULL REFERENCES appointment_statuses (id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  cancel_token VARCHAR(64) NOT NULL UNIQUE,
  reminder_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_appointments_business_starts
  ON appointments (business_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_appointments_professional_starts
  ON appointments (professional_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_appointments_cancel_token
  ON appointments (cancel_token);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments (status_id);
