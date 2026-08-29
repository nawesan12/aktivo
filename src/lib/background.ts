import { after } from "next/server";
import { createLogger, type LogContext } from "@/lib/logger";

const log = createLogger("background");

/**
 * Work that must finish, but that the client should not wait for.
 *
 * The pattern this replaces was `sendNotification(...).catch(console.error)`.
 * On serverless that is a coin flip: the response is returned, the function
 * suspends, and any promise still in flight is dropped. The confirmation
 * WhatsApp that "sometimes doesn't arrive" is exactly this.
 *
 * `after()` keeps the invocation alive until the callback settles, so the send
 * either completes or fails loudly — never silently vanishes.
 */
export function runInBackground(
  scope: string,
  work: () => Promise<unknown>,
  context?: LogContext
): void {
  after(async () => {
    try {
      await work();
    } catch (error) {
      // The request is already answered: logging is the only thing left to do,
      // and it must never throw back into the runtime.
      log.child(scope).error("background task failed", error, context);
    }
  });
}
