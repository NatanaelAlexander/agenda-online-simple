# Agenda online simple — Producto y features

> Nombre de marca: pendiente (HoraYa no disponible). Working title: **Agenda online simple**.

## Qué es

**Agenda online simple** es una agenda online sencilla, barata y propia para pequeños negocios y profesionales independientes.

No es un SaaS gigante ni un ERP vertical. Es software que el negocio compra (pago único o licencia instalable) para tener su propia página de reservas, sin depender de WhatsApp para organizar horas.

**Promesa:** el cliente recibe un link → ve horarios → se identifica con Google al reservar → queda registrado. Sin panel de cliente. Sin caos de WhatsApp para organizar horas.

---

## Posicionamiento

| No somos | Sí somos |
| --- | --- |
| Otro AgendaPro / ERP con POS, inventario, facturación, marketplace e IA | Agenda profesional sin la carga empresarial |
| SaaS multi-tenant masivo desde el día 1 | Producto vendible barato: licencia única + hosting/mantención opcional |
| Sistema para clínicas o gimnasios grandes | Herramienta para barberías, peluquerías, manicuristas, kinesiólogos, psicólogos, técnicos a domicilio, entrenadores, independientes |

**Mensaje comercial (borrador):**

> Tu agenda online propia.  
> Tu negocio recibe reservas 24/7.  
> Sin depender de WhatsApp para organizar tus horas.  
> Pago único.

---

## Contexto de mercado (por qué existe)

Referentes globales: Calendly, Acuity, Setmore, SimplyBook.me. En Chile/LATAM: AgendaPro (muy completo y caro), AgendaLibre y Quiero Agendar (más baratos/simples).

Lo que más importa a usuarios reales (reseñas / discusiones):

1. Reserva online
2. Gestión de citas
3. Gestión de calendario

El hueco: soluciones demasiado caras o con demasiadas funciones (“bells and whistles”) para equipos pequeños. Hay demanda por algo **simple + barato**, validada por competidores chilenos en el rango ~$7.490–$15.900+/mes.

**Oportunidad:** no “mejor AgendaPro”, sino agenda propia, extrema facilidad, precio accesible (idealmente pago único).

---

## Principios de producto

1. **Núcleo primero:** link de reserva → slots → Google al confirmar → registro.
2. **Cliente sin panel:** no hay cuenta SaaS para el cliente; Google OAuth **solo al agendar**; su cita se recuerda en **cookies** del navegador.
3. **Público = disponibilidad:** el calendario compartido muestra horas libres/ocupadas, **no** quién agendó.
4. **Internos sin auto-registro:** staff se crea a mano / seed; login email+password + recuperar contraseña; **no** “crear cuenta” público.
5. **No construir ERP:** nada de POS, inventario, facturación, marketplace, campañas de marketing ni IA en el alcance inicial.
6. **El motor de disponibilidad es el producto real** (buffers, solapes, concurrencia, excepciones, etc.).
7. **WhatsApp como diferenciador chileno**, sin reinventar WhatsApp: confirmaciones y recordatorios.
8. **Pagos / depósitos modulares**, no desde el día 0 si no hace falta.
9. **Multimedia vía Cloudflare R2** + `assets` + tablas intermedias `*_assets` / `system_assets` (patrón TPD). Logos y fotos se **suben**, no van en el repo.
10. **Auditoría genérica** con `audit_logs` (`table_name` + `record_id`) para cualquier entidad.

Flujos detallados: [`architecture/flujos.md`](architecture/flujos.md).

---

## Modelo de venta (borrador)

Opciones a validar:

- Licencia única ~$29.990–$49.990 + hosting/actualizaciones opcional (~$5.000/mes)
- Sistema instalado ~$80.000 + mantención opcional (~$10.000/mes)
- Personalización por negocio (logo/nombre) sin forzar multi-tenant gigante al inicio

---

## Audiencia inicial

1. Barberías  
2. Peluquerías  
3. Manicuristas / estética  
4. Kinesiólogos  
5. Psicólogos  
6. Técnicos / servicios a domicilio  
7. Entrenadores  
8. Profesionales independientes  

Fuera de foco inicial: clínicas grandes, gimnasios grandes, retail complejo.

---

## Features

### V1 — MVP

#### Administrador (usuarios internos)

