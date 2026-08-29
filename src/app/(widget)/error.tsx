"use client";

/**
 * Errors inside the embedded widget: compact, and never a stack trace — this
 * renders on someone else's website.
 */
export default function WidgetError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
      <div>
        <p className="font-heading font-semibold mb-1">No pudimos cargar las reservas</p>
        <p className="text-sm text-muted-foreground mb-4">Probá de nuevo en un momento.</p>
        <button
          onClick={reset}
          className="inline-flex h-9 px-4 items-center rounded-lg border border-border text-sm"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
