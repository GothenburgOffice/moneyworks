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

type MailConfig = Awaited<ReturnType<typeof loadAccountConfig>>;

async function deliver(config: MailConfig, to: string, subject: string, text: string) {
  if (!config.configured) throw new Error("Mail is not configured.");
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
      text,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  } finally {
    transport.close();
  }
}

async function sendAccountEmail(
  config: MailConfig,
  to: string,
  url: string,
  kind: AccountEmailKind,
  locale: string,
) {
  const sv = locale === "sv";
  const [subject, intro] = texts[kind][sv ? "sv" : "en"];
  await deliver(
    config,
    to,
    subject,
    `${intro}\n\n${url}\n\n${sv ? "Om du inte begärde detta kan du ignorera mejlet." : "If you did not request this, you can ignore this email."}`,
  );
}

// The /admin test button: sends with the saved settings and waits for the SMTP
// server's answer. The result is a fixed category, never the server's own text,
// so nothing from the SMTP conversation reaches the page or the URL.
export type TestMailResult =
  "testSent" | "testNotConfigured" | "testAuth" | "testConnection" | "testRejected" | "testFailed";

export async function sendTestEmail(config: MailConfig, to: string): Promise<TestMailResult> {
  if (!config.configured) return "testNotConfigured";
  try {
    await deliver(
      config,
      to,
      "Money Working test email",
      "This is a test email from the site settings page. Mail delivery works.",
    );
    return "testSent";
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    if (code === "EAUTH" || code === "ENOAUTH") return "testAuth";
    if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ETLS", "EPROTOCOL"].includes(String(code)))
      return "testConnection";
    if (code === "EENVELOPE") return "testRejected";
    return "testFailed";
  }
}
