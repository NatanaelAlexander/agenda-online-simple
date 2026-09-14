-- Data: roles super_admin + admin

INSERT INTO roles (name) VALUES
  ('super_admin'),
  ('admin')
ON CONFLICT (name) DO NOTHING;

-- super_admin → TODO (incluye audit_logs y users/roles)
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin → features de negocio; sin audit, users, roles, permissions, system
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.name = 'admin'
  AND p.name NOT LIKE 'audit_logs:%'
  AND p.name != 'system:manage'
  AND p.name NOT LIKE 'roles:%'
  AND p.name NOT LIKE 'permissions:%'
  AND p.name NOT LIKE 'users:%'
ON CONFLICT DO NOTHING;
