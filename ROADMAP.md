# Jiku — Roadmap de Desarrollo

## Vision
Plataforma de crecimiento para negocios de servicios. Empieza como sistema de
turnos (MVP: barberías/salones) y evoluciona hacia CRM, cobros y fidelización.

---

## Fase 1 — MVP (Sprints 0-6) ✅

### Sprint 0 — Foundation (Semana 1-2) ✅
- [x] Inicializar proyecto Next.js 16 + TypeScript
- [x] Configurar Tailwind v4, shadcn/ui, GSAP
- [x] Schema Prisma completo (18 modelos, multi-tenant)
- [x] Auth (NextAuth v5: Google + Credentials)
- [x] Proxy (slug routing + auth protection) — `src/proxy.ts`
- [x] Layout base (sidebar, topbar, mobile-nav)
- [x] Zustand stores (ui-store, booking-store)
- [x] Subida de imágenes (Cloudinary; hoy es Vercel Blob)
- [x] Design system tokens en globals.css
- [x] GSAP provider + animation presets
- [x] Seed script con datos demo de barberia
- [x] RBAC con 6 roles y permisos granulares
- [x] Lib utilities: availability engine, rate limiting, audit logging
- [x] Notifications: Email (Resend) multi-tenant
- [x] MercadoPago integration multi-business
- [x] Zod validations

### Sprint 1 — Landing + Booking Flow (Semana 3-4) ✅
- [x] Landing page con GSAP: hero, features, pricing, testimonials, CTA
- [x] Business public profile page (`/[slug]`)
- [x] Booking wizard (5 pasos): servicio -> staff -> fecha/hora -> info -> confirmacion
- [x] Availability engine integrado con API routes
- [x] Time slot picker con calendario y grilla
- [x] Service cards, staff cards con glassmorphism
- [x] API: POST /api/appointments, GET /api/appointments/availability
- [x] API: GET /api/services, GET /api/staff

### Sprint 2 — Dashboard Core (Semana 5-6) ✅
- [x] Dashboard home: KPIs reales desde DB y gráficos (Recharts; hoy dibujados a mano, sin librería)
- [x] Analytics API (scope por negocio; absorbida por Reportes, ver Sprint 10)
- [x] Gestion de turnos: tabla con filtros, busqueda, bulk actions
- [x] Calendar views: dia (timeline), semana (grid), mes
- [x] Dialog de creacion manual de turno
- [x] Status updates (confirmar, cancelar, completar, no-show)

### Sprint 3 — Services & Staff (Semana 7-8) ✅
- [x] CRUD servicios: crear/editar/borrar, upload de imagen, categorías, drag-to-reorder
- [x] CRUD staff: perfil, foto, bio, asignacion de servicios
- [x] Gestion de horarios: working hours editor, blocked dates calendar, recurring blocks, overrides
- [x] Visualizacion de grilla de slots en tiempo real

### Sprint 4 — Payments & Notifications (Semana 9-10) ✅
- [x] MercadoPago: config per-business, 3 modos, webhook handler, preference creation
- [x] UI de configuracion de pagos en el dashboard
- [x] Email (Resend): templates HTML con branding del negocio
- [x] Preferencias de notificacion per-business
- [x] Pagina de confirmacion post-booking con resumen

### Sprint 5 — Clients & Settings (Semana 11-12) ✅
- [x] Lista de clientes con busqueda, filtros, sort, paginacion
- [x] Detalle de cliente: historial de turnos, gasto total, info de contacto
- [x] Gestion de guest clients (merge duplicados, conversion a usuario)
- [x] Settings del negocio: perfil, branding, colores personalizados
- [x] Onboarding wizard (5 pasos para negocios nuevos)
- [x] Visor de audit logs con filtros

### Sprint 6 — Polish & Launch (Semana 13-14) ✅
- [x] Rate limiting en todos los endpoints de mutacion
- [x] SEO: structured data (JSON-LD), meta tags dinamicos, OG images, sitemap.xml
- [x] Error boundaries, pagina 404 custom, error pages
- [x] PWA basics (manifest.json, offline indicator)
- [x] Performance: lazy loading, code splitting, image optimization
- [x] Accesibilidad (WCAG 2.1 AA): keyboard nav, screen readers, contrast
- [x] Tests: unitarios del motor de disponibilidad y e2e del flujo de reserva
- [x] Deploy a Vercel con variables de entorno

