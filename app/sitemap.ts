import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

// The app is a single page; shared schedules (/v/<id>) are private links and stay out.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }]
}
