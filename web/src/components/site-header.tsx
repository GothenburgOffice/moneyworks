import type { Locale, SiteCopy } from "@/content/site";
import { BrandLogo } from "./brand-logo";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { getAccountCopy } from "@/content/account";

export function SiteHeader({
  copy,
  locale,
  homeHref = "",
  localeSuffix = "",
}: {
  copy: SiteCopy;
  locale: Locale;
  homeHref?: string;
  localeSuffix?: string;
}) {
  const account = getAccountCopy(locale);
  const links = [
    ["tools", copy.nav.tools],
    ["learn", copy.nav.learn],
    ["about", copy.nav.about],
  ];
  return (
    <div className="site-header-slot" data-sticky-header>
      <header className="site-header">
        <div className="page-width header-inner">
          <BrandLogo locale={locale} label={copy.home} href={`${homeHref}#top`} />
          <nav className="desktop-nav" aria-label={copy.nav.label}>
            {links.map(([id, text]) => (
              <a href={`${homeHref}#${id}`} key={id}>
                {text}
              </a>
            ))}
            <a className="account-nav-link" href={`/${locale}/account`}>
              {account.account}
            </a>
          </nav>
          <div className="header-utilities">
            <LanguageSwitcher locale={locale} label={copy.nav.language} suffix={localeSuffix} />
            <ThemeToggle copy={copy.nav} />
            <details className="mobile-menu" data-mobile-menu>
              <summary aria-label={copy.nav.menu}>
                <span>{copy.nav.menu}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </summary>
              <nav aria-label={copy.nav.label}>
                {links.map(([id, text]) => (
                  <a href={`${homeHref}#${id}`} key={id}>
                    {text}
                  </a>
                ))}
                <a href={`/${locale}/account`}>{account.account}</a>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </div>
  );
}
