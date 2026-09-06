/**
 * Sentry en el navegador.
 *
 * Esto es lo único que agrega peso a la página que ve el cliente, así que va lo
 * mínimo: sin trazas y sin Session Replay —que es la parte pesada del SDK y la
 * que graba la pantalla de quien está reservando—. Quedan los errores de
 * JavaScript, que son los que rompen el flujo de reserva sin que nadie se
 * entere: en el servidor no dejan rastro.
 *
 * `NEXT_PUBLIC_SENTRY_DSN` se lee de `process.env` y no de `lib/env.ts` por lo
 * mismo que las variables de Cloudinary: esto también corre en el cliente,
 * donde el esquema no existe. Está declarada igual en el esquema para que el
 * arranque falle si alguien la escribe mal.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  sendDefaultPii: false,
  // Extensiones del navegador y bloqueadores tiran errores que no son nuestros
  // y que no podemos arreglar; llenan el tablero y esconden los de verdad.
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection captured",
    /^Failed to fetch$/,
    /extension:\/\//i,
  ],
});

/** Requerido por el SDK para medir las navegaciones del App Router. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
