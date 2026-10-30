import type { Locale, SiteCopy } from '@/content/site';
import { BrandLogo } from './brand-logo';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader({ copy, locale }: { copy: SiteCopy; locale: Locale }) {
  const links = [
    ['tools', copy.nav.tools],
    ['learn', copy.nav.learn],
    ['about', copy.nav.about],
  ];
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <BrandLogo label={copy.home} />
        <nav className="desktop-nav" aria-label={copy.nav.label}>
          {links.map(([id, text]) => <a href={`#${id}`} key={id}>{text}</a>)}
        </nav>
        <div className="header-utilities">
          <LanguageSwitcher locale={locale} label={copy.nav.language} />
          <ThemeToggle copy={copy.nav} />
          <details className="mobile-menu" data-mobile-menu>
            <summary aria-label={copy.nav.menu}><span>{copy.nav.menu}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></summary>
            <nav aria-label={copy.nav.label}>{links.map(([id, text]) => <a href={`#${id}`} key={id}>{text}</a>)}</nav>
          </details>
        </div>
      </div>
    </header>
  );
}
