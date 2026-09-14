# Arquitectura backend — agenda-online-simple

Misma línea que **Team Prime Digital**: NestJS modular por dominio, sin ORM, SQL parametrizado con `pg`, errores en español.

---

## Enfoque

**Feature Modules** con dos superficies HTTP (igual que TPD):

| Superficie | Quién | Prefijo |
|------------|-------|---------|
| **internal** | Dueño / equipo del negocio | `/api/internal/*` |
| **portal / public** | Cliente final (reservar con Google, ver su cookie, cancelar) | `/api/portal/*` o `/api/public/*` |

Un feature = un módulo con controller, service, dto, queries y types. **Sin ORM. Sin capas extra.**

> Google OAuth es **solo** del flujo de reserva del cliente. Los internos usan email+password; no hay auto-registro. Ver [`flujos.md`](flujos.md).

---

## Flujo de una request

```
Cliente HTTP
    ↓
main.ts  →  ValidationPipe (DTO)  +  AppExceptionFilter
    ↓
XxxController  →  recibe DTO / params, delega
    ↓
XxxService  →  reglas de negocio + ejecuta queries (pg)
    ↓
PostgreSQL
```

El **controller no maneja errores**. El **service** lanza excepciones del dominio. Nest + el filter responden en español.

---

## Capas por feature

```
xxx.controller.ts   →  rutas HTTP (/internal/* y /portal/* en @Controller)
xxx.service.ts      →  lógica de negocio; llama queries con $1, $2…
queries/            →  SQL del dominio (nunca concatenar input del usuario)
types/              →  interfaces de filas / objetos internos
dto/                →  entrada API + class-validator (mensajes en español)
exceptions/         →  excepciones del dominio (extienden AppException)
xxx.module.ts       →  registra controller y service
```

Infra compartida: `common/database/DatabaseService` (pool `pg`). Archivos en **Cloudflare R2** vía `common/storage/R2StorageService` (mismo patrón TPD). Esquema en `backend/BD/migration/*.sql` (ver [`bd.md`](bd.md) y [`../mer.md`](../mer.md)).

### Assets y audit (infra transversal)

| Pieza | Rol |
|-------|-----|
| `assets` | Metadata; `file_path` = object key R2 |
| `system_assets` | Logo/favicon de **esta instalación** (`kind` PK → no va en el repo) |
| `*_assets` + `kind` | Puente por dominio (`logo`, `cover`, `gallery`, …) |
| `audit_logs` | `table_name` + `record_id` + JSONB; cualquier tabla |
| `.env` `R2_*` | Endpoint, keys, bucket privado |

Sin FK `logo_asset_id`. Sin URL pública permanente; descarga con URL firmada tras validar permisos.

### Qué va en cada capa

