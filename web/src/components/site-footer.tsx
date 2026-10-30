import type { SiteCopy } from '@/content/site';
import { BrandLogo } from './brand-logo';
import { ArrowIcon } from './ui-icons';

type StatusCopy = { databaseChecking: string; databaseConnected: string; databaseUnavailable: string };

export function SiteFooter({ copy, status }: { copy: SiteCopy; status: StatusCopy }) {
  return (
    <footer className="site-footer">
      <div className="page-width">
        <div className="footer-main">
          <div><BrandLogo label={copy.home} compact /><p>{copy.footer.description}</p></div>
          <a className="back-top" href="#top">{copy.footer.top}<ArrowIcon /></a>
        </div>
        <div className="footer-bottom">
          <span>{copy.footer.note}</span>
          {/* The independent health script may finish before Next hydrates. Only
              this live status node owns intentionally different text/attributes. */}
          <p className="database-status" suppressHydrationWarning role="status" aria-live="polite" data-db-status data-connected={status.databaseConnected} data-unavailable={status.databaseUnavailable}>
            {status.databaseChecking}
          </p>
        </div>
      </div>
    </footer>
  );
}
