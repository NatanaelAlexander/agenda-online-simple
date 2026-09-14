-- Precio de servicio opcional (null = sin precio publicado)
ALTER TABLE services
  ALTER COLUMN price_cents DROP DEFAULT;

ALTER TABLE services
  ALTER COLUMN price_cents DROP NOT NULL;

COMMENT ON COLUMN services.price_cents IS
  'Precio en centavos CLP; NULL = servicio sin precio (opcional)';
