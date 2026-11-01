import type { Locale } from "./site";

// Locale selects the presentation, not the hostname or a client-side redirect.
// Keep identity in server-rendered HTML so branding also works without scripts.
const brands = {
  en: {
    name: "MoneyWorks",
    icon: "/moneyworks-mark.svg",
    paths: [
      "M5 32V12c0-3 3-4 5-1l12 19 12-19c2-3 5-2 5 1v20",
      "m5 19 9 14c1 2 3 2 4 0l4-6 4 6c1 2 3 2 4 0l9-14",
    ],
  },
  sv: {
    name: "Pengar jobbar",
    icon: "/pengar-jobbar-mark.svg",
    paths: ["M7 35V9h7a7 7 0 0 1 0 14H7", "M28 9h9v17c0 5-2 9-6 9s-6-4-6-8"],
  },
} as const;

export function getBrand(locale: Locale) {
  return brands[locale];
}
