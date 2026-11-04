import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { parseLocaleOrigins, sitemapUrl } from "@/features/site/language-links";

// Crawling is open; account pages carry noindex themselves. The sitemap is named
// only on a language's home domain (LOCALE_ORIGINS).
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origins = parseLocaleOrigins(process.env.LOCALE_ORIGINS ?? "", routing.locales);
  const host = (await headers()).get("host") ?? "";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: origins ? sitemapUrl(host, origins) : undefined,
  };
}
