export const BRANDING_COLUMNS = `
  id,
  theme_id AS "themeId",
  primary_color AS "primaryColor",
  accent_color AS "accentColor",
  background_color AS "backgroundColor",
  foreground_color AS "foregroundColor",
  booking_home_layout AS "bookingHomeLayout",
  updated_at AS "updatedAt"
`;

export const SQL_GET_APP_BRANDING = `
  SELECT ${BRANDING_COLUMNS}
  FROM app_branding
  WHERE id = 1
`;

export const SQL_UPSERT_APP_BRANDING = `
  INSERT INTO app_branding (
    id,
    theme_id,
    primary_color,
    accent_color,
    background_color,
    foreground_color,
    booking_home_layout,
    updated_at
  )
  VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
  ON CONFLICT (id) DO UPDATE SET
    theme_id = EXCLUDED.theme_id,
    primary_color = EXCLUDED.primary_color,
    accent_color = EXCLUDED.accent_color,
    background_color = EXCLUDED.background_color,
    foreground_color = EXCLUDED.foreground_color,
    booking_home_layout = EXCLUDED.booking_home_layout,
    updated_at = NOW()
  RETURNING ${BRANDING_COLUMNS}
`;
