-- Data: usuarios seed (solo desarrollo)
-- Login: superadmin@agenda.local / superadmin  |  admin@agenda.local / admin

INSERT INTO users (email, password, first_name, last_name, is_active)
VALUES
  (
    'superadmin@agenda.local',
    crypt('superadmin', gen_salt('bf')),
    'Super',
    'Admin',
    TRUE
  ),
  (
    'admin@agenda.local',
    crypt('admin', gen_salt('bf')),
    'Admin',
    'Sistema',
    TRUE
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO users_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'super_admin'
WHERE u.email = 'superadmin@agenda.local'
ON CONFLICT DO NOTHING;

INSERT INTO users_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'admin'
WHERE u.email = 'admin@agenda.local'
ON CONFLICT DO NOTHING;
