# agenda-online-simple

Agenda online sencilla. Stack alineado con Team Prime Digital:

| Capa | Tecnología |
|------|------------|
| Frontend | **Next.js** (App Router) |
| Backend | **NestJS** |
| DB | **PostgreSQL 16** |
| Proxy | **Traefik v3** |
| Runtime | **Docker Compose** + pnpm + Node 22 |

Nombre de marca: pendiente. Ver [`docs/features.md`](docs/features.md).

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
| http://localhost:3000/health | Health + Postgres |
| http://localhost:8080 | Traefik dashboard |
| localhost:5432 | PostgreSQL |

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
| Bajar | `docker compose down` |
| Reset BD | `docker compose down -v` |
