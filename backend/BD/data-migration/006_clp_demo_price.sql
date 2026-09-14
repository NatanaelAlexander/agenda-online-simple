-- Ajuste precio demo a CLP realista (~$15.000)
UPDATE services s
SET price_cents = 1500000,
    updated_at = NOW()
FROM businesses b
WHERE s.business_id = b.id
  AND b.slug = 'barberia-demo'
  AND s.name = 'Corte clásico'
  AND s.price_cents < 100000;
