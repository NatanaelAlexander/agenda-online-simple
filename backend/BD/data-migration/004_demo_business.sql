-- Data: appointment statuses + negocio demo

INSERT INTO appointment_statuses (code, name) VALUES
  ('pending', 'Pendiente'),
  ('confirmed', 'Confirmada'),
  ('attended', 'Atendida'),
  ('cancelled', 'Cancelada'),
  ('no_show', 'No show')
ON CONFLICT (code) DO NOTHING;

INSERT INTO businesses (name, slug, description, phone, email, address, timezone)
VALUES (
  'Barbería Demo',
  'barberia-demo',
  'Negocio de demostración para agenda-online-simple',
  '+56912345678',
  'hola@barberia-demo.cl',
  'Santiago, Chile',
  'America/Santiago'
)
ON CONFLICT (slug) DO NOTHING;
