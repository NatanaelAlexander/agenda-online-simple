-- Feature: booking QR / afiche público por negocio
-- El link de reserva se deriva de slug → {SITE_URL}/r/{slug}
-- Estos campos personalizan el afiche imprimible (PNG/PDF).

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS qr_poster_headline VARCHAR(200),
  ADD COLUMN IF NOT EXISTS qr_poster_footer VARCHAR(300);

COMMENT ON COLUMN businesses.booking_enabled IS
  'Si es false, el portal no ofrece nuevas reservas para este negocio';
COMMENT ON COLUMN businesses.qr_poster_headline IS
  'Título opcional del afiche/PDF del código QR de reserva';
COMMENT ON COLUMN businesses.qr_poster_footer IS
  'Pie opcional del afiche/PDF del código QR de reserva';

-- Kind sugerido en businesses_assets si más adelante se guarda el artefacto en R2:
--   'booking_qr'     → PNG del QR
--   'booking_qr_pdf' → PDF del afiche
