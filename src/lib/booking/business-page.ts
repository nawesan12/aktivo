import { cache } from "react";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

/**
 * Everything the public profile of a business needs, in one query.
 *
 * Wrapped in `cache` so the layout, `generateMetadata` and the page itself
 * share a single round trip. They used to fetch the same `Business` row three
 * separate times per request, plus four more queries for services, staff and
 * reviews.
 */
export const getBusinessProfile = cache(async (slug: string) => {
  const business = await db.business.findUnique({
    where: { slug },
    include: {
      settings: true,
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          services: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
      },
      staff: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          workingHours: {
            where: { isActive: true },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
      gallery: {
        orderBy: { sortOrder: "asc" },
        take: 12,
      },
    },
  });

  if (!business || !business.isActive) return null;

  return business;
});

/**
 * Just enough to render a booking shell: who the business is and whether it is
 * open for business. Separate from the full profile because the pages that need
 * only this — the booking flow and the client portal — were each
 * running their own query for four columns that change once a year.
 */
export const getBusinessIdentity = cache(async (slug: string) => {
  const business = await db.business.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      // The booking screen opens on the shop's own cover, so it needs the same
      // header material the profile does — otherwise a customer following a
      // service link from Instagram lands on a form with no idea whose it is.
      coverImage: true,
      city: true,
      address: true,
      province: true,
      whatsapp: true,
      primaryColor: true,
      isActive: true,
      settings: { select: { cancellationPolicy: true } },
    },
  });

  if (!business || !business.isActive) return null;

  const rating = await db.review.aggregate({
    where: { businessId: business.id, isVisible: true },
    _avg: { rating: true },
    _count: true,
  });

  return {
    ...business,
    rating: rating._count > 0 ? Number(rating._avg.rating?.toFixed(1)) : null,
    reviewCount: rating._count,
  };
});

/** Services that were never filed under a category. */
export const getUncategorizedServices = cache(async (businessId: string) =>
  db.service.findMany({
    where: { businessId, isActive: true, categoryId: null },
    orderBy: { name: "asc" },
    // A business with hundreds of loose services would be a data problem, not
    // a page worth rendering in full.
    take: 100,
  })
);

/** The reviews shown on the profile, and the average across all of them. */
export const getBusinessReviews = cache(async (businessId: string) => {
  const [items, aggregate] = await Promise.all([
    db.review.findMany({
      where: { businessId, isVisible: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        guestClient: { select: { name: true } },
      },
    }),
    db.review.aggregate({
      where: { businessId, isVisible: true },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return { items, aggregate };
});

/**
 * Drops every cached public page of a business.
 *
 * They are all rebuilt on a timer, which is fine for visitors and wrong for the
 * owner: they change a price, look at their own page, and see the old one.
 *
 * Call this from anything that edits what these pages show.
 */
export function revalidateBusinessPage(slug: string | undefined) {
  if (!slug) return;

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/reservar`);
  // The share card carries the name, the colours and the prices.
  revalidatePath(`/${slug}/opengraph-image`);
}
