"use client";

import { useEffect } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("ui:root");

/**
 * Catch-all boundary for anything not handled by a section's own `error.tsx`.
 * The true root-layout failure is `global-error.tsx`, which renders its own
 * document.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("boundary caught an error", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-12 text-center max-w-md w-full">
        <p className="text-5xl font-heading font-bold text-destructive mb-4">Error</p>
        <h1 className="text-xl font-heading font-bold mb-2">Algo salió mal</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Ocurrió un error inesperado. Intentá nuevamente.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
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
