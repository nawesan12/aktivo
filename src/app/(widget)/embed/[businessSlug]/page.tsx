import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { EmbedBookingFlow } from "./embed-booking-flow";

export default async function EmbedPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      primaryColor: true,
      settings: {
        select: { widgetEnabled: true },
      },
    },
  });

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
