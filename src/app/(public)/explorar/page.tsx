import type { Metadata } from "next";
import { ExplorePageClient } from "@/components/directory/explore-page-client";
import { appUrl } from "@/lib/env";
import { directorySearchKey, searchBusinesses } from "@/lib/directory";

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

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;

  // Rendered on the server so the results are in the HTML: this is the page
  // meant to be indexed, and a crawler used to receive an empty list.
  const initialResults = await searchBusinesses({ q, page: 1, limit: 20 });

  return (
    <ExplorePageClient
      initialQuery={q}
      initialKey={directorySearchKey({ q, page: 1, limit: 20 })}
      initialResults={initialResults}
    />
  );
}
