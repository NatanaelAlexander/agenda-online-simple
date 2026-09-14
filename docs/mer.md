# MER — agenda-online-simple (V1)

Modelo entidad-relación por **features**. Auth/RBAC, **assets (R2)** y **audit_logs** al estilo **Team Prime Digital**.

- **Internos** (`users`): email + password + recuperar contraseña. **Sin auto-registro** (los crea el owner/seed).
- **Clientes**: no son `users`. Al agendar usan **Google OAuth**; quedan en `clients` + `appointments`. Resumen de **su** cita en **cookies** del navegador.
- Página pública: calendario = disponibilidad; no se muestran datos de otros clientes.
- Multimedia: `assets` + R2 + intermedias con `kind`.
- Auditoría: `audit_logs` (`table_name` + `record_id` + `ip_address`).

Flujos: [`architecture/flujos.md`](architecture/flujos.md). Enlace BD: [`architecture/bd.md`](architecture/bd.md).

> Mermaid `erDiagram` no soporta “cajas” por feature; por eso hay un **mapa**, un **overview con contenedores**, y luego un **MER por feature**.

---

## Mapa de features → tablas

| # | Feature | Tablas |
|---|---------|--------|
| 1 | **Auth / RBAC** | `users`, `roles`, `permissions`, `users_roles`, `roles_permissions`, `refresh_sessions` |
| 2 | **Assets (multimedia)** | `assets`, `system_assets`, `businesses_assets`, `professionals_assets`, `services_assets` |
| 3 | **Audit** | `audit_logs` |
| 4 | **Businesses** | `businesses` (+ puente assets) |
| 5 | **Services** | `services` (+ puente assets) |
| 6 | **Professionals + disponibilidad** | `professionals`, `professional_services`, `professional_schedules`, `schedule_exceptions` (+ puente assets) |
| 7 | **Clients** | `clients` |
| 8 | **Appointments (agendación)** | `appointments`, `appointment_statuses` |

Los **slots** no son tabla: se calculan (horarios − excepciones − citas − duración/buffers).

---

## Overview (contenedores)

```mermaid
flowchart TB
  subgraph F1["1 · Auth / RBAC"]
    users
    roles
    permissions
    users_roles
    roles_permissions
    refresh_sessions
  end

  subgraph F2["2 · Assets · R2"]
    assets
    system_assets
    businesses_assets
    professionals_assets
    services_assets
  end

  subgraph F3["3 · Audit"]
    audit_logs
  end

  subgraph F4["4 · Businesses"]
    businesses
  end

  subgraph F5["5 · Services"]
    services
  end

  subgraph F6["6 · Professionals + disponibilidad"]
    professionals
    professional_services
    professional_schedules
    schedule_exceptions
  end

  subgraph F7["7 · Clients"]
    clients
  end

  subgraph F8["8 · Appointments"]
    appointments
    appointment_statuses
  end

  users --> refresh_sessions
  users --> users_roles
  roles --> users_roles
  roles --> roles_permissions
  permissions --> roles_permissions
  users -.-> assets
  users -.-> audit_logs
  users -.-> professionals
  assets --> system_assets
  assets --> businesses_assets
  assets --> professionals_assets
  assets --> services_assets
  businesses --> businesses_assets
  businesses --> services
  businesses --> professionals
  businesses --> clients
  businesses --> appointments
  businesses --> schedule_exceptions
  professionals --> professional_services
  services --> professional_services
  professionals --> professional_schedules
  professionals --> appointments
  services --> appointments
  clients --> appointments
  appointment_statuses --> appointments
  professionals --> professionals_assets
  services --> services_assets
```

---

## 1 · Auth / RBAC

**Solo usuarios internos.** Login email + password + reset. Permisos `module:action` como TPD. Google OAuth **no** crea filas aquí.

```mermaid
erDiagram
  users ||--o{ users_roles : tiene
  roles ||--o{ users_roles : asigna
  roles ||--o{ roles_permissions : otorga
  permissions ||--o{ roles_permissions : incluido_en
  users ||--o{ refresh_sessions : sesion

  users {
    uuid id PK
    string email UK
    string password
    string first_name
    string last_name
    string phone_number
    bool is_active
    int permissions_version
    timestamptz created_at
    timestamptz updated_at
  }

  roles {
    uuid id PK
    string name UK
  }

  permissions {
    uuid id PK
    string name UK
    string module
  }

  users_roles {
    uuid user_id PK,FK
    uuid role_id PK,FK
  }

  roles_permissions {
    uuid role_id PK,FK
    uuid permission_id PK,FK
  }

  refresh_sessions {
    uuid id PK
    uuid user_id FK
    char token_hash
    timestamptz expires_at
    timestamptz revoked_at
    uuid replaced_by_id FK
    text user_agent
    inet ip_address
    timestamptz created_at
  }
```

