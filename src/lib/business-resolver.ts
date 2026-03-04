import { db } from "./db";

export async function resolveBusinessBySlug(slug: string) {
  const business = await db.business.findUnique({
    where: { slug },
    include: {
      settings: true,
      categories: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!business || !business.isActive) return null;

  return business;
}
