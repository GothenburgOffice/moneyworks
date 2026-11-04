import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { publicPagePaths } from "@/features/tools/catalog";
import { parseLocaleOrigins, sitemapEntries } from "@/features/site/language-links";

// Built per request from LOCALE_ORIGINS, like the hreflang Link headers in proxy.ts,
// so the published image needs no rebuild for its domains.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origins = parseLocaleOrigins(process.env.LOCALE_ORIGINS ?? "", routing.locales);
  const host = (await headers()).get("host") ?? "";
  if (!origins) return [];
  return sitemapEntries(host, origins, {
    locales: routing.locales,
    defaultLocale: routing.defaultLocale,
    pagePaths: publicPagePaths,
  });
}
