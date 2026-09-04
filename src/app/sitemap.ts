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
      // The same condition the directory uses. Without it the sitemap offered
      // Google the profile of every business that signed up and never finished
      // setting itself up — pages with nothing to book.
      where: {
        isActive: true,
        services: { some: { isActive: true } },
        staff: { some: { isActive: true } },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      // Search engines cap sitemaps at 50k URLs anyway; the bound is here so
      // this can never turn into an unbounded scan.
      take: 5000,
    });

    businessPages = businesses.flatMap((business) => [
      {
        url: appUrl(`/${business.slug}`),
        lastModified: business.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      // The page somebody searching "reservar turno en X" actually wants.
      {
        url: appUrl(`/${business.slug}/reservar`),
        lastModified: business.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
    ]);
  } catch {
    // DB unavailable at build time — static pages only
  }

  return [...staticPages, ...businessPages];
}
