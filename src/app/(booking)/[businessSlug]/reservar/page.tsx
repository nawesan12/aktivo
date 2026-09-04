import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBusinessIdentity } from "@/lib/booking/business-page";
import { BookingWizard } from "@/components/booking/booking-wizard";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

/**
 * Cached like the profile it hangs off. This page is the one every customer
 * lands on to book, and all it renders from the server is the business's id and
 * slug — two columns that change about never, fetched twice per visit.
 *
 * The wizard itself is a client component that reads live availability, so the
 * caching stops exactly where freshness starts to matter.
 */
export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params;
  const business = await getBusinessIdentity(businessSlug);

  return {
    title: business ? `Reservar turno - ${business.name}` : "Reservar Turno",
  };
}

export default async function BookingPage({ params }: Props) {
  const { businessSlug } = await params;

  const business = await getBusinessIdentity(businessSlug);
  if (!business) notFound();

  return (
    // The wizard reads `?serviceId=` with `useSearchParams`, which is only known
    // at request time. Without this boundary the page cannot be prerendered and
    // answers 500 — and only in production: the development server does not
    // enforce the bailout, so it looks fine locally.
    <Suspense fallback={null}>
      <BookingWizard businessId={business.id} slug={business.slug} />
    </Suspense>
  );
}
