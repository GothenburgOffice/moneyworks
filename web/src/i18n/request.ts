import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate and normalize the locale
  if (!hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  // Load messages for the determined locale
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
