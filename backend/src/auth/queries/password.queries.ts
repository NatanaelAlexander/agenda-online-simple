export const SQL_FIND_USER_ID_BY_EMAIL = `
  SELECT id, email, first_name AS "firstName"
  FROM users
  WHERE email = $1
    AND is_active = TRUE
`;

export const SQL_UPSERT_PASSWORD_RESET_CODE = `
  INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
  VALUES ($1, $2, $3)
`;

export const SQL_FIND_VALID_PASSWORD_RESET = `
  SELECT id, user_id AS "userId", code_hash AS "codeHash", expires_at AS "expiresAt"
  FROM password_reset_codes
  WHERE user_id = $1
    AND used_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1
`;

export const SQL_MARK_PASSWORD_RESET_USED = `
  UPDATE password_reset_codes
  SET used_at = NOW()
  WHERE id = $1
`;

export const SQL_UPDATE_PASSWORD = `
  UPDATE users
  SET password = crypt($2, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = $1
`;

export const SQL_VERIFY_PASSWORD = `
  SELECT id
  FROM users
  WHERE id = $1
    AND password = crypt($2, password)
    AND is_active = TRUE
`;
