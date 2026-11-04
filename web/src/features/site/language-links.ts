// Each language has a home domain (decision #7). Every domain serves every
// language, so search engines are told which copy is canonical and where each
// language lives. Pure: the caller reads the configuration.

export type LocaleOrigins<L extends string> = Record<L, string>;

/**
 * Parses "en=https://moneyworks.example,sv=https://pengarjobbar.example".
 * Returns null when blank or invalid: every locale needs exactly one
 * origin (scheme and host, optional port, no path).
 */
export function parseLocaleOrigins<L extends string>(
  value: string,
  locales: readonly L[],
): LocaleOrigins<L> | null {
  if (!value.trim()) return null;
  const origins: Partial<Record<L, string>> = {};
  for (const entry of value.split(",")) {
    const separator = entry.indexOf("=");
    const locale = entry.slice(0, separator).trim() as L;
    const raw = entry.slice(separator + 1).trim();
    if (separator < 1 || !locales.includes(locale) || origins[locale]) return null;
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== raw.replace(/\/$/, ""))
      return null;
    origins[locale] = url.origin;
  }
  return locales.every((locale) => origins[locale]) ? (origins as LocaleOrigins<L>) : null;
}

/**
 * Builds the HTTP Link header for an indexable page: rel="canonical" to the
 * requested language on its home domain, and an hreflang alternate per
 * language plus x-default (the default locale). Returns null for other paths.
 */
export function languageLinkHeader<L extends string>(
  pathname: string,
  origins: LocaleOrigins<L>,
  options: { locales: readonly L[]; defaultLocale: L; pagePaths: readonly string[] },
): string | null {
  const [, first = "", ...rest] = pathname.split("/");
  const locale = first as L;
  const page = rest.length ? `/${rest.join("/")}` : "";
  if (!options.locales.includes(locale) || !options.pagePaths.includes(page)) return null;
  const url = (target: L) => `${origins[target]}/${target}${page}`;
  return [
    `<${url(locale)}>; rel="canonical"`,
    ...options.locales.map((target) => `<${url(target)}>; rel="alternate"; hreflang="${target}"`),
    `<${url(options.defaultLocale)}>; rel="alternate"; hreflang="x-default"`,
  ].join(", ");
}
