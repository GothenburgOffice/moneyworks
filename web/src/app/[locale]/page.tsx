import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getSiteCopy } from '@/content/site';
import { SiteHeader } from '@/components/site-header';
import { IntroSection } from '@/components/intro-section';
import { ToolsSection } from '@/components/tools-section';
import { LearnSection } from '@/components/learn-section';
import { AboutSection } from '@/components/about-section';
import { SiteFooter } from '@/components/site-footer';

export const dynamic = 'force-static';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('title'),
    description: t('description'),
    icons: { icon: '/moneyworks-mark.svg' },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const language = locale === 'sv' ? 'sv' : 'en';
  const copy = getSiteCopy(language);
  const status = await getTranslations('ConnectionStatus');

  return (
    <div id="top">
      <a className="skip-link" href="#main-content">{copy.skip}</a>
      <SiteHeader copy={copy} locale={language} />
      <main id="main-content">
        <IntroSection copy={copy.intro} />
        <ToolsSection copy={copy.tools} />
        <LearnSection copy={copy.learn} />
        <AboutSection copy={copy.about} />
      </main>
      <SiteFooter copy={copy} status={{
        databaseChecking: status('databaseChecking'),
        databaseConnected: status('databaseConnected'),
        databaseUnavailable: status('databaseUnavailable'),
      }} />
      <script src="/db-status.js" data-health-url="/api/health/db" defer />
      <script src="/site-ui.js" defer />
    </div>
  );
}
