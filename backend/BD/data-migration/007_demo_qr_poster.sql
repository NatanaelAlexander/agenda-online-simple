-- Textos demo para afiche QR
UPDATE businesses
SET
  qr_poster_headline = COALESCE(qr_poster_headline, 'Agenda tu hora'),
  qr_poster_footer = COALESCE(
    qr_poster_footer,
    'Escanea el código y reserva en segundos'
  ),
  updated_at = NOW()
WHERE slug = 'barberia-demo';
