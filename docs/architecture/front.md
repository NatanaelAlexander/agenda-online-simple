# Arquitectura frontend — agenda-online-simple

Misma línea que **Team Prime Digital**: Next.js (App Router) + React + Tailwind. El frontend **solo consume** la API Nest; no define backend propio.

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
- Cliente: `lib/api/client.ts` (`apiFetch`, upload si aplica)
- Auth panel: cookies de access/refresh + Bearer en requests autenticados
- Ante `401`: intento de refresh y reintento (cuando exista auth)
- Dominios: `components/app/api/*.ts` llaman al client
- Lecturas con filtros: usar **POST …/detalle** o **POST …/listar** (los navegadores no mandan body en GET) — ver [`back.md`](back.md)

---

## Auth y layouts

- Preferir **no** depender de `middleware.ts` de Next para reglas de negocio (igual TPD).
- Root / login: cookie de access → `/app`, si no → `/login`.
- `AuthProvider`: login/logout, session desde claims JWT.
- Shell `(app)/app/layout.tsx`: sidebar, nav del negocio.
- Permisos en UI vía helpers; **la API es la fuente de verdad**.
- Flujo público de reserva: sin cuenta obligatoria (fricción mínima).

---

## Superficies (UI)

| Área | Quién | Rutas típicas |
|------|-------|----------------|
| Internal (app) | Dueño / profesionales | `/app/*` |
| Portal / público | Cliente final | `/r/[negocio]` reserva, cancelar, reprogramar |
| Auth | Negocio | `/login` |

Contrato HTTP del backend: [`back.md`](back.md).

---

## Pendiente (base)

- [ ] `lib/api/client.ts`
- [ ] Estructura `(auth)` / `(app)` / pública de reserva
- [ ] Wrappers `components/app/api/*` por dominio
- [ ] AuthProvider cuando exista login
