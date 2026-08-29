"use client";

/**
 * Last resort: an error thrown by the root layout itself, before any section
 * boundary exists. It has to render its own `<html>` and cannot rely on the
 * app's styles being loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#09090b",
          color: "#fafafa",
          margin: 0,
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "26rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Algo salió mal
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "1.5rem" }}>
            La aplicación no pudo iniciarse. Estamos al tanto del problema.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", opacity: 0.5, marginBottom: "1.5rem" }}>
              Código: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              height: "2.5rem",
              padding: "0 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #3f3f46",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
