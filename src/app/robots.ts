import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel/", "/mi-cuenta/", "/api/", "/admin/"],
    },
    sitemap: "https://jiku.app/sitemap.xml",
  };
}