> **Nota:** Sprint 6 completo.

---

## Fase 2 — Growth (Sprints 7-10) ✅

### Sprint 7 — CRM Enhancements + Reviews System ✅
- [x] Tags de clientes: CRUD per-business con nombre + color
- [x] Asignacion polimorfica de tags (usuarios registrados y guest clients)
- [x] Notas de staff sobre clientes
- [x] Sistema de reviews (1-5 estrellas + comentario, vinculado a turno)
- [x] Review tokens con links tokenizados y expiración de 7 días
- [x] Flujo automático: turno COMPLETED → crear ReviewToken → enviar email
- [x] Delay configurable para solicitud de reviews (reviewRequestDelayHours)
- [x] Filtro de clientes por tags en la lista de clientes
- [x] Dashboard de gestión de reseñas (aprobar/ocultar/responder)
- [x] Página pública de review (`/review/[token]`)
- [x] Nuevos permisos RBAC: `clients:tags`, `reviews:read`, `reviews:manage`

### Sprint 8 — Smart Scheduling + No-Show Tracking ✅
- [x] Sugerencias inteligentes de slots basadas en historial del cliente
- [x] Tracking de no-shows con penalizaciones automáticas (bloqueo temporal)
- [x] Configuración de umbral de no-shows y días de penalización
- [x] Auto-marcado de no-shows
- [x] Perfil de cliente con fecha de cumpleaños
- [x] Nuevos permisos RBAC: `noshow:read`, `noshow:manage`
- [~] **Campañas — dadas de baja** (4 de septiembre de 2026). Automáticas por
  cumpleaños, recompra e inactividad, con segmentación por tags. Se sacaron
  enteras: rutas, componentes, endpoints, cron, permisos `campaigns:*` y las
  tablas `Campaign` y `CampaignExecution`. Lo que quedó para traer gente de
  vuelta son los cupones y los referidos.

### Sprint 9 — Multi-Sucursal (Multi-Location) ✅
- [x] Modelo BusinessGroup: entidad paraguas con owner, nombre, logo
- [x] Campo groupId (nullable) en Business — backward compatible
- [x] Staff compartido entre sucursales (mismo User, diferente StaffMember por Business)
- [x] Location switcher en la topbar (solo visible con grupo)
- [x] Gestión de sucursales: CRUD de locations dentro del grupo
- [x] Reportes cross-location: métricas agregadas de todas las sucursales
- [x] Sesión con getSessionGroup() y availableBusinesses en JWT
- [x] Nuevos permisos RBAC: `group:read`, `group:manage`, `group:reports`

### Sprint 10 — Widget embebible + Analytics ❌ dado de baja

Ambos se sacaron enteros el 4 de septiembre de 2026, con el rediseño. Queda
anotado porque el schema y los permisos los nombraban, y para que nadie los
busque:

- [~] **Widget embebible** — `<script>` con botón flotante e iframe de booking,
  su configuración (`widgetEnabled`, `widgetTheme`, `widgetPosition`), el
  endpoint público con CORS y el flujo `/embed/[businessSlug]`, que era una
  reimplementación paralela del de reserva. La web pública del local cumple la
  misma función y es una sola cosa que mantener.
- [~] **Analytics avanzados** — retención mensual, LTV, heatmap de horarios
  pico y churn, con snapshots diarios en `AnalyticsSnapshot` y su cron. Lo que
  valía la pena se absorbió en Reportes, que lee de las tablas de siempre.
- [~] Los permisos `analytics:read` y `widget:manage` ya no existen.

### Dependencias entre Sprints
```
Sprint 7 (CRM + Reviews)
    ↓
Sprint 8 (No-Show + Smart Scheduling)
    ↓
Sprint 9 (Multi-Location)
       ← Schema independiente del resto

Sprint 10 (Widget + Analytics) — dado de baja, ver arriba
```

---

## Estado técnico

