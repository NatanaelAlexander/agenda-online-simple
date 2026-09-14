-- Feature: assets (R2 metadata)

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_by_id UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_assets (
  kind VARCHAR(50) PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON assets (uploaded_by_id);
