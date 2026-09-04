import type { Metadata } from "next";
import { ClientsList } from "@/components/dashboard/clients-list";

export const metadata: Metadata = {
  title: "Clientes",
};

/**
 * The heading lives inside the list, not here: the design's subtitle is a live
 * count ("312 activos · 38 en riesgo"), and the search box sits on the same row
 * as the title. Both need the data.
 */
export default function ClientesPage() {
  return <ClientsList />;
}