| Rol | Alcance |
|-----|---------|
| `super_admin` | Todo: features + users/roles/permissions + `audit_logs` + `system:manage` |
| `admin` | Features de negocio; **sin** audit logs ni gestión de users/roles/permissions |
| `professional` | (después) Su agenda y citas |
| `receptionist` | (después) Citas y clientes |

Permisos V1: `users`, `roles`, `permissions`, `businesses`, `services`, `professionals`, `availability`, `appointments`, `clients`, `assets`, `audit_logs`, `system` (`module:action`).

---

## 2 · Assets (multimedia + R2)

Metadata en Postgres; binario en **R2 privado**. Logos **subidos**, no en el repo.

```mermaid
erDiagram
  users ||--o{ assets : sube
  assets ||--o{ system_assets : branding_app
  assets ||--o{ businesses_assets : adjunto
  assets ||--o{ professionals_assets : adjunto
  assets ||--o{ services_assets : adjunto
  businesses ||--o{ businesses_assets : tiene
  professionals ||--o{ professionals_assets : tiene
  services ||--o{ services_assets : tiene

  assets {
    uuid id PK
    string file_name
    text file_path
    string mime_type
    bigint file_size
    uuid uploaded_by_id FK
    timestamptz created_at
  }

  system_assets {
    string kind PK
    uuid asset_id FK
  }

  businesses_assets {
    uuid business_id PK,FK
    uuid asset_id PK,FK
    string kind
  }

  professionals_assets {
    uuid professional_id PK,FK
    uuid asset_id PK,FK
    string kind
  }

  services_assets {
    uuid service_id PK,FK
    uuid asset_id PK,FK
    string kind
  }

  businesses {
    uuid id PK
    string name
    string slug UK
  }

  professionals {
    uuid id PK
    string display_name
  }

  services {
    uuid id PK
    string name
  }

  users {
    uuid id PK
    string email UK
  }
```

| Tabla | `kind` típicos |
|-------|----------------|
| `system_assets` | `logo`, `favicon` (instalación del producto) |
| `businesses_assets` | `logo`, `cover`, `gallery` |
| `professionals_assets` | `avatar`, `gallery` |
| `services_assets` | `image`, `gallery` |

`file_path` = object key R2. Env: `R2_ENDPOINT_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_SYSTEM`.

---

## 3 · Audit

Genérico: cualquier tabla se audita sin cambiar su esquema.

```mermaid
erDiagram
  users ||--o{ audit_logs : realiza

  audit_logs {
    uuid id PK
    uuid user_id FK
    string action
    string table_name
    uuid record_id
    jsonb old_values
    jsonb new_values
    inet ip_address
    timestamptz created_at
  }

  users {
    uuid id PK
    string email UK
  }
```

| Campo | Rol |
|-------|-----|
| `user_id` | Quién (nullable si sistema) |
| `action` | `create` / `update` / `delete` (y las que se definan) |
| `table_name` | Ej. `appointments`, `services` |
| `record_id` | UUID del registro afectado |
| `old_values` / `new_values` | JSONB |
| `ip_address` | IP del cliente (`INET`); desde request / proxy (`X-Forwarded-For` si Traefik) |

`action`: `create` / `update` / `delete` (y las que se definan). Índices: `user_id`, `table_name`, `created_at`, `ip_address`.

---

## 4 · Businesses

```mermaid
erDiagram
  businesses ||--o{ businesses_assets : multimedia
  assets ||--o{ businesses_assets : archivo

  businesses {
    uuid id PK
    string name
    string slug UK
    text description
    string phone
    string email
    string address
    string timezone
    jsonb social_links
    timestamptz created_at
    timestamptz updated_at
  }

  businesses_assets {
    uuid business_id PK,FK
    uuid asset_id PK,FK
    string kind
  }

  assets {
    uuid id PK
    text file_path
  }
```

Logo de la página pública: `businesses_assets` con `kind=logo` (no FK `logo_asset_id`).

---

## 5 · Services

```mermaid
erDiagram
  businesses ||--o{ services : ofrece
  services ||--o{ services_assets : multimedia
  assets ||--o{ services_assets : archivo

  businesses {
    uuid id PK
    string name
  }

  services {
    uuid id PK
    uuid business_id FK
    string name
    text description
    int duration_minutes
    int prep_minutes
    int buffer_minutes
    int price_cents
    string color
    bool is_active
    timestamptz created_at
    timestamptz updated_at
  }

  services_assets {
    uuid service_id PK,FK
    uuid asset_id PK,FK
    string kind
  }

  assets {
    uuid id PK
    text file_path
  }
```

---

## 6 · Professionals + disponibilidad

