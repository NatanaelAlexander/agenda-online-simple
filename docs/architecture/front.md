# Arquitectura frontend — agenda-online-simple

Misma línea que **Team Prime Digital**: Next.js (App Router) + React + Tailwind. El frontend **solo consume** la API Nest; no define backend propio.

**Panel / portal / permisos:** ver también [`practicas.md`](practicas.md).

---

## Stack

| Pieza | Notas |
|-------|--------|
| Next.js | 16+ (App Router) |
| React | 19 |
| Tailwind CSS | 4 (`src/app/globals.css`) |
| Iconos | `lucide-react` |
| UI base | `src/components/ui/` (shadcn; no editar a mano de forma habitual) |

Instalar paquetes (con el stack Docker arriba):

```bash
docker compose exec frontend pnpm add <paquete>
```

Si el `pnpm-workspace.yaml` local molesta al CLI de shadcn, quitarlo temporalmente, instalar, y restaurarlo (igual que en el setup inicial).

Agregar componentes shadcn:

```bash
pnpm dlx shadcn@latest add <nombre>
```

---

## Estructura

```
frontend/src/
├── app/                    ← rutas (pages delgadas)
│   ├── layout.tsx          ← providers (theme, auth)
│   ├── page.tsx            ← landing / redirect
│   ├── (auth)/login/       ← login del negocio
│   ├── (app)/app/          ← shell del panel (internal)
│   └── (public)/…          ← página pública de reserva (portal)
├── components/
│   ├── app/<dominio>/      ← UI por feature (espejo de rutas)
│   ├── app/api/            ← wrappers HTTP por recurso
│   └── ui/                 ← primitivos shadcn
├── lib/
│   ├── api/                ← client HTTP (apiFetch, auth)
│   └── auth/               ← cookies JWT, session (panel)
└── providers/              ← AuthProvider, etc.
```

### Convención pages ↔ components

La page **solo monta** el componente. Misma ruta de carpetas:

| Ruta | Page | UI |
|------|------|-----|
| `/login` | `app/(auth)/login/page.tsx` | `components/…/login` |
| `/app` | `app/(app)/app/page.tsx` | `components/app/…` |
| `/app/citas` | `app/(app)/app/citas/…` | `components/app/citas/…` |
| `/r/[slug]` | `app/(public)/r/[slug]/…` | `components/public/…` |

---

## Comunicación con la API

- Base: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`) → `${API}/api/...`
- Cliente HTTP: `lib/api/client.ts`
- **Panel:** cookies JWT access/refresh tras login email+password
- **Página pública:** cookie de **reserva del cliente** (resumen de su cita: nombre, email, hora, servicio…). No es sesión de panel
- Ante `401` en panel: refresh y reintento
- Lecturas con filtros (panel): **POST …/detalle** o **POST …/listar** — ver [`back.md`](back.md)

---

## Auth y layouts

- Staff: `/login` → email+password → `/app`. **Sin “registrarse”.**
- Recuperar contraseña: flujo email → token → nueva password.
- `AuthProvider` solo para panel interno.
- **`AppGuard`:** exige sesión en `/app/*`. Rutas sensibles (p. ej. `/app/interno`) usan `requiredRoles={['super_admin']}` + `middleware.ts` (cookie `aos_access`).
- **Sidebar:** ítems filtrados por `claims.permissions` / `roles` (`canSeeNavItem`). Interno y “Estilos del sistema” no se muestran a quien no corresponde.
- **Home `/`:** reserva branded (slug por defecto `NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG`) + calendario.
- Página pública `/r/[slug]`:
  - Wizard: servicio → profesional → **calendario**.
  - Logo del negocio (si hay) arriba del nombre.
  - Días sin horario del profesional o con **excepción cerrada** quedan **opacos / deshabilitados**.
  - Al elegir un día, los **slots se abren en overlay** encima del calendario (Volver / Confirmar con Google).
  - Contador de cupo: **`booked/capacity`** (lleno → slot deshabilitado).
  - Cookie `aos_booking` (array multi-cita) = caché; al montar, sync con `POST /portal/appointments/mias`.
  - “Revisar mis horas” + marcadores de días con reserva propia.
  - Al confirmar: Google OAuth → callback → cookie + redirect `?ok=1`.
- Panel `/app/profesionales`: **horarios semanales** + **excepciones** (festivos / cerrado local o por pro) → `set-schedules` y `exceptions/*`.
- Pie del sidebar: menú de usuario (Perfil, Configuración, Estilos, Términos, Logout).
- `/app/estilos`: colores de instalación + layout home (`classic` / `split` / `compact`); gated por `super_admin` / `system:manage`.
- Panel `/app/negocio`: datos + **logo** (JPG/PNG/WEBP ≤30 MB) + **QR / PDF** de reserva (`NEXT_PUBLIC_SITE_URL/r/{slug}`).
- Listas densas (citas, clientes, profesionales): tabla en `md+`, **cards** en móvil.
- Precios en UI: **CLP** (`es-CL`).
- Permisos UI vía helpers; **la API es la fuente de verdad** para internos.

---

## Superficies (UI)

| Área | Quién | Rutas típicas |
|------|-------|----------------|
| Internal (app) | Staff | `/app/*` (inicio+gráficos, citas con alta/filtros, servicios, profesionales+horarios, clientes, negocio+QR) |
| Auth staff | Staff | `/login`, `/recuperar` |
| Público | Cliente | `/`, `/r/[slug]`, `/r/booking/callback` |

Contrato HTTP: [`back.md`](back.md). Flujos: [`flujos.md`](flujos.md).

---

## Dependencias UI relevantes

| Paquete | Uso |
|---------|-----|
| `react-day-picker` + Calendar shadcn | Calendario de reserva |
| `motion` | BlurFade / animaciones overlay slots |
| `qrcode` + `jspdf` | QR PNG y afiche PDF en Negocio |
| Magic UI (local) | `BlurFade`, `BorderBeam`, `MagicCard` |

---

## Pendiente (base)

- [x] `lib/api/client.ts`
- [x] Estructura `(auth)` / `(app)` / pública de reserva
- [x] Cookie de reserva del cliente (`aos_booking`) + UI “Tu hora”
- [x] Wrappers `components/app/api/*` por dominio
- [x] AuthProvider panel (password) + flujo Google solo en booking
- [x] Home = calendario de reserva + Magic UI
- [x] Horarios por profesional (panel) + días cerrados opacos (público)
- [x] Overlay de slots al elegir día
- [x] Generador QR / PDF de link público
- [x] Panel citas: alta interna, filtros, paginación 10/20/30
- [x] Inicio: resumen + gráfico citas por día
- [x] Guard/middleware Interno + nav por permisos
- [x] Cookie multi-cita + sync `mias` + cards móvil en listados
