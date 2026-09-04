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
    },
  });

  if (!business || !business.isActive) return null;

  return business;
});

/**
 * Just enough to render a booking shell: who the business is and whether it is
 * open for business. Separate from the full profile because the pages that need
 * only this — the wizard, the client portal, the embedded widget — were each
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
      primaryColor: true,
      isActive: true,
      settings: { select: { widgetEnabled: true } },
    },
  });

  if (!business || !business.isActive) return null;

  return business;
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
 * `/embed` is in the list for a sharper reason: it answers 404 while the widget
 * is off, and a cached 404 meant turning the widget on did nothing for ten
 * minutes. Call this from anything that edits what these pages show.
 */
export function revalidateBusinessPage(slug: string | undefined) {
  if (!slug) return;

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/reservar`);
  revalidatePath(`/embed/${slug}`);
  // The share card carries the name, the colours and the prices.
  revalidatePath(`/${slug}/opengraph-image`);
}
