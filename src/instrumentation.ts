import * as Sentry from "@sentry/nextjs";

/**
 * Runs once when the server starts, before the first request is handled.
 *
 * The point is to turn a misconfigured deploy into a loud, immediate failure.
 * Until now a missing variable produced a server that booted happily and then
 * quietly stopped sending WhatsApp messages, emails or payment links — the kind
 * of outage nobody notices until a customer does.
 */
export async function register() {
  // Cada runtime tiene su propio arranque: el de Node y el de ruteo no
  // comparten proceso, así que hay que inicializarlo en los dos.
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
    return;
  }

  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  await import("../sentry.server.config");

  const { assertEnv } = await import("@/lib/env");
  assertEnv();
}

/**
 * Los errores que Next atrapa por su cuenta.
 *
 * `handleApiError` cubre las rutas de API, pero un error dentro de un
 * componente de servidor o de una acción nunca pasa por ahí: hasta ahora sólo
 * quedaba en los logs de Vercel, que se borran a los pocos días y que nadie
 * mira si no está buscando algo.
 */
export const onRequestError = Sentry.captureRequestError;
