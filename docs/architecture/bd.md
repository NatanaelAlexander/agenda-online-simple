# Arquitectura BD — agenda-online-simple

Misma línea que **Team Prime Digital**: PostgreSQL + migraciones SQL versionadas, **sin ORM**. El runtime Nest usa `pg` con queries parametrizadas (`$1`, `$2`).

Código vivo en: `backend/BD/`.

---

## Estructura

```
backend/BD/
├── migration/              ← CREATE TABLE / ALTER (esquema)
├── data-migration/         ← INSERT (catálogos y seeds dev)
├── run-migrations.ts       ← (a crear, patrón TPD)
├── run-data-migrations.ts  ← (a crear, patrón TPD)
└── README.md               ← enlace a este doc / resumen
```

---

## 1. Migraciones de esquema (`migration/`)

Solo **tablas y relaciones**. Archivos numerados / ordenados alfabéticamente de forma estable.

Dominios previstos (alineados a [`../features.md`](../features.md)):

| Orden tentativo | Dominio | Contenido típico |
|-----------------|---------|------------------|
| 1 | users / auth | usuarios del negocio, roles básicos |
| 2 | businesses | negocio, branding, zona horaria |
| 3 | services | servicios, duración, precio, buffers |
| 4 | professionals | profesionales, horarios, excepciones |
| 5 | clients | fichas de clientes finales |
| 6 | appointments | citas, estados, vínculos |
| 7 | … | packs, recurrentes, depósitos (V2) |

El orden exacto se fija al escribir el primer `.sql`.

```bash
docker compose exec api pnpm run migrate
```

---

## 2. Data migrations (`data-migration/`)

**INSERT** iniciales. Idempotentes (`ON CONFLICT DO NOTHING`).

Ejemplos:

- Roles / permisos mínimos del panel
- Usuario admin de desarrollo
- Negocio + servicios demo (opcional)

```bash
docker compose exec api pnpm run migrate:data
```

Siempre: **esquema primero**, data después.

---

## Reglas

| Sí | No |
|----|----|
| SQL en archivos versionados | Cambiar esquema solo a mano en la BD |
| `$1`, `$2` en queries de Nest | Concatenar input del usuario en SQL |
| Idempotencia en seeds | Seeds que fallan al re-ejecutar |
| Nombres y comentarios claros | ORM / migrations mágicas de TypeORM/Prisma |

Credenciales solo desde `.env` (`POSTGRES_*`, `DATABASE_URL`).

---

## Requisitos

- Docker en marcha
- Servicios `bd_main` y `api` arriba
- `.env` en la raíz (`cp .env.example .env`)

## Reset completo (desarrollo)

```bash
docker compose down -v
docker compose up --build
# cuando existan scripts:
docker compose exec api pnpm run migrate
docker compose exec api pnpm run migrate:data
```

---

## Qué va en Git

- `migration/*.sql`, `data-migration/*.sql`
- Scripts `run-*.ts` y README de `backend/BD/`
- Este documento

## Qué NO va en Git

- Datos insertados a mano en dev
- Volumen `agenda_online_simple_pg_data`
- `.env` con secretos reales

---

## Pendiente (base)

- [ ] `run-migrations.ts` / `run-data-migrations.ts` (copiar patrón TPD)
- [ ] Scripts `migrate` / `migrate:data` en `backend/package.json`
- [ ] Primera migración de esquema (negocio + citas mínimo)
- [ ] Seed de desarrollo
