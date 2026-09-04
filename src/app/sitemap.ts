import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

/**
 * Rebuilt once a day.
 *
 * It was `force-dynamic`, so every crawler that asked for it — and they ask
 * often — cost a function invocation plus a full scan of the businesses table.
 * A sitemap that is a few hours stale is a sitemap doing its job.
 */
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: appUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: appUrl("/explorar"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: appUrl("/registrarse"),
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
      orderBy: { updatedAt: "desc" },
      // Search engines cap sitemaps at 50k URLs anyway; the bound is here so
      // this can never turn into an unbounded scan.
      take: 5000,
    });

    businessPages = businesses.map((business) => ({
      url: appUrl(`/${business.slug}`),
      lastModified: business.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable at build time — static pages only
  }

  return [...staticPages, ...businessPages];
}