| Capa | Responsabilidad | No hace |
|------|-----------------|---------|
| **Controller** | Rutas, `@Body()` / `@Param()`, llamar al service | Reglas de negocio, SQL |
| **Service** | Validar reglas, ejecutar queries parametrizadas, excepciones | Conocer HTTP, armar SQL con strings del usuario |
| **queries/** | Sentencias SQL fijas con `$1`, `$2`… | Lógica de negocio |
| **types/** | Interfaces de filas/objetos | Validación HTTP |
| **DTO** | Validar forma del request | Lógica de negocio |
| **exceptions/** | Mensajes de error del dominio en español | — |

---

## Errores (español)

### Formato

```json
{
  "statusCode": 404,
  "mensaje": "Cita no encontrada"
}
```

Varios campos de validación:

```json
{
  "statusCode": 400,
  "mensaje": ["El nombre es obligatorio", "El teléfono es obligatorio"]
}
```

### Infra compartida (a crear como en TPD)

| Archivo | Rol |
|---------|-----|
| `common/exceptions/app.exception.ts` | Base `AppException` con `mensaje` |
| `common/filters/app-exception.filter.ts` | Filter global → `{ statusCode, mensaje }` |
| `common/pipes/validation.factory.ts` | ValidationPipe → errores DTO en español |

```typescript
export class CitaNoEncontradaException extends AppException {
  constructor() {
    super('Cita no encontrada', HttpStatus.NOT_FOUND);
  }
}

// en el service:
throw new CitaNoEncontradaException();
```

No usar strings sueltos con `NotFoundException` de Nest.

---

## Rutas y controllers

Internal y portal en el **mismo feature**, mismos archivos, `@Controller` distintos:

```typescript
@Controller('internal/appointments')
export class InternalAppointmentsController { ... }

@Controller('portal/appointments')
export class PortalAppointmentsController { ... }
```

No hay carpetas `internal/` ni `portal/` dentro del feature. Prefix global en `main.ts`: `api` → `/api/internal/...`.

### Convención GET (igual TPD)

Los **GET con filtros** no usan params en la URL. Van por **body**:

| Evitar | Usar |
|--------|------|
| `GET /internal/appointments/:id` | `GET /internal/appointments/detalle` + body `{ "id": "uuid" }` |

Listados sin filtros: `GET /internal/appointments` sin body.

`PATCH` / `DELETE` / `POST` puntuales pueden usar `:id` en URL.

### Clientes web (navegador)

Los navegadores **no permiten GET con body**. Equivalente web = **POST** con permiso de lectura:

| Lectura (Postman / curl) | Equivalente web |
|--------------------------|-----------------|
| `GET …/detalle` + body | `POST …/detalle` + body |
| `GET …` + body filtros | `POST …/listar` + body filtros |

---

## Documentación API (Swagger OpenAPI + Scalar)

Igual que Team Prime Digital:

| Qué | URL / paquete |
|-----|----------------|
| UI interactiva (Scalar) | `/api/reference` |
| Spec OpenAPI JSON | `/api/docs/json` |
| Generador | `@nestjs/swagger` (`DocumentBuilder` + decorators en controllers/DTOs) |
| UI | `@scalar/nestjs-api-reference` |

Activo en development por defecto. En production: off salvo `SWAGGER_ENABLED=true`.
Código: `common/swagger/setup-swagger.ts`.

---

## Árbol objetivo (`backend/src/`)

```
backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── database/          ← Pool pg (global)
│   ├── storage/           ← R2 (S3 API): upload + signed URL
│   ├── mail/              ← Resend (HTTP API; RESEND_*)
│   ├── exceptions/
│   ├── filters/
│   ├── pipes/
│   ├── swagger/           ← Scalar + OpenAPI JSON
│   ├── security/
│   └── redis/
├── auth/                  ← login + reset password + Google booking session
├── assets/                ← metadata + R2
├── audit/                 ← audit_logs
├── businesses/            ← negocio (+ portal by slug)
├── services/
├── professionals/         ← horarios + excepciones
├── clients/
├── availability/          ← motor de slots (sin tabla)
├── appointments/          ← internal + portal + reminder cron
├── professionals/         ← profesionales + horarios (`set-schedules`, `schedules/listar`, excepciones)
├── availability/          ← motor de slots (crítico)
├── appointments/          ← citas (internal + portal)
├── clients/               ← fichas de clientes
└── …
```

Contratos útiles:

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/api/internal/professionals/schedules/listar` | `{ professionalId }` |
| POST | `/api/internal/professionals/set-schedules` | Reemplaza semana completa |
| GET | `/api/portal/businesses/:slug/catalog` | Incluye `schedules[]` por profesional |
| POST | `/api/portal/appointments/slots` | Slots ISO UTC del día |

Los features concretos se irán cerrando con [`../features.md`](../features.md).

---

## Reglas entre módulos

- Un módulo **importa el service** de otro si necesita lógica; **nunca** su controller.
- Un **service por dominio**; métodos distintos si internal y portal se comportan distinto.
- **BD**: migraciones SQL en `backend/BD/`. Runtime con `pg` y `$1`, `$2`. **Sin ORM.**
- **Credenciales**: solo `.env` (`DATABASE_URL`, etc.). Sin hardcode.

---

## Tests y CI (solo backend)

Patrón **Team Prime Digital**. Detalle: [`tests.md`](tests.md).

| Tipo | ¿BD? | Qué |
|------|------|-----|
| **Unit** | No | `common/` (shared) + lógica de features con mocks |
| **API contrato** | **No** | Cada endpoint: controller real + service mock + Supertest. Status, DTO, body, flujos HTTP correctos |
| **Integration** | Sí | Opcional más adelante |

**CI:** GitHub Actions solo en **`push` a `main`** → unit + API contrato (sin Postgres).  
**Manual:** `docker compose exec api pnpm test` (o `./scripts/test-backend.sh`). Detalle: [`tests.md`](tests.md).

Estructura por feature: `backend/src/<feature>/tests/{unit,api}/`.

---

## Checklist — feature nuevo

1. Carpeta `backend/src/xxx/` con estructura estándar.
2. Alinear `queries/` con tablas de `backend/BD/migration/`.
3. `types/` con interfaces de filas SQL.
4. `dto/` con mensajes en español.
5. `exceptions/` extendiendo `AppException`.
6. Controllers `/internal/...` y `/portal/...` según corresponda.
7. Service: solo valores en `params` de `db.query()`; nunca interpolar input en SQL.
8. Registrar módulo en `app.module.ts`.
9. Tests: unit de lógica + **API contrato por endpoint** (`tests/api/`, sin BD).

---

## Pendiente (base)

- [ ] `common/database` (DatabaseModule / DatabaseService)
- [ ] `common/storage` R2 (`R2_*` en `.env`)
- [ ] `AppException` + filter + ValidationPipe en español
- [ ] Prefix `api` + CORS (ya parcial en `main.ts`)
- [ ] Auth interno: email+password + reset + JWT + `refresh_sessions` (sin signup público)
- [ ] Google OAuth **solo** en flujo de reserva + cookie resumen cliente
- [ ] Features `assets` + `audit`
- [ ] Primer feature de dominio (negocio / servicios / citas)
- [x] Scalar `/api/reference` + OpenAPI `/api/docs/json`
- [ ] Helper `create-api-test-app` + convención `tests/unit` + `tests/api`
- [x] Workflow GitHub Actions: **solo `push` a `main`** + script `./scripts/test-backend.sh`
