export const SQL_FIND_USER_BY_EMAIL_AND_PASSWORD = `
  SELECT
    id,
    email,
    first_name AS "firstName",
    last_name AS "lastName",
    phone_number AS "phoneNumber",
    is_active AS "isActive",
    permissions_version AS "permissionsVersion"
  FROM users
  WHERE email = $1
    AND password = crypt($2, password)
`;

export const SQL_FIND_USER_BY_ID_ACTIVE = `
  SELECT
    id,
    email,
    first_name AS "firstName",
    last_name AS "lastName",
    phone_number AS "phoneNumber",
    is_active AS "isActive",
    permissions_version AS "permissionsVersion"
  FROM users
  WHERE id = $1
    AND is_active = TRUE
`;

export const SQL_UPDATE_USER_PROFILE = `
  UPDATE users
  SET
    first_name = $2,
    last_name = $3,
    phone_number = $4,
    updated_at = NOW()
  WHERE id = $1
    AND is_active = TRUE
  RETURNING
    id,
    email,
    first_name AS "firstName",
    last_name AS "lastName",
    phone_number AS "phoneNumber",
    is_active AS "isActive",
    permissions_version AS "permissionsVersion"
`;
