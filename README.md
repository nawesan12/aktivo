# Jiku

Plataforma de turnos y crecimiento para negocios de servicios en Argentina:
barberías, salones, estética. Reservas online, recordatorios por email, cobros
con MercadoPago, CRM y campañas.

En producción: **https://jikuapp.com**

---

## Poner en marcha

```bash
npm install
cp .env.example .env      # completar al menos DATABASE_URL y AUTH_SECRET
npx prisma migrate deploy # aplicar el esquema
npm run db:seed           # datos de demostración
npm run dev
```

La app queda en http://localhost:3000. El seed deja dos negocios de ejemplo:

| Acceso | Credenciales |
|---|---|
| Dueño del negocio | `owner@elcorte.com` / `owner123` |
| Administrador de la plataforma | `admin@jiku.app` / `admin123` |
| Negocio público | `/el-corte` |

### Variables de entorno

`src/lib/env.ts` es el contrato: valida todo al arrancar y **el servidor no
levanta** si falta algo esencial o si una integración quedó a medias (por
ejemplo, el cobro de suscripciones con token pero sin los IDs de plan). En
desarrollo eso es una advertencia; en producción, un error.

Imprescindibles: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.
En producción además `CRON_SECRET`, o los trabajos programados devuelven 401.

El resto está documentado en `.env.example`, agrupado por integración.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Chequeo de tipos |
| `npx vitest run` | Tests unitarios |
| `npx playwright test` | Tests end-to-end |
| `npm run db:seed` | Datos de demostración |
| `npm run db:studio` | Prisma Studio |
| `npx tsx scripts/db-status.ts` | Qué hay en la base |
| `npx tsx scripts/e2e-cleanup.ts` | Borrar los datos que dejan los e2e |

---

## Cómo está armado

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Prisma 7 + PostgreSQL
(Neon) · NextAuth v5 · Tailwind v4 + shadcn/ui · Zod · SWR · Recharts · GSAP.

```
src/
├── app/
│   ├── (landing)     página de venta
│   ├── (booking)     perfil público del negocio y flujo de reserva
│   ├── (dashboard)   panel del negocio
│   ├── (admin)       administración de la plataforma
│   ├── (account)     cuenta del cliente final
│   ├── (public)      directorio y reseñas
│   ├── (widget)      widget embebible (corre en sitios de terceros)
│   └── api/          route handlers, incluidos los crons
├── components/
├── lib/              lógica de negocio y utilidades compartidas
└── proxy.ts          autenticación y protección de rutas
```

**Multi-tenant:** cada negocio tiene su `slug` y toda consulta se acota por
`businessId`. La sesión lleva el negocio activo (`getSessionBusiness`).

**Permisos:** seis roles con permisos granulares (`src/lib/auth/rbac.ts`). El
chequeo de administrador está centralizado en `proxy.ts`; cada ruta vuelve a
verificar — eso es el piso, no la única cerradura.

### Piezas que conviene conocer antes de tocar nada

| Módulo | Por qué importa |
|---|---|
| `lib/availability.ts` | Calcula los horarios libres. La corrección de esto es el producto. |
| `lib/env.ts` | Contrato de configuración; falla ruidosamente en vez de degradar. |
| `lib/logger.ts` | Logging estructurado; en producción emite JSON por línea. |
| `lib/background.ts` | Trabajo que debe terminar aunque la respuesta ya salió (`after()`). |
| `lib/retry.ts` | Reintentos con backoff para los envíos que fallan de forma transitoria. |
| `lib/appointment-status.ts` | Un único mapa de estados: etiqueta y color. |
| `lib/format.ts` / `lib/phone.ts` | Formato de moneda y teléfonos argentinos. |
| `lib/api-errors.ts` | Salida única de error; traduce el conflicto de horario a 409. |

### Integridad de las reservas

Dos personas no pueden quedarse con el mismo horario. La verificación en la
aplicación es un *check-then-act* y dos pedidos simultáneos la pasan ambos, así
que la red real está en la base: una constraint de exclusión
(`Appointment_no_overlap_per_staff`) hace que el perdedor de la carrera falle, y
`handleApiError` lo traduce a un **409 `SLOT_TAKEN`** con un mensaje entendible.

Los turnos `PENDING_PAYMENT` tienen `expiresAt`: si no se pagan, un cron los
libera. Sin eso, cualquiera podía llenar la agenda de un negocio sin pagar.

### Trabajos programados

Definidos en `vercel.json`, autenticados con `Authorization: Bearer $CRON_SECRET`:

| Ruta | Frecuencia | Qué hace |
|---|---|---|
| `/api/cron/reminders` | cada 15 min | Recordatorios de turno |
| `/api/cron/expire-bookings` | cada 5 min | Libera reservas impagas |
| `/api/cron/no-shows` | cada 15 min | Marca ausencias |
| `/api/cron/retry-notifications` | cada 30 min | Reintenta notificaciones fallidas |
| `/api/cron/campaigns` | diario | Cumpleaños, re-booking, inactividad |
| `/api/cron/review-requests` | horario | Pide reseñas pasado el plazo del negocio |

> El plan Hobby de Vercel limita la cantidad de crons: en producción esto
> requiere plan Pro.

---

## Tests

- **Unitarios** (`src/**/*.test.ts`, Vitest): disponibilidad, precios, cupones,
  entorno, logger, reintentos, teléfonos, estados, formato, rate limiting.
- **End-to-end** (`e2e/`, Playwright): reserva completa, doble reserva
  rechazada, widget embebible, accesibilidad, y las funcionalidades f01–f12.

Los e2e descubren los datos por HTTP (`e2e/fixtures.ts`) en lugar de asumir el
seed, así que corren igual contra un entorno desplegado. Limpiar después con
`npx tsx scripts/e2e-cleanup.ts`.

---

## Deploy

Vercel, cuenta personal, plan Hobby. `npm run build` corre `prisma generate` y
el chequeo de tipos; **no** corre migraciones. Se aplican aparte con
`npx prisma migrate deploy` contra la URL no pooleada de Neon (ver
`prisma/migrations/README.md`).

`/api/health` informa el estado de la base y qué integraciones están
configuradas.

### Trabajo programado

Hobby sólo permite un cron por día, así que la programación vive en la
aplicación:

- **Tráfico real** → `maybeTick()` por `after()`, con un candado en la tabla
  `JobRun` para que no corran dos pasadas encima. Ver `src/lib/jobs/tick.ts`.
- **`/api/cron/daily`** (única entrada de `vercel.json`, 09:00 ART) → corre todo
  con `force`, y es el dueño del job de campañas: un saludo de cumpleaños tiene
  que salir el día que es.
- **`/api/tick`** → lo llama un workflow de GitHub Actions cada diez minutos
  (`.github/workflows/tick.yml`). Es lo único que hace confiable el recordatorio
  de una hora antes, cuya ventana cae justo cuando nadie está navegando.

Los tres caminos usan el mismo `CRON_SECRET`. Si se rota, hay que actualizarlo
en Vercel **y** en los secretos del repositorio.

---

## Roadmap

En [`ROADMAP.md`](./ROADMAP.md).
