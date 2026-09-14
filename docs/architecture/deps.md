# Dependencias instaladas (V1 stack)

Alineado a los `.md` de arquitectura + patrón Team Prime Digital.  
Tras `pnpm add`, reconstruir contenedores: `docker compose up --build`.

---

## Backend (`backend/`)

| Lib | Para qué (docs) |
|-----|-----------------|
| `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` + `passport-local` | Auth panel email/password + JWT |
| `passport-google-oauth20` | Google OAuth **solo** al agendar (cliente) |
| `bcrypt` | Hash de passwords internos |
| `class-validator` + `class-transformer` | DTOs / ValidationPipe |
| `@nestjs/throttler` | Rate limit APIs públicas |
| `@nestjs/schedule` | Cron (recordatorios 24h, limpiezas) |
| `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` | Tiempo real (agenda / slots) |
| `redis` + `@socket.io/redis-adapter` | Sync Socket.IO entre réplicas |
| `@nestjs/swagger` + `@scalar/nestjs-api-reference` | `/api/reference` |
| `helmet` + `cookie-parser` | Hardening HTTP + cookies |
| `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | Cloudflare R2 (assets) |
| `multer` | Uploads |
| `pg` | Postgres (ya estaba) |
| Resend (HTTP `fetch` a `api.resend.com`) | Emails: confirmación, cancelación, reset, recordatorios |

Env relacionados: `JWT_*`, `GOOGLE_*`, `R2_*`, `REDIS_URL`, `THROTTLE_*`, `TRUST_PROXY`, `RESEND_*`, `APP_PUBLIC_URL`.

---

## Frontend (`frontend/`)

| Lib | Para qué (docs) |
|-----|-----------------|
| `socket.io-client` | Tiempo real (slots / citas) |
| `jose` | Leer/validar claims JWT en el panel |
| `js-cookie` | Cookie de reserva del cliente + tokens panel |
| `zod` + `react-hook-form` + `@hookform/resolvers` | Formularios tipados |
| `sonner` | Toasts |
| shadcn / lucide / tailwind | UI (ya estaban) |

---

## Infra Docker

- `redis:7-alpine` en `docker-compose.yml` (dependencia de `api`).
- Rebuild tras instalar deps (volúmenes anónimos de `node_modules`).
