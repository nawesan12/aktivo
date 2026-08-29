import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

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

  if (q) where.name = { contains: q, mode: "insensitive" };
  if (city) where.city = city;
  if (province) where.province = province;
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
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
      },
    }),
    db.business.count({ where }),
  ]);

  const data = businesses.map((biz) => {
    const reviewCount = biz.reviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round(
            (biz.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
          ) / 10
        : null;

    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      description: biz.description,
      logo: biz.logo,
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
