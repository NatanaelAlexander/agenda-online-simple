# agenda-online-simple

Agenda online sencilla. Stack alineado con Team Prime Digital:

| Capa | Tecnología |
|------|------------|
| Frontend | **Next.js** (App Router) |
| Backend | **NestJS** |
| DB | **PostgreSQL 16** |
| Proxy | **Traefik v3** |
| Runtime | **Docker Compose** + pnpm + Node 22 |

### Documentación

| Documento | Contenido |
|-----------|-----------|
| [`docs/features.md`](docs/features.md) | Producto y features |
| [`docs/architecture/flujos.md`](docs/architecture/flujos.md) | Flujos auth interno + reserva Google + cookies |
| [`docs/mer.md`](docs/mer.md) | MER (diagrama + auth/RBAC) |
| [`docs/architecture/back.md`](docs/architecture/back.md) | Arquitectura NestJS (igual TPD) |
| [`docs/architecture/deps.md`](docs/architecture/deps.md) | Librerías instaladas (JWT, sockets, R2, …) |
| [`docs/architecture/tests.md`](docs/architecture/tests.md) | Tests unit + API contrato + CI GitHub |
| [`docs/architecture/front.md`](docs/architecture/front.md) | Arquitectura Next.js (igual TPD) |
| [`docs/architecture/bd.md`](docs/architecture/bd.md) | Migraciones PostgreSQL (igual TPD) |
| [`backend/BD/README.md`](backend/BD/README.md) | Carpeta de migraciones |

---

## Levantar (desarrollo)

```bash
cp .env.example .env
docker compose up --build
```

| URL | Servicio |
|-----|----------|
| http://localhost:3001 | Frontend (directo) |
| http://agenda.localhost | Frontend vía Traefik |
| http://localhost:3000 | API (directo) |
| http://api.agenda.localhost | API vía Traefik |
| http://localhost:3000/ | Health root |
| http://localhost:3000/api/health | Health |
| http://localhost:3000/api/reference | Docs API (Scalar UI) |
| http://localhost:3000/api/docs/json | OpenAPI JSON |
| http://localhost:8080 | Traefik dashboard |
| localhost:5432 | PostgreSQL |

Tras levantar Postgres:

```bash
cd backend && pnpm migrate && pnpm migrate:data
```

Seeds: `superadmin@agenda.local` / `superadmin` · `admin@agenda.local` / `admin`

Auth panel: `POST /api/auth/login` · booking Google: `GET /api/auth/google`


---

## Estructura

```
agenda-online-simple/
├── docker-compose.yml
├── .env.example
├── docs/
├── backend/     ← NestJS
└── frontend/    ← Next.js
```

---

## Comandos

| Acción | Comando |
|--------|---------|
| Levantar | `docker compose up --build` |
| Logs API | `docker compose logs -f api` |
| Deps API | `docker compose exec api pnpm install` |
| Deps front | `docker compose exec frontend pnpm install` |
| Tests backend (unit + API) | `docker compose exec api pnpm test` o `./scripts/test-backend.sh` |
| Solo unit / solo API | `./scripts/test-backend.sh unit` · `./scripts/test-backend.sh api` |
| Migrar esquema | `cd backend && pnpm migrate` |
| Seeds (roles + users + demo) | `cd backend && pnpm migrate:data` |
| Docs API (Scalar) | http://localhost:3000/api/reference |
| Bajar | `docker compose down` |
| Reset BD | `docker compose down -v` |

### Emails (Resend)

Completa en `.env`:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@tudominio.cl
RESEND_FROM_NAME=Agenda online simple
APP_PUBLIC_URL=http://localhost:3001
```

Sin API key el servidor arranca igual; los envíos se omiten con warning en log.

