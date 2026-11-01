import type { PrivacyCopy } from "@/content/privacy";
import type { Locale } from "@/content/site";

type Props = {
  locale: Locale;
  copy: PrivacyCopy;
  backLabel: string;
  controller?: { name: string; contact: string };
};

// Public presentation only. Never receive the full secret-bearing auth config.
export function PrivacyContent({ locale, copy, backLabel, controller }: Props) {
  return (
    <section className="privacy-page">
      <h1>{copy.privacyTitle}</h1>
      <p>{copy.cookieShort}</p>
      <h2>{copy.privacy}</h2>
      <p>{copy.cookieDetail}</p>
      <p>{copy.cookieLifetime}</p>
      <h2>{copy.controller}</h2>
      {controller ? (
        <p>
          {controller.name}
          <br />
          {copy.contact}: <a href={`mailto:${controller.contact}`}>{controller.contact}</a>
        </p>
      ) : (
        <p className="account-notice">{copy.privacyMissing}</p>
      )}
      <p>{copy.privacyLead}</p>
      <p>{copy.privacyPurpose}</p>
      <p>{copy.privacyRetention}</p>
      <p>{copy.privacyRights}</p>
      <a className="text-link" href={`/${locale}`}>
        {backLabel} →
      </a>
    </section>
  );
}
