export const SQL_USER_COLUMNS = `
  u.id,
  u.email,
  u.first_name AS "firstName",
  u.last_name AS "lastName",
  u.phone_number AS "phoneNumber",
  u.is_active AS "isActive",
  u.created_at AS "createdAt",
  u.updated_at AS "updatedAt"
`;

export const SQL_FIND_ROLE_BY_NAME = `
  SELECT id, name
  FROM roles
  WHERE name = $1
  LIMIT 1
`;

export const SQL_INSERT_USER = `
  INSERT INTO users (
    email,
    password,
    first_name,
    last_name,
    phone_number
  )
  VALUES (
    $1,
    crypt($2, gen_salt('bf')),
    $3,
    $4,
    $5
  )
  RETURNING
    id,
    email,
    first_name AS "firstName",
    last_name AS "lastName",
    phone_number AS "phoneNumber",
    is_active AS "isActive",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

export const SQL_ASSIGN_USER_ROLE = `
  INSERT INTO users_roles (user_id, role_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

export const SQL_FIND_USER_BY_ID = `
  SELECT
    ${SQL_USER_COLUMNS},
    COALESCE(
      array_agg(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL),
      '{}'::text[]
    ) AS roles
  FROM users u
  LEFT JOIN users_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id
  WHERE u.id = $1
  GROUP BY u.id
`;

export const SQL_COUNT_USERS = `
  SELECT COUNT(*)::int AS total
  FROM users u
`;

export const SQL_FIND_USERS = `
  SELECT
    ${SQL_USER_COLUMNS},
    COALESCE(
      array_agg(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL),
      '{}'::text[]
    ) AS roles
  FROM users u
  LEFT JOIN users_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id
  GROUP BY u.id
  ORDER BY u.created_at DESC
  LIMIT $1 OFFSET $2
`;
