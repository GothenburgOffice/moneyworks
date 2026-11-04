import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "sv"],
  defaultLocale: "en",
  localePrefix: "always",
  // Unprefixed visits always use English, regardless of browser language/cookies.
  localeDetection: false,
  localeCookie: false,
  // proxy.ts sends hreflang/canonical links for each language's home domain
  // (LOCALE_ORIGINS) instead of next-intl's same-host links.
  alternateLinks: false,
});
