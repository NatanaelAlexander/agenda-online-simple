-- Compat: layout "split" renombrado a "full"
UPDATE app_branding
SET booking_home_layout = 'full'
WHERE booking_home_layout = 'split';
