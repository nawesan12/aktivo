import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-12 text-center max-w-md w-full">
        <p className="text-6xl font-heading font-bold brand-text mb-4">404</p>
        <h1 className="text-xl font-heading font-bold mb-2">Página no encontrada</h1>
        <p className="text-muted-foreground text-sm mb-6">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 px-6 items-center rounded-lg brand-gradient text-white font-medium text-sm"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
