-- Feature: businesses

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  timezone VARCHAR(64) NOT NULL DEFAULT 'America/Santiago',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses_assets (
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL,
  PRIMARY KEY (business_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses (slug);
CREATE INDEX IF NOT EXISTS idx_businesses_assets_kind ON businesses_assets (business_id, kind);
