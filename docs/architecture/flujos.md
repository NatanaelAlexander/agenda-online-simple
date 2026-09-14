# Flujos de autenticación y reserva

## Quién es quién

| Actor | Auth | Panel | Cómo nace |
|-------|------|-------|-----------|
| **Interno** (`super_admin`, `admin`, …) | Email + password + recuperar contraseña | Sí (`/app`) | Seed / otro interno. **No hay auto-registro** |
| **Cliente** (quien agenda) | Google OAuth → **booking session** one-shot | No | **No** es fila en `users`. Upsert en `clients` + cita; sesión Google se **invalida** al confirmar |

Lo que ve **cualquier visitante** en la página pública: calendario y **horas disponibles**.  
**No** se publica quién agendó ni datos de otros clientes.

### Roles internos (seed)

| Rol | Puede | No puede |
|-----|--------|----------|
| `super_admin` | Todo, incluido `audit_logs` y gestión de users/roles/permissions | — |
| `admin` | Features (negocio, servicios, profesionales, citas, clientes, assets, availability) | Logs de auditoría; CRUD users/roles/permissions; `system:manage` |

---

## Flujo A — Usuario interno (panel)

```mermaid
flowchart LR
  A[Seed / owner crea usuario] --> B[Login email + password]
  B --> C[JWT + refresh]
  C --> D[Panel /app]
  B --> E[Olvidé mi contraseña]
  E --> F[Reset por email]
  F --> B
```

Reglas:

- No existe “Crear cuenta” público para staff.
- Sí: login, logout, recuperar/cambiar contraseña.
- Permisos RBAC (`module:action`) como TPD.

---

## Flujo B — Cliente agenda hora (público)

```mermaid
flowchart TD
  A[Entra a / o /r/slug] --> B[Catálogo: servicios + profesionales + schedules]
  B --> C[Elige servicio y profesional]
  C --> D[Calendario: días cerrados opacos]
  D --> E[Elige día → overlay con slots]
  E --> F[Elige hora + Confirmar con Google]
  F --> G[Auth Google]
  G --> H[Booking session JWT corto one-shot]
  H --> I[POST portal/appointments/confirm]
  I --> J[Upsert clients + INSERT appointments]
  J --> K[Invalidar booking session]
  K --> L[Cookie aos_booking]
  L --> M[Email confirmación si Resend OK]
```

### Disponibilidad

- Horarios semanales: `professional_schedules` (0=dom … 6=sáb); si el pro no tiene filas → fallback `business_schedules`.
- Excepciones: `schedule_exceptions` (pro específico o `professional_id` null = todo el local); al resolver el día, preferir la del pro.
- Catálogo portal (`GET /portal/businesses/:slug/catalog`) incluye `schedules` por profesional.
- Slots: `POST /portal/appointments/slots` = horarios − excepciones − citas **del ámbito** (pro o negocio) − duración/buffers.
- Respuesta slot: `{ startsAt, booked, capacity, remaining }` — UI muestra **`booked/capacity`**.
- Al **confirmar / crear / reprogramar**: el `startsAt` debe ser un slot abierto con cupo; si hay pro+servicio → fila en `professional_services`.
- UI: días sin schedule deshabilitados; slots solo en overlay tras elegir día.

### Staff configura horarios

```mermaid
flowchart LR
  A[/app/profesionales] --> B[Horarios semanales]
  A --> C[Excepciones: cerrado festivo]
  B --> D[POST set-schedules]
  C --> E[POST exceptions/create]
  D --> F[Público: días semanales]
  E --> G[Público: día gris en calendario]
```

- `POST /internal/professionals/schedules/listar` `{ professionalId }`
- `POST /internal/professionals/set-schedules` `{ professionalId, schedules[] }`
- `POST /internal/professionals/exceptions/listar|create|eliminar`
- Catálogo portal incluye `exceptions[]` (`exceptionDate`, `isClosed`, `professionalId` null = todo el local)

### Staff agenda / gestiona citas

```mermaid
flowchart LR
  A[/app/citas] --> B[Filtros + pageSize]
  A --> C[Nueva cita]
  C --> D[slots portal]
  C --> E[POST appointments/create]
  B --> F[POST appointments/listar]
  A --> G[change-status / cancel]
  H[/app inicio] --> I[Gráfico citas por día]
```

- Alta interna: servicio + profesional + cliente (existente o nuevo) + slot libre
- Filtros: estado, servicio, profesional, cliente, rango de fechas
- Paginación: 10 / 20 / 30

- La booking session vive en Redis (jti) con TTL corto (~15 min) y **un solo uso**.
- Tras confirmar, queda inválida hasta un nuevo login Google.
- Upsert de `clients` es tolerante a carrera (email / google_sub únicos por negocio).
- **Nunca** se crea `users` ni rol de panel para el cliente.

### Cookie del cliente (solo su vista)

Tras agendar, el navegador guarda **una lista** en `aos_booking` (compatible con objeto único legacy):

| Dato | Para qué |
|------|----------|
| email / name | Saludo / resumen |
| appointmentId | Referencia |
| startsAt / endsAt | “Tu hora” |
| serviceName / professionalName | Qué agendó |
| businessSlug | De qué negocio |
| **cancelToken** | Cancelar / consultar estado / sync |
| statusCode / cancelledBy | UI de estado |

Al volver a la página pública:

- Cookie = **caché**. Sync: `POST /portal/appointments/mias` con los `cancelTokens` (+ `businessSlug`).
- Mostrar **“mis horas”** (solo las suyas); el calendario sigue sin nombres ajenos.
- Contadores de slot: ocupados/capacidad, no datos de otros clientes.

Cancelar: `POST /portal/appointments/cancel` con `cancelToken`.

**Internal nunca** debe devolver `cancelToken` en listados/detalle staff.

### Qué NO hace el cliente

- No tiene `/app` ni roles.
- No se registra como `users` interno.
- No ve citas ajenas.

---

## Privacidad en la página pública

| Visible para todos | Solo el cliente dueño | Solo internos (`/app`) |
|--------------------|----------------------|-------------------------|
| Slots libres / ocupados (`booked/capacity`, sin nombres) | Resumen de **sus** citas (cookie + `mias`) | Todas las citas, clientes, historial |
| Servicios, profesionales, precios | Cancelar la suya con `cancelToken` | Audit, users (super_admin), branding sistema |

Más reglas operativas: [`practicas.md`](practicas.md).

