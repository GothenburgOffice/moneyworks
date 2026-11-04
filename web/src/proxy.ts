import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { publicPagePaths } from "@/features/tools/catalog";
import { languageLinkHeader, parseLocaleOrigins } from "@/features/site/language-links";

const handleLocale = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = handleLocale(request);
  // Read per request, so one built image serves any deployment's domains while
  // the pages themselves stay static.
  const origins = parseLocaleOrigins(process.env.LOCALE_ORIGINS ?? "", routing.locales);
  const link =
    origins &&
    languageLinkHeader(request.nextUrl.pathname, origins, {
      locales: routing.locales,
      defaultLocale: routing.defaultLocale,
      pagePaths: publicPagePaths,
    });
  if (link) response.headers.append("Link", link);
  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/admin`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|admin|trpc|_next|_vercel|.*\\..*).*)",
};
