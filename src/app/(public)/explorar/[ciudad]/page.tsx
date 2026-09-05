import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft } from "lucide-react";
import { BusinessCard } from "@/components/directory/business-card";
import { findDirectoryCity, listDirectoryCities, searchBusinesses } from "@/lib/directory";
import { appUrl } from "@/lib/env";

/**
 * One page per city, built once and reused.
 *
 * The directory is a single URL whose contents come from a query string, so
 * "peluquería en Córdoba" — how people actually search — had nothing to land
 * on. A crawler cannot guess `?city=`; it can follow a link to `/explorar/cordoba`.
 *
 * `generateStaticParams` returns nothing on purpose: cities appear as businesses
 * sign up, and pre-rendering the list at build time would freeze it. Each page
 * is built on its first visit and then served from the CDN.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ ciudad: string }>;
}) {
  const { ciudad } = await params;
  const city = await findDirectoryCity(ciudad);

  if (!city) notFound();

  const [results, cities] = await Promise.all([
    searchBusinesses({ city: city.city, page: 1, limit: 24 }),
    listDirectoryCities(),
  ]);

  const others = cities.filter((other) => other.slug !== city.slug).slice(0, 8);
  const label = [city.city, city.province].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-16">
        <div className="max-w-6xl mx-auto px-4">
          <Link
            href="/explorar"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Todos los negocios
          </Link>
          <h1 className="text-3xl sm:text-5xl font-heading font-bold">
            Turnos en {city.city}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            {results.pagination.total === 1
              ? `Un negocio en ${label} que toma reservas online.`
              : `${results.pagination.total} negocios en ${label} que toman reservas online. Elegí el servicio, el horario y listo.`}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.data.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>

        {others.length > 0 && (
          <div className="mt-16">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Otras ciudades
            </h2>
            <div className="flex flex-wrap gap-2">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={`/explorar/${other.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {other.city}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ciudad: string }>;
}): Promise<Metadata> {
  const { ciudad } = await params;
  const city = await findDirectoryCity(ciudad);

  if (!city) return { title: "Ciudad no encontrada" };

  const title = `Turnos online en ${city.city}`;
  const description = `Reservá tu turno en ${city.city}: barberías, peluquerías, spas y más. Elegís el horario y listo, sin llamar ni esperar.`;
  const url = appUrl(`/explorar/${city.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}
