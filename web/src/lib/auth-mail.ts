import "server-only";
import nodemailer from "nodemailer";
import { loadAccountConfig } from "./site-settings";

// SMTP is deliberately the only delivery integration. No hosted mail SDK,
// templates package, tracking pixels, analytics or log containing recovery URLs.
// verify/reset carry a token link; existing (someone tried to register this address
// again) and google (recovery asked for a Google account) carry the sign-in page.
export type AccountEmailKind = "verify" | "reset" | "existing" | "google";
const texts: Record<AccountEmailKind, { en: [string, string]; sv: [string, string] }> = {
  verify: {
    en: ["Verify your Money Working email", "Verify your email address using the link below."],
    sv: ["Bekräfta din e-post för Pengar jobbar", "Bekräfta din e-postadress med länken nedan."],
  },
  reset: {
    en: ["Reset your Money Working password", "Use the link below to choose a new password."],
    sv: [
      "Återställ ditt lösenord för Pengar jobbar",
      "Använd länken nedan för att välja ett nytt lösenord.",
    ],
  },
  existing: {
    en: [
      "You already have a Money Working account",
      "Someone tried to create an account with this address, but it already has one. Sign in on the page below. Forgot your password? Choose \u201cForgot your password?\u201d there.",
    ],
    sv: [
      "Du har redan ett konto hos Pengar jobbar",
      "Någon försökte skapa ett konto med den här adressen, men den har redan ett. Logga in på sidan nedan. Glömt lösenordet? Välj \u201dGlömt lösenordet?\u201d där.",
    ],
  },
  google: {
    en: [
      "Sign in to Money Working with Google",
      "Your account signs in with Google and has no password to reset. Choose \u201cContinue with Google\u201d on the page below.",
    ],
    sv: [
      "Logga in hos Pengar jobbar med Google",
      "Ditt konto loggar in med Google och har inget lösenord att återställa. Välj \u201dFortsätt med Google\u201d på sidan nedan.",
    ],
  },
};

export function queueAccountEmail(to: string, url: string, kind: AccountEmailKind, locale: string) {
  // Do not make public reset/registration response time depend on whether an
  // email exists. The owner-hosted process stays alive; delivery errors are safe.
  void loadAccountConfig()
    .then((config) => sendAccountEmail(config, to, url, kind, locale))
    .catch(() => console.error("Account email delivery failed; check the SMTP service."));
}

async function sendAccountEmail(
  config: Awaited<ReturnType<typeof loadAccountConfig>>,
  to: string,
  url: string,
  kind: AccountEmailKind,
  locale: string,
) {
  if (!config.configured) throw new Error("Mail is not configured.");
  const sv = locale === "sv";
  const [subject, intro] = texts[kind][sv ? "sv" : "en"];
  const transport = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    secure: config.mailSecure,
    requireTLS: !config.plainLocalMail,
    ignoreTLS: config.plainLocalMail,
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
    auth: config.mailUser ? { user: config.mailUser, pass: config.mailPassword } : undefined,
  });
  try {
    await transport.sendMail({
      from: config.mailFrom,
      to,
      subject,
      text: `${intro}\n\n${url}\n\n${sv ? "Om du inte begärde detta kan du ignorera mejlet." : "If you did not request this, you can ignore this email."}`,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  } finally {
    transport.close();
  }
}
