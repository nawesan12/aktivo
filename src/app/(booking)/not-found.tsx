import Link from "next/link";
import { Search } from "lucide-react";

/**
 * A 404 under `/[businessSlug]` almost always means a mistyped or retired
 * business link — not a broken page. Sending that person to the generic 404,
 * which only offers "back to home", loses someone who was trying to book.
 */
export default function BusinessNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 sm:p-12 text-center max-w-md w-full">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Search className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-heading font-bold mb-2">No encontramos ese negocio</h1>
        <p className="text-muted-foreground text-sm mb-6">
          El enlace puede estar mal escrito, o el negocio ya no está publicado.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/explorar"
            className="inline-flex h-10 px-6 items-center justify-center rounded-lg brand-gradient text-white font-medium text-sm"
          >
            Explorar negocios
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 px-6 items-center justify-center rounded-lg border border-border font-medium text-sm"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
