import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/embed/` is the same booking flow inside an iframe on somebody else's
      // site: indexing it duplicates every business's page under a URL nobody
      // should land on directly.
      disallow: ["/panel/", "/mi-cuenta/", "/api/", "/admin/", "/embed/"],
    },
    sitemap: appUrl("/sitemap.xml"),
  };
}
