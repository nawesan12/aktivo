import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { safeImageUrl } from "@/lib/images";

/**
 * Public business directory search.
 *
 * Lives here rather than inside the API route so the `/explorar` page can run
 * the same query on the server and ship the first page of results in the HTML.
 * Until now the page carried a canonical URL and Open Graph tags over an empty
 * body: a crawler saw the heading, the search box, and nothing else — the one
 * page whose entire purpose is to be indexed.
 */

export interface DirectoryBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  city: string | null;
  province: string | null;
  averageRating: number | null;
  reviewCount: number;
  topServices: string[];
}

export interface DirectoryPage {
  data: DirectoryBusiness[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface DirectoryQuery {
  q?: string | null;
  city?: string | null;
  province?: string | null;
  category?: string | null;
  page?: number;
  limit?: number;
}

export async function searchBusinesses({
  q,
  city,
  province,
  category,
  page = 1,
  limit = 20,
}: DirectoryQuery): Promise<DirectoryPage> {
  const skip = (page - 1) * limit;

  // A business with no active service cannot be booked: listing it sends the
  // visitor to a profile with nothing to choose, which is worse than not
  // appearing at all.
  const where: Prisma.BusinessWhereInput = {
    isActive: true,
    services: { some: { isActive: true } },
    staff: { some: { isActive: true } },
  };

  // The box says "por nombre o servicio" and only searched the name. Somebody
  // typing "corte de barba" got nothing, from a directory full of barbershops
  // that do exactly that.
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { services: { some: { isActive: true, name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  // `contains`, not equality: the city arrives as the visitor typed it, and
  // "buenos aires" matched nothing against "Buenos Aires".
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (province) where.province = { contains: province, mode: "insensitive" };

  if (category) {
    where.services = {
      some: {
        isActive: true,
        category: { name: { contains: category, mode: "insensitive" } },
      },
    };
  }

  const [businesses, total] = await Promise.all([
    db.business.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        city: true,
        province: true,
        services: {
          where: { isActive: true },
          take: 3,
          orderBy: { name: "asc" },
          select: { name: true },
        },
      },
    }),
    db.business.count({ where }),
  ]);

  // Aggregated in SQL, one query for the whole page. Pulling every visible
  // review just to average them in JavaScript meant a business with two
  // thousand reviews shipped two thousand rows per listing render.
  const ratings = await db.review.groupBy({
    by: ["businessId"],
    where: { businessId: { in: businesses.map((b) => b.id) }, isVisible: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const ratingByBusiness = new Map(ratings.map((r) => [r.businessId, r]));

  const data = businesses.map((biz) => {
    const rating = ratingByBusiness.get(biz.id);
    const reviewCount = rating?._count._all ?? 0;
    const averageRating =
      reviewCount > 0 && rating?._avg.rating != null
        ? Math.round(rating._avg.rating * 10) / 10
        : null;

    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      logo: safeImageUrl(biz.logo),
      city: biz.city,
      province: biz.province,
      averageRating,
      reviewCount,
      topServices: biz.services.map((s) => s.name),
    };
  });

  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/** The querystring the client uses for the same search, so SSR and SWR agree. */
export function directorySearchKey({
  q,
  city,
  province,
  page = 1,
  limit = 20,
}: DirectoryQuery): string {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (province) params.set("province", province);
  return `/api/directory?${params}`;
}
