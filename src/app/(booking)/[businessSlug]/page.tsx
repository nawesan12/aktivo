import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { safeImageUrl } from "@/lib/images";
import {
  getBusinessProfile,
  getUncategorizedServices,
  getBusinessReviews,
} from "@/lib/booking/business-page";
import { BusinessProfile } from "@/components/booking/business-profile";
import { appUrl } from "@/lib/env";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

/**
 * Rebuilt at most every ten minutes, and immediately whenever the owner changes
 * anything it shows (see `revalidateBusinessPage`).
 *
 * This is the most visited page in the product — the one a QR code on the
 * counter points at — and it was hitting the database on every single view,
 * including for the constant stream of bots probing `/wp-login.php` and
 * `/.env`, which land here because the route is a root catch-all.
 */
export const revalidate = 600;

/**
 * Empty on purpose: nothing is pre-rendered at build time (the list of
 * businesses is not known then, and would go stale immediately). Declaring it
 * is what registers the route for incremental regeneration, so the first
 * visitor to a slug renders it and everyone after that is served from the
 * cache until it expires or the owner edits something.
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params;

  const business = await getBusinessProfile(businessSlug);

  if (!business) return { title: "Negocio no encontrado" };

  const ogImage = safeImageUrl(business.coverImage) ?? safeImageUrl(business.logo) ?? undefined;

  return {
    title: `${business.name} - Reserva tu turno`,
    description: business.description || `Reserva turnos online en ${business.name}. Rapido, simple y seguro con Jiku.`,
    alternates: {
      canonical: appUrl(`/${businessSlug}`),
    },
    openGraph: {
      title: `${business.name} - Reserva tu turno`,
      description: business.description || `Reserva turnos online en ${business.name}`,
      url: appUrl(`/${businessSlug}`),
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: business.coverImage ? "summary_large_image" : "summary",
    },
  };
}

export default async function BusinessProfilePage({ params }: Props) {
  const { businessSlug } = await params;

  const business = await getBusinessProfile(businessSlug);

  if (!business) notFound();

  const categories = business.categories
    .filter((c) => c.services.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      services: c.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        image: safeImageUrl(s.image),
      })),
    }));

  const uncategorizedServices = await getUncategorizedServices(business.id);

  if (uncategorizedServices.length > 0) {
    categories.push({
      id: "general",
      name: "General",
      services: uncategorizedServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        image: safeImageUrl(s.image),
      })),
    });
  }

  const staffData = business.staff.map((s) => ({
    id: s.id,
    name: s.name,
    image: safeImageUrl(s.image),
    bio: s.bio,
    specialty: s.specialty,
    workingHours: s.workingHours.map((wh) => ({
      dayOfWeek: wh.dayOfWeek,
      startTime: wh.startTime,
      endTime: wh.endTime,
    })),
  }));

  // Fetch reviews for public display
  const { items: reviewsRaw, aggregate: reviewAgg } = await getBusinessReviews(business.id);

  const reviews = reviewsRaw.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    response: r.response,
    createdAt: r.createdAt.toISOString(),
    clientName: r.user?.name || r.guestClient?.name || "Cliente",
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    ...(business.description && { description: business.description }),
    url: appUrl(`/${business.slug}`),
    ...(business.logo && { image: business.logo }),
    ...(business.phone && { telephone: business.phone }),
    ...((business.address || business.city) && {
      address: {
        "@type": "PostalAddress",
        ...(business.address && { streetAddress: business.address }),
        ...(business.city && { addressLocality: business.city }),
        ...(business.province && { addressRegion: business.province }),
        addressCountry: "AR",
      },
    }),
    ...(reviewAgg._count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: String(reviewAgg._avg.rating?.toFixed(1) ?? "0"),
        reviewCount: String(reviewAgg._count),
        bestRating: "5",
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessProfile
      business={{
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        phone: business.phone,
        whatsapp: business.whatsapp,
        email: business.email,
        address: business.address,
        city: business.city,
        province: business.province,
        logoUrl: safeImageUrl(business.logo),
        coverUrl: safeImageUrl(business.coverImage),
        primaryColor: business.primaryColor,
        accentColor: business.accentColor,
      }}
      categories={categories}
      staff={staffData}
      reviews={reviews}
      averageRating={reviewAgg._avg.rating ?? 0}
      reviewCount={reviewAgg._count}
    />
    </>
  );
}
