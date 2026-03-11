# Jiku App - Full E2E Test Findings

**Date:** 2026-03-11
**Tester:** Claude (Playwright MCP)
**DB State:** Fresh registration (Nahuel Test / nahuel@test.com)

### Summary
| Category | Count |
|----------|-------|
| Critical Bugs | 2 (1 fixed) |
| Bugs | 17 |
| Spanish Accent/i18n Issues | 70+ instances across 15+ pages |
| Improvements | 9 |
| Pages Tested | 30+ |
| Flows Tested | Registration, Onboarding, Booking, Status Change, Account |

---

## CRITICAL BUGS

### 1. Booking fails with 500 — Prisma client out of sync with schema
- **Route:** `POST /api/appointments`
- **Errors:**
  1. `Unknown field 'googleCalendarEnabled' for select on StaffMember` (line 87)
  2. `Unknown argument 'recurrenceGroupId'` on Appointment.create (line 126)
- **Root Cause:** The Prisma client (`src/generated/prisma/`) was not regenerated after schema changes. Multiple fields exist in `prisma/schema.prisma` but the compiled client didn't know about them.
- **Impact:** **ALL bookings are broken.** No appointments can be created by anyone.
- **Fix applied:**
  1. Ran `npx prisma generate` — regenerated client successfully
  2. Disabled Google Calendar integration temporarily (per user request)
  3. **Dev server must be restarted** for Turbopack to pick up the new Prisma client
- **Status:** ✅ FIXED & VERIFIED — Server restarted, booking now works end-to-end

### 2. No error feedback on booking failure
- **Route:** Booking wizard step 5 (confirm)
- **Behavior:** When the 500 error occurs, a small toast shows "Error interno" but the button silently goes back to "Confirmar turno". There's no actionable message for the user.
- **File:** `src/components/booking/step-confirm.tsx:104-106`
- **Fix:** Show a more descriptive error or suggest retrying/contacting the business.

---

## BUGS

### 3. Font loading errors (4 Google Fonts 404)
- **Scope:** All pages
- **Error:** Multiple `.woff2` files from Google Fonts return 404 (Sora font family)
- **Impact:** Text may fall back to system fonts. Visual inconsistency.
- **Fix:** Check the font import in `src/app/layout.tsx` — Sora font subset/unicode-range may be misconfigured.

### 4. Favicon.svg returns 404
- **Scope:** All pages
- **Error:** `GET /favicon.svg` → 404. The file `public/favicon.svg` was deleted (git status shows `D public/favicon.svg`, `D src/app/favicon.ico`).
- **Impact:** Browser console error on every page load, broken tab icon.
- **Fix:** Either restore the favicon or update the manifest/layout to reference the new logo files (`public/jiku-logo.png` or `public/jiku-logo.svg`).

### 5. "Miercoleshoy" — day name concatenated with "hoy" badge
- **Page:** Business profile page (`/{slug}`)
- **Text:** "Miercoleshoy" instead of "Miércoles" with a separate "hoy" badge
- **File:** `src/components/booking/business-profile.tsx`
- **Fix:** Add a space or render "hoy" as a separate element.

### 6. Date format is raw ISO on booking confirmation
- **Page:** Booking wizard step 5
- **Text:** "2026-03-12 a las 10:00" instead of "Jueves 12 de marzo a las 10:00"
- **File:** `src/components/booking/step-confirm.tsx:169` — uses `{store.date} a las {store.time}`
- **Fix:** Format the date using `date-fns/format` with locale `es`.

### 7. Duplicate "Jiku" in page titles
- **Pages affected:** Reseñas, Campañas, Sucursales, Analytics (all show "X | Jiku | Jiku")
- **Fix:** Check the metadata generation in those page.tsx files — likely double-appending the app name.

### 8. Equipo page has generic page title
- **Page:** `/panel/equipo`
- **Title:** "Jiku - Plataforma de Crecimiento para Negocios de Servicios" instead of "Equipo | Jiku"
- **Fix:** Add proper metadata export in `/panel/equipo/page.tsx`.

### 9. API error on Sucursales page
- **Page:** `/panel/sucursales`
- **Error:** `GET /api/panel/group/reports?range=30d` returns error (likely 404 or 500)
- **Impact:** Console error, potential data not loading.

