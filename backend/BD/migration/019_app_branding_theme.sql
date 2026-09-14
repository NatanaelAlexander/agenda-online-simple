-- Feature: branding theme presets (default + tweakcn light themes)

ALTER TABLE app_branding
  ADD COLUMN IF NOT EXISTS theme_id VARCHAR(64) NOT NULL DEFAULT 'default';

UPDATE app_branding
SET theme_id = 'default'
WHERE theme_id IS NULL OR theme_id = '';
