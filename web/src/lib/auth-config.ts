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

// Mail and privacy settings are edited at /admin and stored in SiteSetting
// (lib/site-settings.ts loads them); everything else comes from the environment.
export type AccountSettings = {
  controllerName: string;
  contactEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  mailFrom: string;
  allowRegistration: boolean;
};
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
export const validEmail = (value: string) => emailPattern.test(value);

// Configuration is lazy: public SSG never needs auth secrets, SMTP or a database.
// `ready` is enough to sign in (the admin login); `configured` adds mail delivery,
// which public accounts need for verification and recovery.
export function accountConfig(settings: Partial<AccountSettings> = {}) {
  // APP_ORIGIN is the single public origin (used in email links). Aliases are
  // extra exact-match origins, e.g. other domains or http://127.0.0.1 locally.
  const baseURL = parseOrigin(process.env.APP_ORIGIN || "");
  const secure = baseURL.startsWith("https:");
  const aliasEntries = (process.env.APP_ORIGIN_ALIASES || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const aliases = aliasEntries.map(parseOrigin);
  const aliasesWellFormed = aliases.every(Boolean);
  const candidates = [...new Set([baseURL, ...aliases])].filter(Boolean);
  // A request without an Origin header is matched by host, so one host may not
  // appear with two schemes: the cookie mode would then be ambiguous.
  const hostsUnique =
    new Set(candidates.map((origin) => new URL(origin).host)).size === candidates.length;
  const aliasesValid = aliasesWellFormed && hostsUnique;
  const origins = baseURL && aliasesValid ? candidates : [];
  const secret = process.env.AUTH_SECRET || "";
  const mailHost = settings.smtpHost || "";
  const localMail = ["localhost", "127.0.0.1", "::1"].includes(mailHost);
  const plainLocalMail = localMail && process.env.SMTP_ALLOW_LOCAL_PLAINTEXT === "true";
  const mailFrom = settings.mailFrom || "";
  const mailPort = Number(settings.smtpPort || 587);
  const mailUser = settings.smtpUser || "";
  const mailPassword = settings.smtpPassword || "";
  const controller = settings.controllerName || "";
  const contact = settings.contactEmail || "";
  const ready = Boolean(
    baseURL && aliasesValid && secret.length >= 32 && !secret.startsWith("replace-"),
  );
  const configured = Boolean(
    ready &&
    mailHost &&
    Number.isInteger(mailPort) &&
    mailPort > 0 &&
    mailPort <= 65535 &&
    Boolean(mailUser) === Boolean(mailPassword) &&
    validEmail(mailFrom),
  );
  const privacyReady = Boolean(controller.trim() && validEmail(contact));
  // The devcontainer and CI use reserved example domains for their fake details.
  const placeholderPrivacy = /@(.+\.)?(example(\.(com|net|org))?|test|invalid|localhost)$/i.test(
    contact,
  );
  // Public registration is switched on at /admin, and only counts with mail and a
  // real privacy controller. ALLOW_REGISTRATION is set only by the devcontainer and
  // the test fixture, never .env: it forces registration on for development.
  const forcedRegistration = process.env.ALLOW_REGISTRATION === "true";
  const registrationAllowed =
    forcedRegistration || (Boolean(settings.allowRegistration) && !placeholderPrivacy);
  return {
    baseURL,
    origins,
    // Shown in the 503 so an operator can tell a malformed alias from missing setup.
    problem: !aliasesWellFormed
      ? "Account service is misconfigured: APP_ORIGIN_ALIASES contains a malformed origin."
      : !hostsUnique
        ? "Account service is misconfigured: APP_ORIGIN and APP_ORIGIN_ALIASES list the same host with different schemes."
        : "Account service is not configured.",
    secure,
    secret,
    ready,
    configured,
    privacyReady,
    controller,
    contact,
    placeholderPrivacy,
    forcedRegistration,
    // What /admin requires before public registration can be switched on.
    registrationPossible: configured && privacyReady && !placeholderPrivacy,
    registrationEnabled: configured && privacyReady && registrationAllowed,
    cookiePrefix: cookiePrefix(secure),
    mailHost,
    mailFrom,
    mailPort,
    mailSecure: Boolean(settings.smtpSecure),
    mailUser,
    mailPassword,
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
