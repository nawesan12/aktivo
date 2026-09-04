import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { safeImageUrl } from "@/lib/images";
import { formatCurrency } from "@/lib/format";
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

  // Opening hours as the union of everyone's, same as the page shows. Google
  // uses this for the "open now" line in search results, and it was missing.
  const hoursByDay = new Map<number, { open: string; close: string }>();

  for (const member of business.staff) {
    for (const wh of member.workingHours) {
      const current = hoursByDay.get(wh.dayOfWeek);
      hoursByDay.set(wh.dayOfWeek, {
        open: current && current.open < wh.startTime ? current.open : wh.startTime,
        close: current && current.close > wh.endTime ? current.close : wh.endTime,
      });
    }
  }

  const SCHEMA_DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const allServices = categories.flatMap((category) => category.services);
  const prices = allServices.map((s) => s.price).filter((p) => p > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    ...(business.description && { description: business.description }),
    url: appUrl(`/${business.slug}`),
    ...(safeImageUrl(business.logo) && { image: safeImageUrl(business.logo) }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.email && { email: business.email }),
    ...((business.address || business.city) && {
      address: {
        "@type": "PostalAddress",
        ...(business.address && { streetAddress: business.address }),
        ...(business.city && { addressLocality: business.city }),
        ...(business.province && { addressRegion: business.province }),
        addressCountry: "AR",
      },
    }),
    ...(hoursByDay.size > 0 && {
      openingHoursSpecification: [...hoursByDay.entries()].map(([day, hours]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[day]}`,
        opens: hours.open,
        closes: hours.close,
      })),
    }),
    ...(prices.length > 0 && {
      priceRange: `${formatCurrency(Math.min(...prices))} - ${formatCurrency(Math.max(...prices))}`,
    }),
    ...(allServices.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios",
        itemListElement: allServices.slice(0, 30).map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service.name,
            ...(service.description && { description: service.description }),
          },
          price: String(service.price),
          priceCurrency: business.settings?.currency ?? "ARS",
        })),
      },
    }),
    // What makes Google offer a "reservar" action straight from the result.
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: appUrl(`/${business.slug}/reservar`),
        inLanguage: "es-AR",
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: `Turno en ${business.name}` },
    },
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
        website: business.website,
        about: business.about,
        instagram: business.instagram,
        facebook: business.facebook,
        tiktok: business.tiktok,
        logoUrl: safeImageUrl(business.logo),
        coverUrl: safeImageUrl(business.coverImage),
        cancellationPolicy: business.settings?.cancellationPolicy ?? null,
        // The deposit is on every service row now, so the visitor knows what
        // "Reservar" is going to charge before they press it.
        depositRate:
          business.settings?.paymentMode === "PERCENTAGE"
            ? (business.settings.depositPercentage ?? 0) / 100
            : null,
        primaryColor: business.primaryColor,
        accentColor: business.accentColor,
      }}
      categories={categories}
      staff={staffData}
      gallery={business.gallery
        .map((photo) => ({
          id: photo.id,
          url: safeImageUrl(photo.url),
          caption: photo.caption,
        }))
        .filter((photo): photo is { id: string; url: string; caption: string | null } =>
          photo.url !== null
        )}
      reviews={reviews}
      averageRating={reviewAgg._avg.rating ?? 0}
      reviewCount={reviewAgg._count}
    />
    </>
  );
}
