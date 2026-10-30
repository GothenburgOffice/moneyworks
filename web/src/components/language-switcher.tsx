/* eslint-disable @next/next/no-html-link-for-pages -- Locale links deliberately use full-document navigation for static HTML. */
import type { Locale } from '@/content/site';

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  return (
    <nav className="language-switcher" aria-label={label}>
      <a href="/en" suppressHydrationWarning data-locale-link hrefLang="en" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>EN<span className="sr-only">, English</span></a>
      <span className="language-separator" aria-hidden="true">/</span>
      <a href="/sv" suppressHydrationWarning data-locale-link hrefLang="sv" lang="sv" aria-current={locale === 'sv' ? 'page' : undefined}>SV<span className="sr-only">, Svenska</span></a>
    </nav>
  );
}
