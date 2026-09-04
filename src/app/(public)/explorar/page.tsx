import type { Metadata } from "next";
import { Suspense } from "react";
import { ExplorePageClient } from "@/components/directory/explore-page-client";
import { appUrl } from "@/lib/env";
import { directorySearchKey, listDirectoryCities, searchBusinesses } from "@/lib/directory";

export const metadata: Metadata = {
  title: "Explorar Negocios - Reserva turnos online",
  description:
    "Encontrá barberías, salones de belleza, spas y más negocios de servicios. Reservá tu turno online de forma rápida y segura con Jiku.",
  alternates: {
    canonical: appUrl("/explorar"),
  },
  openGraph: {
    title: "Explorar Negocios - Reserva turnos online",
    description:
      "Encontrá barberías, salones de belleza, spas y más negocios de servicios. Reservá tu turno online.",
    url: appUrl("/explorar"),
  },
};

/**
 * Rebuilt every ten minutes instead of on every visit.
 *
 * It used to read `searchParams`, which made the whole page dynamic: a function
 * invocation and a handful of queries for every visitor and every crawler, to
 * render a listing that changes when a business signs up. The `?q=` filter now
 * lives entirely on the client, where it always ran anyway — what the server
 * renders, and what gets indexed, is the unfiltered first page.
 */
export const revalidate = 600;

export default async function ExplorePage() {
  // Rendered on the server so the results are in the HTML: this is the page
  // meant to be indexed, and a crawler used to receive an empty list.
  const [initialResults, cities] = await Promise.all([
    searchBusinesses({ page: 1, limit: 20 }),
    listDirectoryCities(),
  ]);

  return (
    // Suspense is required for the page to prerender: the client reads `?q=`
    // with `useSearchParams`, which is only known at request time. The fallback
    // is never really seen — the boundary resolves on hydration — but the
    // prerendered HTML still carries the full listing, which is the point.
    <Suspense fallback={null}>
      <ExplorePageClient
        initialKey={directorySearchKey({ page: 1, limit: 20 })}
        initialResults={initialResults}
        cities={cities}
      />
    </Suspense>
  );
}
