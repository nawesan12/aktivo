import type { Metadata } from "next";
import { ExplorePageClient } from "@/components/directory/explore-page-client";

export const metadata: Metadata = {
  title: "Explorar Negocios - Reserva turnos online",
  description:
    "Encontrá barberías, salones de belleza, spas y más negocios de servicios. Reservá tu turno online de forma rápida y segura con Jiku.",
  alternates: {
    canonical: "https://jikuapp.com/explorar",
  },
  openGraph: {
    title: "Explorar Negocios - Reserva turnos online",
    description:
      "Encontrá barberías, salones de belleza, spas y más negocios de servicios. Reservá tu turno online.",
    url: "https://jikuapp.com/explorar",
  },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;

  return <ExplorePageClient initialQuery={q} />;
}
