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
- [x] Middleware (slug routing + auth protection)
- [x] Layout base (sidebar, topbar, mobile-nav)
- [x] Zustand stores (ui-store, booking-store)
- [x] Cloudinary config
- [x] Design system tokens en globals.css
- [x] GSAP provider + animation presets
- [x] Seed script con datos demo de barberia
- [x] RBAC con 6 roles y permisos granulares
- [x] Lib utilities: availability engine, rate limiting, audit logging
- [x] Notifications: WhatsApp (Twilio) + Email (Resend) multi-tenant
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
- [x] WhatsApp (Twilio): mensajes templated por tipo, sandbox testing
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
- [ ] Tests: unit tests de availability engine, integration tests de booking flow ⚠️ *Pendiente*
- [x] Deploy a Vercel con variables de entorno

> **Nota:** Sprint 6 ~95% completo — tests aún pendientes.

---

## Fase 2 — Growth (Sprints 7-10)

### Sprint 7 — CRM Enhancements + Reviews System
- [ ] Tags de clientes: CRUD per-business con nombre + color
- [ ] Asignacion polimorfica de tags (usuarios registrados y guest clients)
- [ ] Notas de staff sobre clientes
- [ ] Sistema de reviews (1-5 estrellas + comentario, vinculado a turno)
- [ ] Review tokens con links tokenizados y expiración de 7 días
- [ ] Flujo automático: turno COMPLETED → crear ReviewToken → enviar email/WhatsApp
- [ ] Delay configurable para solicitud de reviews (reviewRequestDelayHours)
- [ ] Filtro de clientes por tags en la lista de clientes
- [ ] Dashboard de gestión de reseñas (aprobar/ocultar/responder)
- [ ] Página pública de review (`/review/[token]`)
- [ ] Nuevos permisos RBAC: `clients:tags`, `reviews:read`, `reviews:manage`

### Sprint 8 — Smart Scheduling + No-Show Tracking + Campaigns
- [ ] Sugerencias inteligentes de slots basadas en historial del cliente
- [ ] Tracking de no-shows con penalizaciones automáticas (bloqueo temporal)
- [ ] Configuración de umbral de no-shows y días de penalización
- [ ] Auto-marcado de no-shows (cron cada 15 min)
- [ ] Campañas automáticas: BIRTHDAY, REBOOKING, INACTIVITY, CUSTOM
- [ ] Segmentación de campañas por tags de clientes
- [ ] Templates de mensajes con interpolación de variables
- [ ] Log de ejecución de campañas por destinatario
- [ ] Perfil de cliente con fecha de cumpleaños
- [ ] Cron jobs: ejecución de campañas (diario), auto no-show (15 min), review requests (horario)
- [ ] Nuevos permisos RBAC: `campaigns:read`, `campaigns:manage`, `noshow:read`, `noshow:manage`

### Sprint 9 — Multi-Sucursal (Multi-Location)
- [ ] Modelo BusinessGroup: entidad paraguas con owner, nombre, logo
- [ ] Campo groupId (nullable) en Business — backward compatible
- [ ] Staff compartido entre sucursales (mismo User, diferente StaffMember por Business)
- [ ] Location switcher en la topbar (solo visible con grupo)
- [ ] Gestión de sucursales: CRUD de locations dentro del grupo
- [ ] Reportes cross-location: métricas agregadas de todas las sucursales
- [ ] Sesión con getSessionGroup() y availableBusinesses en JWT
- [ ] Nuevos permisos RBAC: `group:read`, `group:manage`, `group:reports`

### Sprint 10 — Embeddable Widget + Advanced Analytics
- [ ] Widget embebible: `<script>` tag que crea botón flotante → abre iframe de booking
- [ ] Configuración de widget: habilitado, tema, posición
- [ ] Endpoint público CORS-enabled para config del widget
- [ ] Booking flow simplificado para iframe (`/embed/[businessSlug]`)
- [ ] Analytics avanzados: retention mensual, LTV, peak hours heatmap, churn
- [ ] Snapshots diarios de métricas (materialización en tabla AnalyticsSnapshot)
- [ ] Cron de snapshot de analytics (diario)
- [ ] Dashboard de analytics con tabs y gráficos interactivos
- [ ] Nuevos permisos RBAC: `analytics:read`, `widget:manage`

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
| WhatsApp | Twilio |
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
