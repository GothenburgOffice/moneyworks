import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getDatabaseGreeting } from '@/lib/db';

// Never prerender or cache a successful database check.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations('HomePage');
  let greeting;
  try {
    greeting = await getDatabaseGreeting(locale);
  } catch {
    console.error('Could not read the greeting from PostgreSQL.');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold">
        {greeting ? greeting.message : t('databaseUnavailable')}
      </h1>
      <p className="text-lg text-gray-600">
        {greeting ? t('databaseConnected') : t('databaseError')}
      </p>
      {greeting && (
        <p className="text-sm text-gray-500">
          {t('lastChecked')}: <time dateTime={greeting.checkedAt}>{greeting.checkedAt}</time>
        </p>
      )}
    </main>
  );
}
