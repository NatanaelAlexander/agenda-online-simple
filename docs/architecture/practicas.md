# Buenas prácticas — agenda-online-simple

Reglas aprendidas en producción del producto. **Léelas antes de tocar citas, auth, portal o el panel.** Evitan regresiones que ya nos costaron.

Relacionado: [`back.md`](back.md) · [`front.md`](front.md) · [`flujos.md`](flujos.md) · [`tests.md`](tests.md)

---

## 1. Superficies y secretos

| Dato | Internal (`/api/internal/*`) | Portal (`/api/portal/*`) |
|------|------------------------------|---------------------------|
| `cancelToken` | **Nunca** en listar/detalle/create/status staff | Sí: cookie, cancelar, estado, `mias` |
| Citas ajenas | Sí (staff) | **No** (solo las del cliente) |
| Nombres en slots | No aplica | **Nunca** publicar quién ocupó un cupo |

- Respuestas internas: mapear con `withoutCancelToken` / `StaffAppointmentDetail`.
- Cookie `aos_booking` = **caché**; la fuente de verdad es BD vía `POST /portal/appointments/mias` (batch de `cancelTokens`) o `estado`/`cancel`.
- Al cargar el wizard: sincronizar cookie desde `mias`, no N llamadas a `estado`.

---

## 2. Auth / RBAC

| Recurso | Permiso | Uso |
|---------|---------|-----|
| Branding instalación | `system:manage` (`@AuthorizeResource('system')` + action `manage`) | `/internal/system/branding/*` |
| Features de negocio | `module:action` (`businesses:read`, `appointments:create`, …) | Controllers de dominio |
| Bypass | `super_admin` **o** `system:manage` | `PermissionsService.bypassesPermissionChecks` |

**No** autorizar branding con `businesses:read/update`.

### Frontend panel

- `AppGuard` = sesión requerida; rutas sensibles (`/app/interno`) → `requiredRoles={['super_admin']}` + `middleware.ts` (cookie `aos_access`).
- Sidebar: filtrar por `claims.permissions` / `roles` (`canSeeNavItem`). No mostrar Interno/Estilos solo por “está logueado”.
- La API sigue siendo la fuente de verdad; el guard UI es defensa en profundidad.

---

## 3. Cupos y disponibilidad (núcleo)

### Con `professionalId`

1. **Busy / lock** solo citas de ese profesional (`pending` \| `confirmed` \| `attended`).
2. **Horarios:** `professional_schedules`; si no hay filas → fallback `business_schedules`.
3. **Excepciones:** del profesional **o** de negocio (`professional_id IS NULL`); preferir la específica del pro.

### Sin `professionalId`

- Busy/lock/schedules a nivel **negocio** (comportamiento “sala compartida”).

### Al crear / confirmar / reprogramar

1. Si hay pro **y** servicio → `SQL_ASSERT_PROFESSIONAL_SERVICE` (obligatorio).
2. `assertStartsInOpenWindow` (slot debe existir en el motor del día y `remaining > 0`).
3. En transacción: `assertSlotCapacity` (lock `FOR UPDATE` + tope `max_bookings_per_slot`).

Orden: validar ventana → lock capacidad → insert/update.

Contadores de slot al cliente: **`booked/capacity`** (ocupados / cupo), no “restantes” como mensaje principal.

---

## 4. DTOs y contratos HTTP

- Un solo archivo canónico por feature cuando consolidaste (`appointment.dto.ts`). **No** dejar DTOs huérfanos duplicados.
- Todo campo del body con `forbidNonWhitelisted` debe tener decoradores (`@IsOptional`, `@IsString`, `@MaxLength`, …). Si el front envía un campo, el DTO lo declara o el front deja de mandarlo.
- Health real: `GET /health` (o `/api/health` según prefix). E2E **no** asume `"Hello World!"`.
- Errores 5xx: el `AppExceptionFilter` **loguea** stack; la respuesta al cliente sigue genérica.

---

## 5. Frontend UX (panel + público)

- Nav y menús: permisos primero (ver §2).
- Listas densas en móvil: tabla `hidden md:block` + cards `md:hidden` (mismo handler de acciones).
- Modales: padding más chico en móvil (`px-3`), sin bloquear scroll del body en booking público.
- Cookie de reserva: array multi-cita; “revisar mis horas” + sync con `mias`.

---

## 6. Tests mínimos al tocar citas / auth

| Cambio | Cubrir con |
|--------|------------|
| Busy/lock/schedules por pro | Unit: params SQL + cupo lleno → 400 |
| Slot fuera de ventana | Unit: `assertStartsInOpenWindow` → `HorarioNoDisponibleException` |
| Endpoint portal/internal nuevo | API contrato (`tests/api/`) sin BD |
| Health / filter | E2E o unit del filter si cambia el contrato |

Estructura: `backend/src/<feature>/tests/{unit,api}/`. Detalle: [`tests.md`](tests.md).

---

## 7. Checklist rápido (PR de citas o panel)

- [ ] ¿Sale `cancelToken` en una respuesta **internal**? → quitarlo.
- [ ] ¿Branding / system usa `businesses:*`? → corregir a `system:manage`.
- [ ] ¿Ruta `/app/interno` (u otra sensible) sin guard/middleware? → agregar.
- [ ] ¿Alta/confirm con pro ignora horarios del pro o cuenta busy de todo el local? → corregir H1.
- [ ] ¿Se puede confirmar fuera de ventana o con pro≠servicio? → M1/M2.
- [ ] ¿Cookie es la única fuente de “mis citas”? → usar `mias` + cookie caché.
- [ ] ¿Sidebar muestra links sin permiso? → filtrar.
- [ ] ¿DTO nuevo / campo nuevo sin validators? → agregar o no enviar.
- [ ] ¿Test unit o API del cambio de capacidad/auth? → agregar.

---

## 8. Fuera de alcance (aún)

No asumir resuelto hasta que exista diseño explícito:

- Tokens panel 100% HttpOnly / BFF
- Multi-tenant memberships reales (varios negocios por user)
- Suite Playwright completa del front
