// Full-document locale navigation keeps server-rendered forms and SSG useful without JS.
import type { Locale } from '@/content/site';

export function LanguageSwitcher({ locale, label, suffix = '' }: { locale: Locale; label: string; suffix?: string }) {
  return (
    <nav className="language-switcher" aria-label={label}>
      <a href={`/en${suffix}`} suppressHydrationWarning data-locale-link hrefLang="en" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>EN<span className="sr-only">, English</span></a>
      <span className="language-separator" aria-hidden="true">/</span>
      <a href={`/sv${suffix}`} suppressHydrationWarning data-locale-link hrefLang="sv" lang="sv" aria-current={locale === 'sv' ? 'page' : undefined}>SV<span className="sr-only">, Svenska</span></a>
    </nav>
  );
}
