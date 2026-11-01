import "server-only";
import nodemailer from "nodemailer";
import { accountConfig } from "./auth-config";

// SMTP is deliberately the only delivery integration. No hosted mail SDK,
// templates package, tracking pixels, analytics or log containing recovery URLs.
export function queueAccountEmail(
  to: string,
  url: string,
  kind: "verify" | "reset",
  locale: string,
) {
  const config = accountConfig();
  const sv = locale === "sv";
  const subject =
    kind === "verify"
      ? sv
        ? "Bekräfta din e-post för MoneyWorks"
        : "Verify your MoneyWorks email"
      : sv
        ? "Återställ ditt MoneyWorks-lösenord"
        : "Reset your MoneyWorks password";
  const intro =
    kind === "verify"
      ? sv
        ? "Bekräfta din e-postadress med länken nedan."
        : "Verify your email address using the link below."
      : sv
        ? "Använd länken nedan för att välja ett nytt lösenord."
        : "Use the link below to choose a new password.";
  const transport = nodemailer.createTransport({
    host: config.mailHost,
    port: config.mailPort,
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: !config.plainLocalMail,
    ignoreTLS: config.plainLocalMail,
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || "" }
      : undefined,
  });
  // Do not make public reset/registration response time depend on whether an
  // email exists. The owner-hosted process stays alive; delivery errors are safe.
  void transport
    .sendMail({
      from: config.mailFrom,
      to,
      subject,
      text: `${intro}\n\n${url}\n\n${sv ? "Om du inte begärde detta kan du ignorera mejlet." : "If you did not request this, you can ignore this email."}`,
      disableFileAccess: true,
      disableUrlAccess: true,
    })
    .catch(() => console.error("Account email delivery failed; check the SMTP service."))
    .finally(() => transport.close());
}
