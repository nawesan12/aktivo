/**
 * Runs once when the server starts, before the first request is handled.
 *
 * The point is to turn a misconfigured deploy into a loud, immediate failure.
 * Until now a missing variable produced a server that booted happily and then
 * quietly stopped sending WhatsApp messages, emails or payment links — the kind
 * of outage nobody notices until a customer does.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertEnv } = await import("@/lib/env");
  assertEnv();
}
