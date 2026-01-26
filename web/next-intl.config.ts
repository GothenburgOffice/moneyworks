import {getRequestConfig} from "next-intl/server";
import {routing} from "./src/i18n/routing";

export default getRequestConfig(async ({requestLocale}) => {
	let locale = await requestLocale;

  console.log("[next-intl.config] requestLocale:", locale);

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
    console.log("[next-intl.config] Using defaultLocale:", locale);
  }

  console.log("[next-intl.config] Final locale:", locale);
  const msgs = (await import(`./messages/${locale}.json`)).default;
  console.log("[next-intl.config] Loaded messages for locale:", locale, msgs);

  return {
    locale,
    messages: msgs,
