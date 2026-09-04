import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getBusinessIdentity } from "@/lib/booking/business-page";
import { BookingFlow } from "@/components/booking/booking-flow";
import { BusinessCover } from "@/components/booking/business-cover";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

/**
 * Cached like the profile it hangs off. This page is the one every customer
 * lands on to book, and all it renders from the server is the shop's cover and
 * name — columns that change about never.
 *
 * The flow itself is a client component that reads live availability, so the
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
    <>
      <BusinessCover business={business} />
      {/*
        The flow reads `?serviceId=` and `?error=payment` with `useSearchParams`,
        which are only known at request time. Without this boundary the page
        cannot be prerendered and answers 500 — and only in production: the
        development server does not enforce the bailout, so it looks fine
        locally.
      */}
      <Suspense fallback={null}>
        <BookingFlow
          businessId={business.id}
          slug={business.slug}
          cancellationPolicy={business.settings?.cancellationPolicy ?? null}
        />
      </Suspense>
    </>
  );
}
