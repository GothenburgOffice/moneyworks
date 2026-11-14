import type { Locale, SiteCopy } from "@/content/site";
import { BrandLogo } from "./brand-logo";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { AccountMenu } from "./account-menu";
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
    // site-ui.js sets data-compact, which can happen before hydration.
    <div className="site-header-slot" data-sticky-header suppressHydrationWarning>
      <header className="site-header">
        <div className="page-width header-inner">
          <BrandLogo locale={locale} label={copy.home} href={`${homeHref}#top`} />
          <nav className="desktop-nav" aria-label={copy.nav.label}>
            {links.map(([id, text]) => (
              <a href={`${homeHref}#${id}`} key={id}>
                {text}
              </a>
            ))}
          </nav>
          <div className="header-utilities">
            <LanguageSwitcher locale={locale} label={copy.nav.language} suffix={localeSuffix} />
            <ThemeToggle copy={copy.nav} />
            <AccountMenu
              locale={locale}
              copy={{
                account: account.account,
                accountMenu: account.accountMenu,
                accountSettings: account.accountSettings,
                admin: account.admin,
                signedIn: account.signedIn,
                login: account.login,
                logout: account.logout,
              }}
            />
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
              </nav>
            </details>
          </div>
        </div>
      </header>
    </div>
  );
}