- [ ] Login **email + password** (sin auto-registro tipo SaaS)
- [ ] Recuperar / cambiar contraseña
- [ ] Alta de usuarios internos solo desde panel / seed (owner)
- [ ] Negocio: nombre, descripción, teléfono, email, dirección, redes, zona horaria
- [x] Logo del negocio: upload R2 → `assets` → `businesses_assets` (`kind=logo`)
- [x] Estilos de instalación: colores + layouts home (`app_branding`)
- [x] Perfil staff (nombre/contraseña) + menú sidebar
- [ ] Logo de la instalación/producto: upload → `system_assets` (`kind=logo`) — para vender sin tocar el código
- [x] Servicios: nombre, duración **opcional**, precio **opcional**, color, descripción…
- [x] Profesionales: alta / edición / desactivar + servicios asignados
- [x] Profesionales: horarios semanales en panel (`set-schedules` / `schedules/listar`)
- [x] Profesionales: excepciones UI (festivos / cerrado local o por pro)
- [x] Disponibilidad: bloques por día + excepciones cerradas en calendario público
- [x] Gestión de citas (crear interno, filtros, estados, paginación 10/20/30)
- [x] Resumen del día + gráfico de citas por día (Inicio)
- [ ] Clientes: ficha simple (contacto, historial de citas, total gastado, notas)
- [ ] Roles y permisos (patrón TPD: `module:action`)
- [x] Multimedia: R2 + `assets` + logo de negocio (UI Negocio); cover/gallery/avatar pendientes
- [ ] Auditoría: `audit_logs` en escrituras relevantes del panel
- [ ] Configuración básica

#### Cliente (página pública de reserva)

- [ ] URL pública tipo `misitio.cl/mi-negocio` (o subdominio)
- [x] Ver calendario + **solo horas disponibles** (sin datos de otros clientes)
- [x] Elegir servicio
- [x] Elegir profesional
- [x] Elegir fecha (días cerrados opacos) y hora (overlay de slots)
- [x] **Auth Google** al confirmar la reserva (identidad; no crea panel ni usuario interno)
- [x] Mensaje de confirmación tipo “Hora tomada”
- [x] Guardar en BD (`clients` + `appointments`) para el negocio
- [x] **Cookie** con resumen de SU cita (nombre, correo, qué/cuándo agendó) para mostrársela al volver
- [x] Al reentrar a la página: ver “tu hora” desde cookie (solo la suya)
- [x] Cancelar (token + cookie)
- [ ] Reprogramar (token por email y/o cookie + Google si aplica)
- [x] QR / PDF del link público (panel Negocio)

#### Automatización

- [ ] Email de confirmación
- [ ] Email de recordatorio (mín. 24h antes, con confirmar / cancelar / reprogramar)
- [ ] Email de cancelación
- [ ] Email de reprogramación

#### Motor de disponibilidad (crítico)

Debe manejar correctamente:

- [ ] Duración variable por servicio
- [ ] Buffers / preparación / tiempo posterior
- [ ] Múltiples profesionales
- [x] Horarios por profesional
- [x] Feriados, vacaciones, bloqueos, excepciones (UI en Profesionales)
- [ ] Concurrencia y prevención de doble reserva
- [ ] Zonas horarias
- [ ] Cancelaciones y reprogramaciones que liberan slots

#### Dashboard (simple)

- [x] Resumen del día: citas + gráfico por día (Inicio)
- [x] Lista de próximas / del día en Inicio

---

### Opcional temprano / V1.5

- [ ] Confirmación y recordatorio por WhatsApp (botón o envío automático; monetizable por volumen)
- [ ] Pagos básicos (pagar en local / depósito / pagar todo) vía integración (ej. Mercado Pago), no pasarela propia

---

### V2

- [ ] Sincronización Google Calendar / Apple Calendar
- [ ] Reservas recurrentes (cada lunes, cada 15 días, etc.)
- [ ] Packs / paquetes de sesiones (ej. 5 sesiones; cliente agenda las restantes)
- [ ] Depósito contra no-show
- [ ] Estadísticas / reportes simples (citas, atendidas, canceladas, no-show, ingresos; por servicio, profesional, horas pico; clientes nuevos vs recurrentes)
- [ ] Múltiples sucursales
- [ ] Dominio personalizado
- [ ] WhatsApp más completo (si no entró en V1.5)

---

### V3

- [ ] Mercado Pago (si no está antes)
- [ ] API y webhooks
- [ ] Integración Google Reserve / más calendarios
- [ ] Formularios personalizados en la reserva
- [ ] Membresías
- [ ] Bonos / gift cards

---

## Explicitamente fuera de alcance (por ahora)

- POS
- Inventario
- Facturación / boleta electrónica
- Marketplace
- Campañas de marketing
- IA
- App móvil nativa
- Sistema contable
- CRM enterprise

---

## Notas abiertas

- Elegir nombre de marca y validar dominio `.cl` / `.com` + INAPI.
- Definir si V1 se vende como instalable, hosted single-tenant, o híbrido.
- Precio exacto de licencia y de WhatsApp por volumen.
- Prioridad WhatsApp vs pagos en el primer release comercial.
- Configurar Google Cloud OAuth (client id/secret) — **solo para reserva del cliente**, no para alta de staff.
- Completar `R2_*` en `.env` (Cloudflare R2, bucket privado).
- Definir contenido/TTL de la cookie `aos_booking` (y limpieza al cancelar).
- MER V1: ver [`mer.md`](mer.md). Flujos: [`architecture/flujos.md`](architecture/flujos.md).