import type { Locale, SiteCopy } from '@/content/site';
import { CookieNotice } from './cookie-notice';
import { BrandLogo } from './brand-logo';

type StatusCopy = { databaseChecking: string; databaseConnected: string; databaseUnavailable: string };

export function SiteFooter({ copy, status, locale }: { copy: SiteCopy; status: StatusCopy; locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="page-width">
        <div className="footer-main">
          <div><BrandLogo locale={locale} label={copy.footer.home} href={`/${locale}`} compact /><p>{copy.footer.description}</p></div>
        </div>
        <div className="footer-bottom">
          <span>{copy.footer.note}</span>
          {/* The independent health script may finish before Next hydrates. Only
              this live status node owns intentionally different text/attributes. */}
          <p className="database-status" suppressHydrationWarning role="status" aria-live="polite" data-db-status data-connected={status.databaseConnected} data-unavailable={status.databaseUnavailable}>
            {status.databaseChecking}
          </p>
        </div>
        <CookieNotice locale={locale} />
      </div>
    </footer>
  );
}
