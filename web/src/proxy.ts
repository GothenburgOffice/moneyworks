import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { publicPagePaths } from "@/features/tools/catalog";
import {
  homeRedirect,
  languageLinkHeader,
  parseLocaleOrigins,
} from "@/features/site/language-links";

const handleLocale = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Read per request, so one built image serves any deployment's domains while
  // the pages themselves stay static.
  const origins = parseLocaleOrigins(process.env.LOCALE_ORIGINS ?? "", routing.locales);
  // A language's home domain opens in that language when the URL names none (decision #83).
  const target =
    origins &&
    homeRedirect(
      {
        pathname: request.nextUrl.pathname,
        search: request.nextUrl.search,
        host: request.headers.get("host") ?? "",
      },
      origins,
      routing.locales,
    );
  if (target) {
    // A relative Location keeps the public scheme and host, which this server only sees as http.
    return new NextResponse(null, { status: 307, headers: { Location: target } });
  }
  const response = handleLocale(request);
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
