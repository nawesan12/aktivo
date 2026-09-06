/**
 * El mismo arranque, para lo que corre en el runtime de ruteo (`proxy.ts`).
 * Ver `sentry.server.config.ts` para el porqué de cada opción.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0,
  sendDefaultPii: false,
});
