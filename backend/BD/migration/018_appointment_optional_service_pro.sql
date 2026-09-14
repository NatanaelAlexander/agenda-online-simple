-- Permitir citas sin servicio o profesional definido ("No estoy seguro")

ALTER TABLE appointments
  ALTER COLUMN service_id DROP NOT NULL,
  ALTER COLUMN professional_id DROP NOT NULL;
