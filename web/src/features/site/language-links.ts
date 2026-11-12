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

export type SitemapEntry = { url: string; alternates: { languages: Record<string, string> } };

/**
 * Sitemap entries for the domain serving the request: every public page in each
 * language whose home domain has this host, with its alternates (search engines
 * expect a sitemap's URLs on its own host). Empty for any other host.
 */
export function sitemapEntries<L extends string>(
  host: string,
  origins: LocaleOrigins<L>,
  options: { locales: readonly L[]; defaultLocale: L; pagePaths: readonly string[] },
): SitemapEntry[] {
  const url = (locale: L, page: string) => `${origins[locale]}/${locale}${page}`;
  const home = options.locales.filter((locale) => new URL(origins[locale]).host === host);
  return home.flatMap((locale) =>
    options.pagePaths.map((page) => ({
      url: url(locale, page),
      alternates: {
        languages: Object.fromEntries([
          ...options.locales.map((target) => [target, url(target, page)]),
          ["x-default", url(options.defaultLocale, page)],
        ]),
      },
    })),
  );
}

/** The sitemap URL for the requesting host, when it is a language's home domain. */
export function sitemapUrl<L extends string>(host: string, origins: LocaleOrigins<L>) {
  const origin = Object.values<string>(origins).find((value) => new URL(value).host === host);
  return origin ? `${origin}/sitemap.xml` : undefined;
}

/**
 * The language a request host is the home domain of, so an unprefixed visit (the root, or a
 * path without a language) opens in that language instead of the default. Undefined when the
 * host is no language's home domain, or when one host is home to several languages.
 */
export function homeLocale<L extends string>(
  host: string,
  origins: LocaleOrigins<L>,
  locales: readonly L[],
): L | undefined {
  // Host names are case-insensitive; the configured origins are already lower case.
  const requestHost = host.toLowerCase();
  const matches = locales.filter((locale) => new URL(origins[locale]).host === requestHost);
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Where an unprefixed visit to a language's home domain goes: the same path and query under
 * that language, as an absolute URL on its configured origin (Next.js rejects a relative
 * Location in the proxy, and the scheme behind a reverse proxy is only known from configuration). Undefined when the path already has a language, or the host has no single home language.
 */
export function homeRedirect<L extends string>(
  request: { pathname: string; search: string; host: string },
  origins: LocaleOrigins<L>,
  locales: readonly L[],
): string | undefined {
  const [, first = ""] = request.pathname.split("/");
  if ((locales as readonly string[]).includes(first)) return undefined;
  const locale = homeLocale(request.host, origins, locales);
  if (!locale) return undefined;
  return `${origins[locale]}/${locale}${request.pathname === "/" ? "" : request.pathname}${request.search}`;
}
