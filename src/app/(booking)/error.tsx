"use client";

import { useEffect } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("ui:booking");

/**
 * A failure in the booking flow is a lost sale. It keeps the customer on the
 * page with a way to retry instead of dropping them on the generic error page.
 */
export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is what ties this screen to the server log line.
    log.error("section boundary caught an error", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 text-center max-w-md w-full">
        <h1 className="text-xl font-heading font-bold mb-2">No pudimos cargar la reserva</h1>
        <p className="text-muted-foreground text-sm mb-6">Puede ser algo momentáneo. Probá de nuevo.</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70 font-mono mb-6">
            Código: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex h-10 px-6 items-center rounded-lg brand-gradient text-white font-medium text-sm"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