### 10. React key warning in Audit Log
- **Page:** `/panel/audit`
- **Error:** "Each child in a list should have a unique key prop"
- **Fix:** Add unique `key` prop to list items in the audit log component.

### 11. Chart width/height warnings on Dashboard
- **Page:** `/panel` (Dashboard home)
- **Warning:** "The width(-1) and height(-1) of chart should be positive" (Recharts)
- **Impact:** Charts may not render correctly on initial load.
- **Fix:** Ensure chart container has explicit dimensions or use `ResponsiveContainer` correctly.

### 12. Calendar navigation buttons in English
- **Page:** Booking wizard step 3 (date selection)
- **Text:** "Go to the Previous Month", "Go to the Next Month", "Today" — all in English
- **Fix:** Configure the date picker component (react-day-picker?) with Spanish locale/labels.

### 13. Activity feed shows raw action codes instead of translated verbs
- **Page:** `/panel` (Dashboard home)
- **Text:** "Nahuel Test **completed** un turno" (English verb), "Nahuel Test **CREATE** un turno" (raw action code)
- **Expected:** "completó un turno", "creó un turno"
- **Fix:** Map all action codes to proper Spanish past-tense verbs in the activity feed component.

### 14. Booking confirmation page missing appointment details
- **Page:** `/{slug}/reservar/confirmacion`
- **Issue:** Only shows "Turno confirmado!" + "Tu turno fue reservado exitosamente". Does NOT show the date, time, service, staff, or business info.
- **Fix:** Pass appointment data to the confirmation page and display a summary card.

### 15. "Turno confirmado!" missing opening exclamation mark
- **Page:** `/{slug}/reservar/confirmacion`
- **Text:** "Turno confirmado!" → "¡Turno confirmado!"

### 16. 404 page title says "Negocio no encontrado" for any invalid URL
- **Page:** Any non-existent route (e.g., `/this-does-not-exist`)
- **Title:** "Negocio no encontrado | Jiku" — treats all unknown paths as business slug lookups
- **Fix:** Use generic "Página no encontrada | Jiku" title for the 404 page.

### 17. 404 page text missing accents
- **Page:** 404 page
- **Text:** "Pagina no encontrada" → "Página no encontrada", "La pagina que buscas" → "La página que buscás"

---

## SPANISH ACCENT / i18n ISSUES

Pervasive missing accents (tildes) and Spanish punctuation across the entire app. This affects professionalism for an Argentine market product.

### Registration page (`/registrarse`)
- "Empeza a gestionar" → "Empezá a gestionar"
- "Contrasena" → "Contraseña" (×2)
- "Ya tenes cuenta?" → "¿Ya tenés cuenta?"
- "Inicia sesion" → "Iniciá sesión"
- "o continua con" → "o continuá con"

### Onboarding (`/panel/bienvenida`)
- "Descripcion del negocio" → "Descripción"
- "Telefono" → "Teléfono"
- "Duracion (min)" → "Duración"
- "Listo!" → "¡Listo!"
- "Tu negocio esta configurado" → "está"
- "Tu negocio esta listo!" → "está"
- "Ya podes" → "Ya podés"

### Dashboard (`/panel`)
- "Tasa de ocupacion" → "ocupación"
- "Turnos por dia" → "día"
- "Proximos turnos" → "Próximos"
- "No hay turnos proximos" → "próximos"
- Activity feed: "creo un profesional" → "creó", "creo un servicio" → "creó", "actualizo" → "actualizó"

### Sidebar (all pages)
- "Configuracion" → "Configuración"

### Turnos (`/panel/turnos`)
- "Gestion de Turnos" → "Gestión"
- "No asistio" filter → "No asistió"

### Calendario (`/panel/calendario`)
- "Vista de calendario dia, semana y mes" → "día"
- "Dia" button → "Día"
- "Mie" → "Mié"
- "Sab" → "Sáb"

### Servicios (`/panel/servicios`)
- "Nueva categoria" → "categoría"
- "Sin categoria" → "Sin categoría"

### Horarios (`/panel/horarios`)
- "horarios de atencion" → "atención" (×2)
- "Miercoles" → "Miércoles"
- "Sabado" → "Sábado"
- "Dia" → "Día"