En producción desde el 3 de septiembre de 2026 en **https://jikuapp.com**
(Vercel Hobby, cuenta personal; base Neon del marketplace, región São Paulo;
Upstash Redis para los límites de tasa).

Lo que hay hoy, más allá de las funcionalidades:

- **Integridad de reservas** garantizada en la base con una constraint de
  exclusión; el perdedor de una carrera recibe 409 `SLOT_TAKEN`. La constraint
  no puede ver el tiempo, así que las reservas impagas se liberan en el momento
  en que alguien intenta ocupar el slot (`releaseExpiredHolds`), no por reloj.
- **Configuración validada al arrancar** (`src/lib/env.ts`): el deploy falla si
  falta algo, en vez de degradar en silencio.
- **Logging estructurado** en JSON (`src/lib/logger.ts`) y `/api/health`.
- **El trabajo programado corre sin crons de Vercel**: lo dispara el tráfico
  real con un candado en base (`src/lib/jobs/tick.ts`). El cron diario de piso
  se sacó de `vercel.json` con el rediseño; queda el workflow de GitHub Actions
  cada diez minutos, que es el que sostiene el recordatorio de una hora antes
  —su ventana son 60 minutos y los primeros turnos del día caen cuando todavía
  no hay tráfico que dispare nada.
- **Envíos que no se pierden**: `after()` para el trabajo en segundo plano,
  reintentos con backoff, y un job que reprocesa lo que quedó fallido.
- **Cobro real**: dos planes en MercadoPago ($7.000 y $15.000 ARS), una semana
  de prueba por negocio y bloqueo de escritura del panel al vencer.
- **CI** en GitHub Actions: tipos, lint, tests unitarios y build.
- **Tests**: 231 unitarios y 101 end-to-end, incluidos doble reserva concurrente,
  flujo completo de reserva, accesibilidad, que el panel entre en un teléfono, y
  que los correos no vuelvan a romperse en silencio, más un humo contra el sitio
  desplegado (`e2e-prod/`).

### Sprint 11 — La cartera de turnos del cliente ✅

Hecho el 5 de septiembre de 2026. El cliente final —quien saca el turno, sin
local ni plan— no tenía producto: existían dos carteras de turnos y ninguna se
alcanzaba desde el recorrido real.

- [x] **Una sola identidad de cliente**, con el email como llave
  (`src/lib/client-identity.ts`). Antes eran dos mitades que no se hablaban:
  `GuestClient` (por negocio, buscado por teléfono) y `User` (con sesión).
  Reservar con sesión iniciada no creaba ninguna fila de invitado, así que el
  portal contestaba "No se encontraron turnos con este número" a alguien a
  quien nunca se le había pedido un número.
- [x] **`/mis-turnos`**: una cartera para todos los locales, con o sin cuenta.
  `/{negocio}/mis-turnos` redirige ahí, para que los correos ya enviados sigan
  andando.
- [x] **Sin códigos.** Reservar deja la sesión en el navegador; volver desde
  otro teléfono es un link en el correo. Nadie transcribe seis dígitos.
- [x] Header público compartido (`components/layout/public-header.tsx`), con la
  marca del local sobre su portada y sin nada de Jiku en marca blanca.
- [x] Salidas en la confirmación: cambiar el turno, volver al local, explorar.
- [x] Al reservar con sesión se pide el teléfono y queda en el perfil.
- [x] Alta de cuenta de cliente sin negocio (`/api/client/claim`), ofrecida
  después de reservar y nunca antes.
- [x] Los turnos reservados como invitado pasan a la cuenta al iniciar sesión
  con el mismo email.

De paso, arreglado en el camino:

- Reprogramar desde "Mi cuenta" **nunca funcionó**: el modal mandaba
  `newDateTime` y el endpoint leía `newDate` + `newTime`.
- El modal mostraba la fecha cruda en UTC (`2026-09-08T14:00:00.000Z`), tres
  horas corrida de la hora reservada.
- Los campos del formulario de reserva se renderizan dos veces —barra fija y
  columna— con los mismos `id`, así que cada `<label for>` apuntaba a dos.
