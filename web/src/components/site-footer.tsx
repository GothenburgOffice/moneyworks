import type { Locale, SiteCopy } from "@/content/site";
import { CookieNotice } from "./cookie-notice";
import { BrandLogo } from "./brand-logo";

export function SiteFooter({ copy, locale }: { copy: SiteCopy; locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="page-width">
        <div className="footer-main">
          <div>
            <BrandLogo locale={locale} label={copy.footer.home} href={`/${locale}`} compact />
            <p>{copy.footer.description}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{copy.footer.note}</span>
        </div>
        <CookieNotice locale={locale} />
      </div>
    </footer>
  );
}