### Clientes (`/panel/clientes`)
- "telefono" → "teléfono" (search + column header)
- "Ultimo turno" → "Último"

### Pagos (`/panel/pagos`)
- "Configuracion de pagos" → "Configuración"
- "como sena" → "como seña" (×2)
- "Politica de cancelacion" → "Política de cancelación" (+ placeholder)
- "Obtene tu token" → "Obtené"
- "Guardar configuracion" → "configuración"

### Notificaciones (`/panel/notificaciones`)
- "configuracion de notificaciones" → "configuración"

### Reportes (`/panel/reportes`)
- "Analisis y metricas" → "Análisis y métricas"
- "7 dias" / "30 dias" / "90 dias" → "días" (×3)
- "Ultimos 30 dias" → "Últimos 30 días"
- "Clientes unicos" → "únicos"
- "este periodo" → "período" (×2)

### Configuración (`/panel/configuracion`)
- "Descripcion" → "Descripción"
- "Telefono" → "Teléfono"
- "Direccion" → "Dirección"
- "Configuracion de turnos" → "Configuración"
- "Anticipacion minima" → "Anticipación mínima"
- "Dias de anticipacion max" → "Días de anticipación máx."
- "Guardar configuracion" → "configuración"

### Widget (`/panel/widget`)
- "boton de reservas" → "botón"

### Audit Log (`/panel/audit`)
- "Accion" → "Acción" (column + filter)
- "Audit Log" → should be "Registro de Auditoría" for consistency

### Booking wizard
- "Confirmacion" step label → "Confirmación"
- "quien te atendera" → "quién te atenderá"
- "cuando queres tu turno" → "cuándo querés"
- "Repetir este turno?" → "¿Repetir este turno?"
- "Podes cancelar" → "Podés"

### Business profile (`/{slug}`)
- "Conoce mas" → "Conocé más"
- "Sabado" → "Sábado"

### User menu
- "Cerrar sesion" → "Cerrar sesión"

### Mi cuenta — Perfil (`/mi-cuenta/perfil`)
- "Administra tu informacion personal" → "Administrá tu información personal"
- "Telefono" → "Teléfono"

### Mi cuenta — Seguridad (`/mi-cuenta/seguridad`)
- "Cambia tu contrasena" → "Cambiá tu contraseña"
- "Contrasena actual" → "Contraseña actual"
- "Nueva contrasena" → "Nueva contraseña"
- "Confirmar nueva contrasena" → "Confirmar nueva contraseña"
- "Cambiar contrasena" button → "Cambiar contraseña"

### Booking confirmation (`/{slug}/reservar/confirmacion`)
- "Turno confirmado!" → "¡Turno confirmado!"

---

## IMPROVEMENTS

### 1. Scroll-reveal animations hide content on full-page view
- **Page:** Landing page
- **Issue:** Sections below the fold use `IntersectionObserver` reveal animations (opacity: 0 by default). Screenshot shows blank sections. Search engine crawlers may not see content.
- **Suggestion:** Use CSS-only animations or ensure content is visible by default with progressive enhancement.

### 2. Footer links are all dead (#)
- **Page:** Landing page footer
- **Links:** Integraciones, API, Centro de ayuda, Blog, Guías, Status, Nosotros, Contacto, Términos, Privacidad — all point to `#`
- **Suggestion:** Either create the pages, link to real content, or remove the links to avoid looking unfinished.

### 3. "Analytics" has English tab labels
- **Page:** `/panel/analytics`
- **Tabs:** "Peak Hours", "Churn", "LTV" — mixed English/Spanish
- **Suggestion:** Use Spanish: "Horas Pico", "Deserción", "Valor de Vida del Cliente"

### 4. Widget config is duplicated
- **Pages:** Both `/panel/analytics` and `/panel/widget` show the same Widget Embebible section
- **Suggestion:** Keep widget config only in `/panel/widget`.

### 5. Suscripción plan name spacing
- **Page:** `/panel/suscripcion`
- **Text:** "Plan Pro(Prueba gratuita)" — missing space before parenthesis
- **Fix:** "Plan Pro (Prueba gratuita)"

