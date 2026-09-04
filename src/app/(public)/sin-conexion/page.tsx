import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

/**
 * What the installed app shows when the network is gone.
 *
 * The service worker used to answer a failed navigation with
 * `caches.match(request)` — and nothing ever put a navigation in that cache, so
 * the result was `undefined` and the browser fell through to its own "no
 * internet" error page. An installed app that dies into a Chrome error screen
 * does not read as an app.
 */
export default function OfflinePage() {
  return (
    <main
      id="contenido"
      className="min-h-screen flex items-center justify-center px-4 text-center"
    >
      <div className="max-w-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <WifiOff className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-heading font-bold">Te quedaste sin conexión</h1>
        <p className="text-sm text-muted-foreground">
          Jiku necesita internet para mostrarte tu agenda al día. Apenas vuelva,
          recargá y seguís donde estabas.
        </p>
        <p className="text-xs text-muted-foreground">
          Los turnos que ya tomaste están guardados: no se pierde nada.
        </p>
      </div>
    </main>
  );
}