- `GuestClient.phone` pasó a nullable: con `""` y el unique `(businessId,
  phone)`, el segundo cliente sin teléfono cargado a mano rompía con P2002.
- La dirección del local estaba al pie de un formulario largo y la nota de
  arriba mandaba a "Mi web", donde no está. Ahora abre la sección, dice para
  qué sirve y ofrece ver dónde cae el punto en el mapa.
- Lista de slugs reservados: un negocio llamado "Explorar" se quedaba sin
  página pública, porque una ruta estática le gana a `/[businessSlug]`.

### Sprint 12 — El alta de un negocio pregunta dónde queda ✅

Hecho el 5 de septiembre de 2026, mirando el otro lado del mismo recorrido.

- [x] El paso 1 del onboarding pide **dirección y ciudad**. No las pedía nunca,
  así que un local recién dado de alta salía publicado sin decir dónde está:
  sin mapa, sin dirección en el correo del turno, y fuera del directorio por
  ciudad —que se arma con `city`— aunque ya estuviera tomando reservas. Esa es
  la causa de que la dirección "no se encontrara": no faltaba la pantalla,
  faltaba que alguien la pidiera.
- [x] El número del alta se guarda también como `whatsapp`. El campo dice
  "Teléfono o WhatsApp" y se guardaba sólo como teléfono, así que el botón de
  WhatsApp de la página pública no aparecía nunca.
- [x] `scripts/e2e-cleanup.ts` borra también los negocios que la suite da de
  alta (`prueba-e2e-*`) y sus dueños. Sin eso, cada corrida deja uno publicado
  en el directorio y en el sitemap.

### Sprint 13 — El panel del dueño, mirado con un turno real adentro ✅

- [x] La campanita ya no se derrama por toda la pantalla: el viewport de
  `ScrollArea` es `h-full` y dentro de un padre sin altura no acota nada, así
  que la lista crecía con los ítems y se dibujaba encima del dashboard hasta el
  pie. Y dice lo que es —"Envíos a tus clientes"—, porque bajo el título
  "Notificaciones" se leía como avisos para el dueño y ninguno pide nada.
- [x] Los teléfonos se muestran legibles. `formatPhoneForDisplay` existía desde
  el principio y no se usaba en ninguna pantalla: el panel mostraba
  `+5492234999321` donde ahora dice `223 499-9321`.
- [x] Y esa función partía mal los códigos de área de cuatro dígitos: un número
  de Río Gallegos (2966) se leía como uno de Bahía Blanca (296). Los códigos de
  2, 3 y 4 dígitos no se distinguen por ninguna regla —el total es siempre
  diez—, así que ahora hay lista.

### Sprint 14 — El correo dice dónde queda el local ✅

- [x] La confirmación y los dos recordatorios llevan la dirección. Decían
  servicio, quién atiende, día y hora — y nada de a dónde ir, que es lo que
  hace falta para llegar y lo que la persona abre antes de salir de la casa. No
  va en la cancelación ni en el turno perdido, donde ya no hay a dónde ir.
- [x] Se resuelve en `sendNotification`, no en cada llamada: son siete los
  lugares que mandan una notificación y todos tienen el `businessId` a mano.
  `redelivery.ts` —el camino de los reintentos, que ya se quedó atrás una vez—
  se actualizó en el mismo commit.

### Sprint 15 — "Tus turnos de mañana" ✅

El dueño no recibía nada: la única notificación que salía por una reserva era la
del cliente, y un turno tomado a las once de la noche esperaba a que alguien
abriera el panel.

- [x] Un correo a la tarde con los turnos del día siguiente, en vez de un aviso
  por reserva: con diez turnos en un día bueno, lo segundo son diez correos que
  se terminan filtrando a una carpeta.
- [x] Sale a partir de las 19 en la hora del negocio, cuando la agenda de mañana
  ya está armada y todavía se está a tiempo de mover algo.
- [x] Un día sin turnos no manda nada. "Mañana no tenés turnos" todas las tardes
  es el correo que enseña a ignorar los correos.
- [x] Le llega a la cuenta que dio de alta el negocio, con el correo del local
  como respaldo: el público puede ser un buzón que nadie abre.
