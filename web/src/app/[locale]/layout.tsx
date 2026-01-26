import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import enMessages from '../../../messages/en.json';
import svMessages from '../../../messages/sv.json';
import '../globals.css';

const messages: Record<string, any> = {
  en: enMessages,
  sv: svMessages,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  // Ensure that the incoming locale is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const localeMessages = messages[locale] || messages.en;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={localeMessages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