Horarios semanales + excepciones. Motor de slots usa esto en runtime (no hay tabla `slots`).

```mermaid
erDiagram
  businesses ||--o{ professionals : emplea
  users ||--o| professionals : "opcional login"
  professionals ||--o{ professional_services : ofrece
  services ||--o{ professional_services : asignado
  professionals ||--o{ professional_schedules : horario
  businesses ||--o{ schedule_exceptions : excepciones
  professionals ||--o{ schedule_exceptions : "null = todo el negocio"
  professionals ||--o{ professionals_assets : multimedia
  assets ||--o{ professionals_assets : archivo

  businesses {
    uuid id PK
    string timezone
  }

  users {
    uuid id PK
    string email UK
  }

  professionals {
    uuid id PK
    uuid business_id FK
    uuid user_id FK
    string display_name
    string email
    string phone
    bool is_active
    timestamptz created_at
    timestamptz updated_at
  }

  professional_services {
    uuid professional_id PK,FK
    uuid service_id PK,FK
  }

  services {
    uuid id PK
    string name
    int duration_minutes
    int prep_minutes
    int buffer_minutes
  }

  professional_schedules {
    uuid id PK
    uuid professional_id FK
    smallint weekday
    time start_time
    time end_time
  }

  schedule_exceptions {
    uuid id PK
    uuid business_id FK
    uuid professional_id FK
    date exception_date
    bool is_closed
    time start_time
    time end_time
    string reason
  }

  professionals_assets {
    uuid professional_id PK,FK
    uuid asset_id PK,FK
    string kind
  }

  assets {
    uuid id PK
    text file_path
  }
```

---

## 7 · Clients

Ficha del cliente que agenda. **No** es usuario del panel. Se crea/actualiza al confirmar con Google (email/nombre del perfil).

```mermaid
erDiagram
  businesses ||--o{ clients : atiende

  businesses {
    uuid id PK
    string name
  }

  clients {
    uuid id PK
    uuid business_id FK
    string full_name
    string phone
    string email
    string google_sub
    text notes
    timestamptz created_at
    timestamptz updated_at
  }
```

- `google_sub` / `email`: identidad Google al agendar (opcional phone si lo pide el flujo).
- Unicidad sugerida: `(business_id, email)` o `(business_id, google_sub)`.
- La **cookie** del navegador no es tabla: guarda el resumen de “su” cita para la UI pública (ver [`architecture/flujos.md`](architecture/flujos.md)).

---

## 8 · Appointments (agendación)

La cita concreta. Registro completo en BD (solo internos lo ven completo). El cliente ve **la suya** vía cookie + email/`cancel_token`.

```mermaid
erDiagram
  businesses ||--o{ appointments : agenda
  services ||--o{ appointments : de
  professionals ||--o{ appointments : atiende
  clients ||--o{ appointments : reserva
  appointment_statuses ||--o{ appointments : estado

  businesses {
    uuid id PK
    string slug UK
  }

  services {
    uuid id PK
    int duration_minutes
    int prep_minutes
    int buffer_minutes
  }

  professionals {
    uuid id PK
    string display_name
  }

  clients {
    uuid id PK
    string full_name
    string email
    string google_sub
  }

  appointment_statuses {
    uuid id PK
    string code UK
    string name UK
  }

  appointments {
    uuid id PK
    uuid business_id FK
    uuid service_id FK
    uuid professional_id FK
    uuid client_id FK
    uuid status_id FK
    timestamptz starts_at
    timestamptz ends_at
    string cancel_token UK
    text notes
    timestamptz created_at
    timestamptz updated_at
  }
```

Estados: `pending`, `confirmed`, `attended`, `cancelled`, `no_show`.

**Flujo de reserva (lógico):**

```mermaid
flowchart LR
  A[Servicio + profesional] --> B[Calcular slots]
  B --> C[Cliente elige hora]
  C --> D[Auth Google]
  D --> E[Confirmación hora tomada]
  E --> F[INSERT clients + appointments]
  F --> G[Cookie resumen SU cita]
  G --> H[Email / WhatsApp]
```

Slots = `professional_schedules` − `schedule_exceptions` − citas activas − duración/buffers del `service`.

Público ve solo slots libres/ocupados (anónimo). Internos ven quién reservó.

---

## Fuera de V1 (después)

Packs, recurrentes, depósitos, sucursales, sync calendarios… Si llevan archivos: nueva puente `*_assets` + `kind`.

---

## Notas transversales

- Dinero en `price_cents`.
- Horarios con `businesses.timezone`.
- Concurrencia: lógica en service + posible exclusion constraint en citas activas.
- Credenciales solo en `.env` (`DATABASE_URL`, `R2_*`, `GOOGLE_*`, `JWT_*`).
