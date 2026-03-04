# Aktivo — Roadmap de Desarrollo

## Vision
Plataforma de crecimiento para negocios de servicios. Empieza como sistema de turnos (MVP: barberias/salones) y evoluciona hacia CRM, loyalty, analytics y multicanal.

---

## Sprint 0 — Foundation (Semana 1-2) ✅
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

## Sprint 1 — Landing + Booking Flow (Semana 3-4)
- [ ] Landing page con GSAP: hero, features, pricing, testimonials, CTA
- [ ] Business public profile page (`/[slug]`)
- [ ] Booking wizard (5 pasos): servicio -> staff -> fecha/hora -> info -> confirmacion
- [ ] Availability engine integrado con API routes
- [ ] Time slot picker con calendario y grilla
- [ ] Service cards, staff cards con glassmorphism
- [ ] API: POST /api/appointments, GET /api/appointments/availability
- [ ] API: GET /api/services, GET /api/staff

## Sprint 2 — Dashboard Core (Semana 5-6)
- [ ] Dashboard home: KPIs reales desde DB, charts con Recharts
- [ ] Analytics API (scope por negocio)
- [ ] Gestion de turnos: tabla con filtros, busqueda, bulk actions
- [ ] Calendar views: dia (timeline), semana (grid), mes
- [ ] Dialog de creacion manual de turno
- [ ] Status updates (confirmar, cancelar, completar, no-show)

## Sprint 3 — Services & Staff (Semana 7-8)
- [ ] CRUD servicios: crear/editar/borrar, upload imagen con Cloudinary, categorias, drag-to-reorder
- [ ] CRUD staff: perfil, foto, bio, asignacion de servicios
- [ ] Gestion de horarios: working hours editor, blocked dates calendar, recurring blocks, overrides
- [ ] Visualizacion de grilla de slots en tiempo real

## Sprint 4 — Payments & Notifications (Semana 9-10)
- [ ] MercadoPago: config per-business, 3 modos, webhook handler, preference creation
- [ ] UI de configuracion de pagos en el dashboard
- [ ] WhatsApp (Twilio): mensajes templated por tipo, sandbox testing
- [ ] Email (Resend): templates HTML con branding del negocio
- [ ] Preferencias de notificacion per-business
- [ ] Pagina de confirmacion post-booking con resumen

## Sprint 5 — Clients & Settings (Semana 11-12)
- [ ] Lista de clientes con busqueda, filtros, sort, paginacion
- [ ] Detalle de cliente: historial de turnos, gasto total, info de contacto
- [ ] Gestion de guest clients (merge duplicados, conversion a usuario)
- [ ] Settings del negocio: perfil, branding, colores personalizados
- [ ] Onboarding wizard (5 pasos para negocios nuevos)
- [ ] Visor de audit logs con filtros

## Sprint 6 — Polish & Launch (Semana 13-14)
- [ ] Rate limiting en todos los endpoints de mutacion
- [ ] SEO: structured data (JSON-LD), meta tags dinamicos, OG images, sitemap.xml
- [ ] Error boundaries, pagina 404 custom, error pages
- [ ] PWA basics (manifest.json, offline indicator)
- [ ] Performance: lazy loading, code splitting, image optimization
- [ ] Accesibilidad (WCAG 2.1 AA): keyboard nav, screen readers, contrast
- [ ] Tests: unit tests de availability engine, integration tests de booking flow
- [ ] Deploy a Vercel con variables de entorno

---

## Fase 2 — Growth (Post-MVP, 12 semanas)
- CRM integrado con segmentacion y tags
- Smart scheduling: sugerencias basadas en historial
- Campanas automaticas (cumpleanos, re-booking, inactividad)
- Sistema de reviews post-visita
- No-show tracking con penalizacion automatica
- Widget embebible para sitios externos
- Multi-sucursal: un owner, multiples locations
- Analytics avanzados: retention, LTV, peak hours

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
| Fonts | Space Grotesk (headings) + Inter (body) |

## Arquitectura
- **Multi-Tenant:** Slug-based routing, all queries scoped by businessId
- **Auth:** NextAuth v5 con JWT, 6 roles, RBAC granular
- **Pagos:** MercadoPago per-business con 3 modos (full, percentage, fixed)
- **Design:** Dark mode default, glassmorphism, GSAP animations, per-business theming
