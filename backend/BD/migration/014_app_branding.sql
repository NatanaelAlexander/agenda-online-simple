-- Feature: app branding (installation-level colors + booking home layout)

CREATE TABLE IF NOT EXISTS app_branding (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  primary_color VARCHAR(64) NOT NULL DEFAULT '#2A7A6E',
  accent_color VARCHAR(64) NOT NULL DEFAULT '#D6EFE9',
  background_color VARCHAR(64) NOT NULL DEFAULT '#F9F7F0',
  foreground_color VARCHAR(64) NOT NULL DEFAULT '#2A3F44',
  booking_home_layout VARCHAR(64) NOT NULL DEFAULT 'classic',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_branding (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
