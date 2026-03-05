import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://jiku.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://jiku.app/registrarse",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://jiku.app/iniciar-sesion",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let businessPages: MetadataRoute.Sitemap = [];

  try {
    const businesses = await db.business.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    businessPages = businesses.map((business) => ({
      url: `https://jiku.app/${business.slug}`,
      lastModified: business.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable at build time — static pages only
  }

  return [...staticPages, ...businessPages];
}
