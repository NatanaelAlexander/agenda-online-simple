# Migraciones PostgreSQL

## Esquema

```bash
cd backend && pnpm migrate
```

Aplica `migration/*.sql` en orden.

## Seeds

```bash
cd backend && pnpm migrate:data
```

Aplica `data-migration/*.sql` (permissions, roles, users).

| Usuario | Password | Rol |
|---------|----------|-----|
| `superadmin@agenda.local` | `superadmin` | `super_admin` |
| `admin@agenda.local` | `admin` | `admin` |

Requiere Postgres arriba (`docker compose up bd_main -d`) y `DATABASE_URL` en `.env`.
