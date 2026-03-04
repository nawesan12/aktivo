import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BookingWizard } from "@/components/booking/booking-wizard";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params;
  const business = await db.business.findUnique({
    where: { slug: businessSlug },
    select: { name: true },
  });

  return {
    title: business ? `Reservar turno - ${business.name}` : "Reservar Turno",
  };
}

export default async function BookingPage({ params }: Props) {
  const { businessSlug } = await params;

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, slug: true, isActive: true },
  });

  if (!business || !business.isActive) notFound();

  return <BookingWizard businessId={business.id} slug={business.slug} />;
}
