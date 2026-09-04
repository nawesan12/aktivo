import { notFound } from "next/navigation";
import { getBusinessIdentity } from "@/lib/booking/business-page";
import { EmbedBookingFlow } from "./embed-booking-flow";

/**
 * Cached: this is an iframe on somebody else's website, so it is requested
 * once per visitor of *their* site, and it renders nothing that changes between
 * those visitors.
 */
export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

export default async function EmbedPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;

  const business = await getBusinessIdentity(businessSlug);

  if (!business || !business.settings?.widgetEnabled) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <EmbedBookingFlow
        businessId={business.id}
        businessSlug={business.slug}
        businessName={business.name}
        businessLogo={business.logo}
        primaryColor={business.primaryColor}
      />
    </div>
  );
}
