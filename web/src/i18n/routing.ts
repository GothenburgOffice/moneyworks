import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "sv"],
  defaultLocale: "en",
  localePrefix: "always",
  // Unprefixed visits always use English, regardless of browser language/cookies.
  localeDetection: false,
  localeCookie: false,
});
