import type { Locale } from "./site";

// One mark for both languages: an M whose rising stroke breaks out into an arrow.
// Only the name beside it follows the locale. Keep identity in server-rendered
// HTML so branding also works without scripts.
const mark = {
  icon: "/brand-icon.svg",
  paths: ["M6 38V17l11.5 11.5L29 17v21", "M29 17l9.5-10", "M30 7h8.5v8.5"],
} as const;

const brands = {
  en: { name: "Money Working", lead: "Money", accent: "Working", ...mark },
  sv: { name: "Pengar jobbar", lead: "Pengar", accent: "jobbar", ...mark },
} as const;

export function getBrand(locale: Locale) {
  return brands[locale];
}
