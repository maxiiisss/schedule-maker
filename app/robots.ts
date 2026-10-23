import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    // Shared schedules are unlisted links and the API is not a page: keep both out of search.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/v/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
