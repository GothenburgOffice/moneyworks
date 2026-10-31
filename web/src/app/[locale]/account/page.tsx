import { headers } from 'next/headers';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getSiteCopy } from '@/content/site';
import { getBrand } from '@/content/brand';
import { getAccountCopy } from '@/content/account';
import { getPrivacyCopy } from '@/content/privacy';
import { parseAccountQuery } from '@/features/account/view';
import { accountConfig } from '@/lib/auth-config';
import { getAuth } from '@/lib/auth';
import { AccountEntry } from '@/components/account/account-entry';
import { AccountWorkspace } from '@/components/account/account-workspace';
import { PrivacyContent } from '@/components/privacy/privacy-content';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import '@/styles/account.css';
import '@/styles/privacy.css';

export const dynamic = 'force-dynamic';
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const language = locale === 'sv' ? 'sv' : 'en';
  return {
    title: `${getBrand(language).name} | ${getAccountCopy(language).account}`,
    icons: { icon: getBrand(language).icon },
    robots: { index: false, follow: false },
    referrer: 'strict-origin',
  };
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const language = locale === 'sv' ? 'sv' : 'en';
  const site = getSiteCopy(language);
  const copy = getAccountCopy(language);
  const privacy = getPrivacyCopy(language);
  const { view, message, token, hasError } = parseAccountQuery(await searchParams);
  const config = accountConfig();
  const session = view !== 'privacy' && config.configured
    ? await getAuth().api.getSession({ headers: await headers() }) : null;
  const status = await getTranslations('ConnectionStatus');
  const disabled = !config.configured
    || (view === 'register' && !config.registrationEnabled)
    || (view === 'reset' && !token);

  let content;
  if (view === 'privacy') {
    content = (
      <PrivacyContent
        locale={language}
        copy={privacy}
        backLabel={copy.back}
        controller={config.privacyReady ? { name: config.controller, contact: config.contact } : undefined}
      />
    );
  } else if (session && (view === 'login' || view === 'register')) {
    content = (
      <AccountWorkspace
        locale={language}
        copy={copy}
        privacyLabel={privacy.privacy}
        user={{ email: session.user.email, emailVerified: session.user.emailVerified }}
      />
    );
  } else {
    content = (
      <AccountEntry
        locale={language}
        view={view}
        copy={copy}
        privacy={privacy}
        disabled={disabled}
        token={token}
        message={message}
        hasError={hasError}
      />
    );
  }

  return (
    <div id="top">
      <a className="skip-link" href="#main-content">{site.skip}</a>
      <SiteHeader
        copy={site}
        locale={language}
        homeHref={`/${language}`}
        localeSuffix={`/account?view=${view}${view === 'reset' && token ? `&token=${encodeURIComponent(token)}` : ''}`}
      />
      <main id="main-content" className="account-page page-width" data-ui>{content}</main>
      <SiteFooter
        copy={site}
        locale={language}
        status={{
          databaseChecking: status('databaseChecking'),
          databaseConnected: status('databaseConnected'),
          databaseUnavailable: status('databaseUnavailable'),
        }}
      />
      <script src="/db-status.js" data-health-url="/api/health/db" defer />
      <script src="/site-ui.js" defer />
    </div>
  );
}
