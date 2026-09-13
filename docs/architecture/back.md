# Arquitectura backend — agenda-online-simple

Misma línea que **Team Prime Digital**: NestJS modular por dominio, sin ORM, SQL parametrizado con `pg`, errores en español.

---

## Enfoque

**Feature Modules** con dos superficies HTTP (igual que TPD):

| Superficie | Quién | Prefijo |
|------------|-------|---------|
| **internal** | Dueño / equipo del negocio | `/api/internal/*` |
| **portal** | Cliente final (reservas, cancelar, reprogramar) | `/api/portal/*` |

Un feature = un módulo con controller, service, dto, queries y types. **Sin ORM. Sin capas extra.**

> Auth pública de reserva (sin cuenta) puede vivir en rutas portal o en un prefijo `/api/public/*` si hace falta; se definirá al implementar. El patrón de capas no cambia.

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

Infra compartida: `common/database/DatabaseService` (pool `pg`). Esquema en `backend/BD/migration/*.sql` (ver [`bd.md`](bd.md)).

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

## Documentación API (Scalar)

Igual que TPD cuando se active:

- UI: `/api/reference`
- OpenAPI JSON: `/api/docs/json`
- `@nestjs/swagger` + `@scalar/nestjs-api-reference`

---

## Árbol objetivo (`backend/src/`)

```
backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── database/          ← Pool pg (global)
│   ├── exceptions/
│   ├── filters/
│   ├── pipes/
│   ├── swagger/           ← Scalar (cuando se active)
│   ├── guards/            ← auth / permisos
│   └── decorators/
├── auth/                  ← login negocio (internal)
├── businesses/            ← negocio / sucursal
├── services/              ← servicios ofrecidos
├── professionals/         ← profesionales + horarios
├── availability/          ← motor de slots (crítico)
├── appointments/          ← citas
├── clients/               ← fichas de clientes
└── …
```

Los features concretos se irán cerrando con [`../features.md`](../features.md).

---

## Reglas entre módulos

- Un módulo **importa el service** de otro si necesita lógica; **nunca** su controller.
- Un **service por dominio**; métodos distintos si internal y portal se comportan distinto.
- **BD**: migraciones SQL en `backend/BD/`. Runtime con `pg` y `$1`, `$2`. **Sin ORM.**
- **Credenciales**: solo `.env` (`DATABASE_URL`, etc.). Sin hardcode.

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

---

## Pendiente (base)

- [ ] `common/database` (DatabaseModule / DatabaseService)
- [ ] `AppException` + filter + ValidationPipe en español
- [ ] Prefix `api` + CORS (ya parcial en `main.ts`)
- [ ] Auth internal (JWT) cuando toque login del negocio
- [ ] Primer feature de dominio (negocio / servicios / citas)
- [ ] Scalar `/api/reference`
