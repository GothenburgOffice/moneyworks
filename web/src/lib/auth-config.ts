// Exact origin, or "" unless it is HTTPS (or HTTP on loopback) without
// credentials, path, query or fragment. Fail closed rather than guess a host.
export function parseOrigin(raw: string) {
  try {
    const url = new URL(raw);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol === "https:" || (url.protocol === "http:" && loopback)) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    )
      return url.origin;
  } catch {
    /* Not a URL. */
  }
  return "";
}

// Configuration is lazy: public SSG never needs auth secrets, SMTP or a database.
export function accountConfig() {
  // APP_ORIGIN is the single public origin (used in email links). Aliases are
  // extra exact-match origins, e.g. other domains or http://127.0.0.1 locally.
  const baseURL = parseOrigin(process.env.APP_ORIGIN || "");
  const secure = baseURL.startsWith("https:");
  const aliasEntries = (process.env.APP_ORIGIN_ALIASES || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const aliases = aliasEntries.map(parseOrigin);
  const aliasesValid = aliases.every(Boolean);
  const origins = baseURL && aliasesValid ? [...new Set([baseURL, ...aliases])] : [];
  const secret = process.env.AUTH_SECRET || "";
  const mailHost = process.env.SMTP_HOST || "";
  const localMail = ["localhost", "127.0.0.1", "::1"].includes(mailHost);
  const plainLocalMail = localMail && process.env.SMTP_ALLOW_LOCAL_PLAINTEXT === "true";
  const mailFrom = process.env.MAIL_FROM || "";
  const mailPort = Number(process.env.SMTP_PORT || 587);
  const controller = process.env.PRIVACY_CONTROLLER_NAME || "";
  const contact = process.env.PRIVACY_CONTACT_EMAIL || "";
  const configured = Boolean(
    baseURL &&
    aliasesValid &&
    secret.length >= 32 &&
    !secret.startsWith("replace-") &&
    mailHost &&
    Number.isInteger(mailPort) &&
    mailPort > 0 &&
    mailPort <= 65535 &&
    Boolean(process.env.SMTP_USER) === Boolean(process.env.SMTP_PASSWORD) &&
    /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(mailFrom),
  );
  const privacyReady = Boolean(
    controller.trim() && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(contact),
  );
  return {
    baseURL,
    origins,
    // Shown in the 503 so an operator can tell a malformed alias from missing setup.
    problem: aliasesValid
      ? "Account service is not configured."
      : "Account service is misconfigured: APP_ORIGIN_ALIASES contains a malformed origin.",
    secure,
    secret,
    configured,
    privacyReady,
    controller,
    contact,
    registrationEnabled: configured && privacyReady && process.env.ALLOW_REGISTRATION === "true",
    cookiePrefix: cookiePrefix(secure),
    mailHost,
    mailFrom,
    mailPort,
    plainLocalMail,
  };
}

function cookiePrefix(secure: boolean) {
  return secure ? "__Host-moneyworks" : "moneyworks-dev";
}

// The origin a request belongs to: its Origin header when that is allowed
// ("" when it is not), otherwise the allowed origin matching its Host header,
// otherwise APP_ORIGIN. The scheme always comes from configuration.
export function requestOrigin(
  config: Pick<ReturnType<typeof accountConfig>, "baseURL" | "origins">,
  headers: Headers,
) {
  const origin = headers.get("origin");
  if (origin) return config.origins.includes(origin) ? origin : "";
  const host = headers.get("host");
  return config.origins.find((allowed) => new URL(allowed).host === host) ?? config.baseURL;
}

// Secure follows the request's own origin, so HTTP loopback aliases still work.
export function authCookieOptions(config: Pick<ReturnType<typeof accountConfig>, "secure">) {
  return {
    useSecureCookies: false,
    cookiePrefix: cookiePrefix(config.secure),
    defaultCookieAttributes: {
      secure: config.secure,
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}
