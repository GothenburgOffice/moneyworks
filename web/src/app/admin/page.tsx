import { headers } from "next/headers";
import { accountConfig, requestOrigin } from "@/lib/auth-config";
import { currentAdmin } from "@/lib/admin";
import { loadAccountConfig, readSettingsView } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  failed: "Sign-in failed.",
  tooMany: "Too many attempts. Wait a minute and try again.",
  signedOut: "Signed out.",
  saved: "Settings saved.",
  invalid: "Not saved: check the email addresses and the port.",
  noEncryptionKey:
    "Not saved: set SETTINGS_ENCRYPTION_KEY (32 random bytes, base64) in .env and restart to store the SMTP password.",
  registrationBlocked:
    "Not saved: public registration needs working mail and real privacy details first.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string | string[] }>;
}) {
  const { message } = await searchParams;
  const notice = typeof message === "string" ? messages[message] : undefined;
  const config = accountConfig();
  if (!config.ready)
    return (
      <>
        <h1>Admin</h1>
        <p>Set APP_ORIGIN and AUTH_SECRET (at least 32 characters) in .env, then restart.</p>
      </>
    );
  const requestHeaders = await headers();
  const admin = await currentAdmin(
    requestOrigin(config, requestHeaders) || config.baseURL,
    requestHeaders,
  );

  if (!admin)
    return (
      <>
        <h1>Admin sign-in</h1>
        {notice && <p role="status">{notice}</p>}
        <form method="post" action="/api/admin/login" className="admin-form">
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Sign in</button>
        </form>
      </>
    );

  const [settings, account] = await Promise.all([readSettingsView(), loadAccountConfig()]);
  const missing = [
    !account.configured && "working mail (host, port and from address; user and password together)",
    !account.privacyReady && "the privacy controller's name and contact email",
    account.privacyReady &&
      account.placeholderPrivacy &&
      "real privacy details instead of the example ones",
  ].filter(Boolean);
  const password = {
    unset: "not set",
    set: "set (leave blank to keep it)",
    unreadable: "stored, but unreadable with the current SETTINGS_ENCRYPTION_KEY",
  }[settings.smtpPassword];
  return (
    <>
      <h1>Site settings</h1>
      <form method="post" action="/api/admin/logout" className="admin-inline">
        Signed in as {admin.email}. <button type="submit">Sign out</button>
      </form>
      {notice && <p role="status">{notice}</p>}
      <form method="post" action="/api/admin/settings" className="admin-form">
        <fieldset>
          <legend>Privacy controller (shown on the privacy page; required for registration)</legend>
          <label>
            Name
            <input name="controllerName" defaultValue={settings.controllerName} />
          </label>
          <label>
            Contact email
            <input name="contactEmail" type="email" defaultValue={settings.contactEmail} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Mail (SMTP; required for accounts)</legend>
          <label>
            Host
            <input name="smtpHost" defaultValue={settings.smtpHost} />
          </label>
          <label>
            Port
            <input
              name="smtpPort"
              inputMode="numeric"
              placeholder="587"
              defaultValue={settings.smtpPort}
            />
          </label>
          <label className="admin-check">
            <input name="smtpSecure" type="checkbox" defaultChecked={settings.smtpSecure} />
            Implicit TLS (usually port 465)
          </label>
          <label>
            User
            <input name="smtpUser" autoComplete="off" defaultValue={settings.smtpUser} />
          </label>
          <label>
            Password: {password}
            <input
              name="smtpPassword"
              type="password"
              autoComplete="new-password"
              disabled={!settings.encryptionReady}
            />
          </label>
          {!settings.encryptionReady && (
            <p>Set SETTINGS_ENCRYPTION_KEY in .env and restart to store an SMTP password.</p>
          )}
          {settings.smtpPassword !== "unset" && (
            <label className="admin-check">
              <input name="clearSmtpPassword" type="checkbox" />
              Remove the stored password
            </label>
          )}
          <label>
            From address
            <input name="mailFrom" type="email" defaultValue={settings.mailFrom} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Registration</legend>
          {account.forcedRegistration && (
            <p>Always on in this development or test environment, whatever is saved here.</p>
          )}
          {!account.registrationPossible && (
            <p>
              Public registration can be switched on once these are saved: {missing.join("; ")}.
            </p>
          )}
          <label className="admin-check">
            <input
              name="allowRegistration"
              type="checkbox"
              defaultChecked={settings.allowRegistration}
              disabled={!account.registrationPossible}
            />
            Allow public registration
          </label>
        </fieldset>
        <button type="submit">Save</button>
      </form>
    </>
  );
}
