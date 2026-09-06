/**
 * Sentry en el servidor: sólo errores.
 *
 * Sin `tracesSampleRate` no se manda una sola traza, que es lo caro tanto en
 * cuota como en tiempo de respuesta: cada transacción es una petición extra
 * desde una función serverless que se está por suspender. Lo que hace falta acá
 * es enterarse de un 500 antes que el cliente, no medir latencias.
 *
 * Sin DSN, `init` no engancha nada y la app corre igual: es lo que pasa en
 * desarrollo y en los tests, donde no queremos ruido.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Sólo producción: un error mientras desarrollás ya lo estás viendo en la
  // terminal, y gastaría el cupo del plan gratuito.
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // Para saber en qué deploy pasó sin tener que adivinar por la hora.
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0,
  // El cuerpo de la petición puede traer el teléfono y el email de quien
  // reserva. El error se entiende igual sin eso, y no viaja a un tercero.
  sendDefaultPii: false,
});
