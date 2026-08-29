# Jiku — Roadmap de Desarrollo

## Vision
Plataforma de crecimiento para negocios de servicios. Empieza como sistema de turnos (MVP: barberias/salones) y evoluciona hacia CRM, loyalty, analytics y multicanal.

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
- [x] Cloudinary config
- [x] Design system tokens en globals.css
- [x] GSAP provider + animation presets
- [x] Seed script con datos demo de barberia
- [x] RBAC con 6 roles y permisos granulares
- [x] Lib utilities: availability engine, rate limiting, audit logging
- [x] Notifications: WhatsApp (Meta Cloud API) + Email (Resend) multi-tenant
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
- [x] Dashboard home: KPIs reales desde DB, charts con Recharts
- [x] Analytics API (scope por negocio)
- [x] Gestion de turnos: tabla con filtros, busqueda, bulk actions
- [x] Calendar views: dia (timeline), semana (grid), mes
- [x] Dialog de creacion manual de turno
- [x] Status updates (confirmar, cancelar, completar, no-show)

### Sprint 3 — Services & Staff (Semana 7-8) ✅
- [x] CRUD servicios: crear/editar/borrar, upload imagen con Cloudinary, categorias, drag-to-reorder
- [x] CRUD staff: perfil, foto, bio, asignacion de servicios
- [x] Gestion de horarios: working hours editor, blocked dates calendar, recurring blocks, overrides
- [x] Visualizacion de grilla de slots en tiempo real

### Sprint 4 — Payments & Notifications (Semana 9-10) ✅
- [x] MercadoPago: config per-business, 3 modos, webhook handler, preference creation
- [x] UI de configuracion de pagos en el dashboard
- [x] WhatsApp (Meta Cloud API): mensajes templated por tipo, verificación de firma
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
- [x] Flujo automático: turno COMPLETED → crear ReviewToken → enviar email/WhatsApp
- [x] Delay configurable para solicitud de reviews (reviewRequestDelayHours)
- [x] Filtro de clientes por tags en la lista de clientes
- [x] Dashboard de gestión de reseñas (aprobar/ocultar/responder)
- [x] Página pública de review (`/review/[token]`)
- [x] Nuevos permisos RBAC: `clients:tags`, `reviews:read`, `reviews:manage`

### Sprint 8 — Smart Scheduling + No-Show Tracking + Campaigns ✅
- [x] Sugerencias inteligentes de slots basadas en historial del cliente
- [x] Tracking de no-shows con penalizaciones automáticas (bloqueo temporal)
- [x] Configuración de umbral de no-shows y días de penalización
- [x] Auto-marcado de no-shows (cron cada 15 min)
- [x] Campañas automáticas: BIRTHDAY, REBOOKING, INACTIVITY, CUSTOM
- [x] Segmentación de campañas por tags de clientes
- [x] Templates de mensajes con interpolación de variables
- [x] Log de ejecución de campañas por destinatario
- [x] Perfil de cliente con fecha de cumpleaños
- [x] Cron jobs: ejecución de campañas (diario), auto no-show (15 min), review requests (horario)
- [x] Nuevos permisos RBAC: `campaigns:read`, `campaigns:manage`, `noshow:read`, `noshow:manage`

### Sprint 9 — Multi-Sucursal (Multi-Location) ✅
- [x] Modelo BusinessGroup: entidad paraguas con owner, nombre, logo
- [x] Campo groupId (nullable) en Business — backward compatible
- [x] Staff compartido entre sucursales (mismo User, diferente StaffMember por Business)
- [x] Location switcher en la topbar (solo visible con grupo)
- [x] Gestión de sucursales: CRUD de locations dentro del grupo
- [x] Reportes cross-location: métricas agregadas de todas las sucursales
- [x] Sesión con getSessionGroup() y availableBusinesses en JWT
- [x] Nuevos permisos RBAC: `group:read`, `group:manage`, `group:reports`

### Sprint 10 — Embeddable Widget + Advanced Analytics ✅
- [x] Widget embebible: `<script>` tag que crea botón flotante → abre iframe de booking
- [x] Configuración de widget: habilitado, tema, posición
- [x] Endpoint público CORS-enabled para config del widget
- [x] Booking flow simplificado para iframe (`/embed/[businessSlug]`)
- [x] Analytics avanzados: retention mensual, LTV, peak hours heatmap, churn
- [x] Snapshots diarios de métricas (materialización en tabla AnalyticsSnapshot)
- [x] Cron de snapshot de analytics (diario)
- [x] Dashboard de analytics con tabs y gráficos interactivos
- [x] Nuevos permisos RBAC: `analytics:read`, `widget:manage`

### Dependencias entre Sprints
```
Sprint 7 (CRM + Reviews)
    ↓
Sprint 8 (Campaigns + No-Show + Smart Scheduling)
    ↓  ← Campaigns usan tags del Sprint 7 para segmentación
Sprint 9 (Multi-Location)
    ↓  ← Schema independiente, pero analytics necesitan awareness de location
Sprint 10 (Widget + Analytics)
       ← Widget reutiliza componentes de booking, Analytics lee datos acumulados
```

---

## Estado técnico

Lo que hay hoy, más allá de las funcionalidades:

- **Integridad de reservas** garantizada en la base con una constraint de
  exclusión; el perdedor de una carrera recibe 409 `SLOT_TAKEN`. Las reservas
  impagas expiran y un cron las libera.
- **Configuración validada al arrancar** (`src/lib/env.ts`): el deploy falla si
  falta algo, en vez de degradar en silencio.
- **Logging estructurado** en JSON (`src/lib/logger.ts`) y `/api/health`.
- **Los seis crons corren solos** (`vercel.json`), autenticados por header.
- **Envíos que no se pierden**: `after()` para el trabajo en segundo plano,
  reintentos con backoff, y un job que reprocesa lo que quedó fallido.
- **CI** en GitHub Actions: tipos, lint, tests unitarios y build.
- **Tests**: ~100 unitarios y ~80 end-to-end, incluidos doble reserva
  concurrente, flujo completo de reserva, widget y accesibilidad.

### Pendiente

- Migrar `mercadopago` de 2.x a 3.x (cierra las últimas vulnerabilidades de
  `npm audit`; conviene hacerlo probando contra la API real).
- Panel en Server Components: hoy casi todo el panel es cliente + SWR.
- Sentry u otro agregador de errores.
- Tokens semánticos de color para que el white-label por negocio alcance a toda
  la interfaz.

---

## Fase 3 — Premium (16 semanas)
- Loyalty program con puntos y niveles
- Instagram integration (booking desde perfil)
- Google Maps booking button
- Membresías y paquetes de servicios
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
| Imagenes | Cloudinary + next-cloudinary |
| Pagos | MercadoPago |
| WhatsApp | Meta Cloud API |
| Email | Resend |
| Validacion | Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Sora (headings) + Cormorant Garamond (display) + IBM Plex Mono (mono) |

## Arquitectura
- **Multi-Tenant:** Slug-based routing, all queries scoped by businessId
- **Auth:** NextAuth v5 con JWT, 6 roles, RBAC granular
- **Pagos:** MercadoPago per-business con 3 modos (full, percentage, fixed)
- **Design:** Dark mode default, jade green palette, glassmorphism, GSAP animations, per-business theming
- **Migration Strategy:** Additive Prisma migrations (new tables + nullable columns). Zero downtime. No destructive changes.