- [x] `dailyDigestSentFor` se reserva **antes** de mandar. El trabajo es
  oportunista —lo dispara el tráfico real— así que corre muchas veces por tarde;
  sin eso, cada visita al sitio entre las siete y la medianoche sería otro correo
  igual.
- [x] Se apaga desde Configuración → Recordatorios y envíos.

### Sprint 16 — Gastar menos, y el modal del mostrador ✅

- [x] **Nada se podaba.** Ni `Notification` ni `AuditLog` se limpiaban nunca, y
  las dos crecen con el uso: un negocio con diez turnos por día produce unas mil
  notificaciones por mes —confirmación, dos recordatorios y el pedido de
  reseña— y una fila de auditoría por cada cosa que se toca en el panel. En una
  base que se paga por almacenamiento eso es plata por filas que nadie vuelve a
  leer. Hay un trabajo diario (`src/lib/jobs/purge.ts`): 60 días de envíos, 180
  de auditoría, y los códigos de acceso a las 24 horas.
- [x] Con índice por `createdAt` en las dos tablas. Los que había lo tienen como
  segunda columna, así que el barrido diario habría leído la tabla entera.
- [x] **El modal de cargar un turno, reordenado.** Empezaba por el cliente —con
  un buscador y tres campos de alta abiertos a la vez, sin que quedara claro si
  había que buscar o cargar— y recién abajo preguntaba el servicio, del que
  dependen los horarios: se llenaba la ficha de la persona antes de saber si
  quedaba lugar. Ahora va en el orden de la conversación real: qué, cuándo, para
  quién, y cada paso aparece cuando el anterior está resuelto.
- [x] Y consulta menos: el personal se pide sólo cuando ya hay servicio elegido,
  las listas casi estáticas se cachean media hora, la búsqueda de clientes
  arranca en tres letras y la grilla de horarios conserva la anterior mientras
  llega la nueva.

### Pendiente

- **Sin Google sign-in**: falta cargar las credenciales; hoy es sólo email y
  contraseña.
- **Sin tracker de errores**. Un 500 escribe una línea en los logs de Vercel,
  que se retienen poco y no alertan a nadie.
- **Notificaciones sólo por email**. WhatsApp se sacó porque exigía plantillas
  aprobadas por Meta; volver a sumarlo significa redactarlas, aprobarlas y
  escribir los mensajes como `type: "template"`.
- Migrar `mercadopago` de 2.x a 3.x (cierra las últimas vulnerabilidades de
  `npm audit`; conviene hacerlo probando contra la API real).
- Panel en Server Components: hoy casi todo el panel es cliente + SWR.
- Tokens semánticos de color para que el white-label por negocio alcance a toda
  la interfaz.

---

## Fase 3 — Premium (16 semanas)
- Loyalty program con puntos y niveles
- Instagram integration (booking desde perfil)
- Google Maps booking button
- App nativa para staff (React Native)
- Prediccion de no-shows con ML
- Insights con AI (recomendaciones automaticas)
- Multiples medios de pago (crypto, transferencia)
- API publica para integraciones de terceros

---

## Tech Stack
| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind v4 + shadcn/ui + GSAP |
| DB | PostgreSQL (Neon DB) + Prisma 7 |
| Auth | NextAuth v5 (Google + Credentials) |
| State | Zustand + SWR |
| Imagenes | Vercel Blob (comprimidas en el navegador) |
| Pagos | MercadoPago |
| Email | Resend |
| Validacion | Zod |
| Icons | Lucide React |
| Fonts | Sora (headings) + Cormorant Garamond (display) + IBM Plex Mono (mono) |

## Arquitectura
- **Multi-Tenant:** Slug-based routing, all queries scoped by businessId
- **Auth:** NextAuth v5 con JWT, 6 roles, RBAC granular
- **Pagos:** MercadoPago per-business con 3 modos (full, percentage, fixed)
- **Design:** Dark mode default, jade green palette, glassmorphism, GSAP animations, per-business theming
- **Migration Strategy:** Additive Prisma migrations (new tables + nullable columns). Zero downtime. No destructive changes.
