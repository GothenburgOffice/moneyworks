import type { Locale } from '@/content/site';
import { getPrivacyCopy } from '@/content/privacy';
import '@/styles/cookies.css';
export function CookieNotice({ locale }: { locale: Locale }) {
  const copy = getPrivacyCopy(locale);
  return (
    <div className="cookie-information">
      <p>{copy.cookieShort}</p>
      <details className="cookie-notice" id="cookies">
        <summary>{copy.privacy}</summary>
        <div>
          <p>{copy.cookieDetail}</p>
          <a className="text-link" href={`/${locale}/account?view=privacy`}>{copy.privacy} →</a>
        </div>
      </details>
    </div>
  );
}
