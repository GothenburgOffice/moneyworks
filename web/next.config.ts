import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Same site-wide set as vocabulary-training. Next.js needs inline scripts for
// hydration, and the dev server also needs eval.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// The dev server serves its scripts and hot reload only to localhost unless a
// host is allowed here. Allow the configured origins' hosts (the dev stack adds
// http://127.0.0.1:<port>); malformed entries are skipped, and accounts report them.
const devOriginHosts = [
  process.env.APP_ORIGIN,
  ...(process.env.APP_ORIGIN_ALIASES || "").split(","),
]
  .map((origin) => URL.parse(origin?.trim() || "")?.hostname)
  .filter((host): host is string => Boolean(host));

const nextConfig: NextConfig = {
  allowedDevOrigins: [...new Set(devOriginHosts)],
  // Self-contained server for the release image (see the root Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  // Verification/recovery URLs contain tokens. Do not print incoming URLs in
  // development logs; proxy/hosting logs must separately redact them as well.
  logging: { incomingRequests: false },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
      {
        // Account URLs can carry recovery tokens in the query. strict-origin
        // never sends paths or queries as Referer, not even to this site's own
        // scripts and /api/health, yet keeps the real Origin on form POSTs.
        // Listed last so it overrides the site-wide value for this route.
        source: "/:locale/account",
        headers: [{ key: "Referrer-Policy", value: "strict-origin" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
