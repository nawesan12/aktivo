import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://jikuapp.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://jikuapp.com/explorar",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://jikuapp.com/registrarse",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  let businessPages: MetadataRoute.Sitemap = [];

  try {
    const businesses = await db.business.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    businessPages = businesses.map((business) => ({
      url: `https://jikuapp.com/${business.slug}`,
      lastModified: business.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable at build time — static pages only
  }

  return [...staticPages, ...businessPages];
}
