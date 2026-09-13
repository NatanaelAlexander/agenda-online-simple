# Agenda online simple — Producto y features

> Nombre de marca: pendiente (HoraYa no disponible). Working title: **Agenda online simple**.

## Qué es

**Agenda online simple** es una agenda online sencilla, barata y propia para pequeños negocios y profesionales independientes.

No es un SaaS gigante ni un ERP vertical. Es software que el negocio compra (pago único o licencia instalable) para tener su propia página de reservas, sin depender de WhatsApp para organizar horas.

**Promesa:** el cliente recibe un link → ve horarios → reserva → queda registrado. Sin crear cuenta. Sin caos de mensajes.

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

1. **Núcleo primero:** link de reserva → slots → confirmación → registro.
2. **Baja fricción para el cliente final:** sin cuenta obligatoria.
3. **No construir ERP:** nada de POS, inventario, facturación, marketplace, campañas de marketing ni IA en el alcance inicial.
4. **El motor de disponibilidad es el producto real** (buffers, solapes, concurrencia, excepciones, etc.).
5. **WhatsApp como diferenciador chileno**, sin reinventar WhatsApp: confirmaciones y recordatorios.
6. **Pagos / depósitos modulares**, no desde el día 0 si no hace falta.

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

#### Administrador

- [ ] Login
- [ ] Negocio: nombre, logo, descripción, teléfono, email, dirección, redes, zona horaria
- [ ] Servicios: nombre, duración, precio, profesionales asignados, color, descripción, tiempo de preparación, buffer posterior
- [ ] Profesionales: horarios, días libres, vacaciones, servicios, agenda propia
- [ ] Disponibilidad: bloques por día + excepciones (feriados / días especiales)
- [ ] Calendario de citas
- [ ] Gestión de citas (crear, ver, estados)
- [ ] Clientes: ficha simple (contacto, historial de citas, total gastado, notas)
- [ ] Configuración básica

#### Cliente (página pública)

- [ ] URL pública tipo `misitio.cl/mi-negocio` (o subdominio)
- [ ] Elegir servicio
- [ ] Elegir profesional
- [ ] Elegir fecha y hora (slots calculados)
- [ ] Datos: nombre, teléfono, email
- [ ] Confirmar reserva **sin crear cuenta**
- [ ] Cancelar desde email/link
- [ ] Reprogramar desde email/link

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
- [ ] Horarios por profesional
- [ ] Feriados, vacaciones, bloqueos, excepciones
- [ ] Concurrencia y prevención de doble reserva
- [ ] Zonas horarias
- [ ] Cancelaciones y reprogramaciones que liberan slots

#### Dashboard (simple)

- [ ] Resumen del día: citas, ingresos estimados, estados (confirmadas / atendidas / canceladas / pendientes)
- [ ] Lista de próximas citas

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
