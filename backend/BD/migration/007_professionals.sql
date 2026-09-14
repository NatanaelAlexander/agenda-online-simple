-- Feature: professionals + schedules + exceptions

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  display_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_services (
  professional_id UUID NOT NULL REFERENCES professionals (id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, service_id)
);

CREATE TABLE IF NOT EXISTS professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals (id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals (id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  CHECK (
    (is_closed = TRUE)
    OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

CREATE TABLE IF NOT EXISTS professionals_assets (
  professional_id UUID NOT NULL REFERENCES professionals (id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL,
  PRIMARY KEY (professional_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_professionals_business ON professionals (business_id);
CREATE INDEX IF NOT EXISTS idx_professional_schedules_pro ON professional_schedules (professional_id, weekday);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON schedule_exceptions (business_id, exception_date);
