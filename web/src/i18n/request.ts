import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  console.log('[REQUEST CONFIG] requestLocale (raw):', requestLocale, typeof requestLocale);
  
  // requestLocale might be a Promise
  let locale = await requestLocale;
  console.log('[REQUEST CONFIG] requestLocale (awaited):', locale, typeof locale);
  console.log('[REQUEST CONFIG] available locales:', routing.locales);
  console.log('[REQUEST CONFIG] hasLocale check:', hasLocale(routing.locales, locale));
  
  // Validate and normalize the locale
  if (!hasLocale(routing.locales, locale)) {
    console.log('[REQUEST CONFIG] Invalid locale, using default');
    locale = routing.defaultLocale;
  }

  console.log('[REQUEST CONFIG] Final locale:', locale);

  // Load messages for the determined locale
  const messages = (await import(`../../messages/${locale}.json`)).default;
  console.log('[REQUEST CONFIG] Loaded messages for:', locale);

  return {
    locale,
    messages,
  };
});
