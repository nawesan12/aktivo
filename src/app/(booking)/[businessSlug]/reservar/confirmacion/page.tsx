import type { Metadata } from "next";
import { ConfirmationContent } from "@/components/booking/confirmation-content";

export const metadata: Metadata = {
  title: "Turno Confirmado",
};

export default async function ConfirmationPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;

  return <ConfirmationContent slug={businessSlug} />;
}
