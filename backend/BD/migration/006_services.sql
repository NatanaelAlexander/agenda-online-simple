-- Feature: services

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  prep_minutes INTEGER NOT NULL DEFAULT 0 CHECK (prep_minutes >= 0),
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  color VARCHAR(32),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services_assets (
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL,
  PRIMARY KEY (service_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_services_business_id ON services (business_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services (business_id, is_active);
