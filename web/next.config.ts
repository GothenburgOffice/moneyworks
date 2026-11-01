import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Self-contained server for the release image (see the root Dockerfile).
  output: 'standalone',
  // Verification/recovery URLs contain tokens. Do not print incoming URLs in
  // development logs; proxy/hosting logs must separately redact them as well.
  logging: { incomingRequests: false },
  async headers() {
    return [{
      source: '/:locale/account',
      headers: [
        { key: 'Referrer-Policy', value: 'strict-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      ],
    }];
  },
};

export default withNextIntl(nextConfig);