### 6. Cloudinary not configured warning
- **Pages:** `/panel/configuracion`, `/mi-cuenta/perfil`
- **Text:** "Cloudinary no configurado" shown for Logo, Cover Image, and Avatar uploads
- **Suggestion:** Show a more helpful message or guide to configure it.

### 7. CSS preload warnings on booking pages
- **All booking pages:** "The resource ... was preloaded using link preload but not used within a few seconds"
- **Fix:** Remove unused CSS preload tags or ensure they're actually needed.

### 8. Input autocomplete warnings
- **Pages:** Registration, Pagos settings, Seguridad (password change)
- **Warning:** "Input elements should have autocomplete attributes"
- **Fix:** Add appropriate `autoComplete` props to form inputs.

### 9. `scroll-behavior: smooth` warning
- **Scope:** All pages
- **Warning:** "Detected `scroll-behavior: smooth` on the `<html>` element"
- **Fix:** Add `data-scroll-behavior="smooth"` to `<html>` as suggested by Next.js.

---

## TEST LOG

### 1. Landing Page ✅
- [x] Visual check — looks good, dark theme, nice hero
- [x] Navigation links work (Funciones → #features, Planes → #pricing, etc.)
- [x] CTA buttons link to /registrarse

### 2. Registration ✅
- [x] Sign up with credentials works
- [x] Redirect to /panel/bienvenida (onboarding)

### 3. Onboarding ✅
- [x] Step 1: Business profile (description, phone) — saved
- [x] Step 2: First service (name, duration, price) — created
- [x] Step 3: Staff member (name, specialty, phone) — created
- [x] Step 4: Completion screen — redirects to panel

### 4. Dashboard Pages
- [x] Home — KPIs, charts, activity feed all render (activity feed has raw action codes bug)
- [x] Turnos — appointment appears correctly, status change works (Confirmado → Completado)
- [x] Calendario — month view shows appointment on correct date, day/week/month toggle works
- [x] Servicios — shows created service with staff assignment
- [x] Equipo — shows Carlos Gómez with stats
- [x] Clientes — shows booked client (Nahuel Test) with appointment count, email, source
- [x] Horarios — working hours editor with blocks and blocked dates
- [x] Pagos — payment mode config, MercadoPago settings
- [x] Notificaciones — empty state with filters
- [x] Reseñas — stats and empty state
- [x] Campañas — no-shows stats and campaigns section
- [x] Suscripción — plan comparison, trial info
- [x] Sucursales — multi-location setup (API error for reports)
- [x] Analytics — retention, LTV charts, widget config
- [x] Reportes — empty state with period filters
- [x] Widget — widget config (duplicate of analytics)
- [x] Configuración — comprehensive settings page
- [x] Audit Log — shows onboarding actions

### 5. Booking Flow ✅
- [x] Business profile page — renders correctly
- [x] Service selection — works
- [x] Staff selection — works
- [x] Date/time selection — calendar and slots work correctly
- [x] Guest info — auto-fills from session
- [x] Confirmation — ✅ works after Prisma client fix + server restart
- [x] Confirmation page — shows success but missing appointment details

### 6. Account Pages ✅
- [x] Mi cuenta / Perfil — shows user info, edit form works, Cloudinary not configured for avatar
- [x] Seguridad — password change form renders (not submitted to avoid breaking session)
- [x] Mis Turnos — shows completed appointment with correct data
- [x] Negocios — shows Barbería Demo with Free plan and Propietario role

### 7. Appointment Management ✅
- [x] Appointment appears in `/panel/turnos` after booking
- [x] Status change via action menu works (Confirmado → Completado)
- [x] Toast notification "Estado actualizado" shown on status change
- [x] Appointment reflected in calendar view on correct date

### 8. Edge Cases ✅
- [x] 404 page — renders correctly for invalid routes (title bug: "Negocio no encontrado")
- [x] Login page (`/iniciar-sesion`) — redirects to panel when already logged in ✅
- [x] Password recovery (`/recuperar-contrasena`) — redirects to panel when logged in ✅

### 9. Auth Flow
- [x] Login redirect when authenticated — works correctly
- [ ] Logout + login with credentials — not tested (would require re-registration)
- [ ] Password recovery email flow — not tested (requires email config)
