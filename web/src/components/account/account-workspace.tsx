import Link from "next/link";
import type { AccountCopy } from "@/content/account";
import type { Locale } from "@/content/site";
import type { AccountMessage } from "@/features/account/view";

type Props = {
  locale: Locale;
  copy: AccountCopy;
  privacyLabel: string;
  /** Feedback from a form posted while signed in, such as a refused deletion. */
  message?: AccountMessage;
  user: { email: string; emailVerified: boolean };
  methods: { password: boolean; google: boolean };
  /** Admins get a link to the site settings at /admin. */
  isAdmin: boolean;
  /** Google sign-in is available, so a password member may switch to it. */
  googleAvailable: boolean;
};

export function AccountWorkspace({
  locale,
  copy,
  privacyLabel,
  message,
  user,
  methods,
  isAdmin,
  googleAvailable,
}: Props) {
  return (
    <section className="account-workspace">
      {message && (
        <p className="account-notice" role="status">
          {copy[message]}
        </p>
      )}
      <div className="account-workspace-heading">
        <div>
          <p className="account-kicker">{copy.account}</p>
          <h1>{copy.futureTitle}</h1>
        </div>
        <form action="/api/account/logout" method="post">
          <input type="hidden" name="locale" value={locale} />
          <button className="account-secondary" type="submit">
            {copy.logout}
          </button>
        </form>
      </div>
      <div className="account-identity">
        <p>{copy.signedIn}</p>
        <strong>{user.email}</strong>
        {user.emailVerified && <span>{copy.verified}</span>}
      </div>
      <p className="account-empty-state">{copy.futureBody}</p>
      <div className="account-workspace-grid">
        <section>
          <h2>{copy.methods}</h2>
          {methods.password && <p>{copy.emailMethod}</p>}
          {methods.google && <p>{copy.googleMethod}</p>}
          {googleAvailable && !methods.google && (
            <form action="/api/account/google" method="post" className="account-provider">
              <input type="hidden" name="locale" value={locale} />
              <p className="account-muted">{copy.addGoogleHint}</p>
              <button className="account-secondary" type="submit">
                {copy.addGoogle}
              </button>
            </form>
          )}
        </section>
        <section>
          <h2>{copy.security}</h2>
          {methods.password ? (
            <>
              <p>{copy.securityBody}</p>
              <a href={`/${locale}/account?view=forgot`}>{copy.forgot}</a>
            </>
          ) : (
            <p>{copy.googleSecurity}</p>
          )}
        </section>
        <section>
          <h2>{copy.dataTitle}</h2>
          <p>{copy.dataBody}</p>
          <a className="account-secondary account-action" href="/api/account/export" download>
            {copy.exportData}
          </a>
        </section>
        <section className="account-danger" aria-labelledby="delete-account">
          <h2 id="delete-account">{copy.deleteTitle}</h2>
          <p>{copy.deleteBody}</p>
          <form action="/api/account/delete" method="post">
            <input type="hidden" name="locale" value={locale} />
            {methods.password ? (
              <label>
                {copy.password}
                <input
                  type="password"
                  name="password"
                  maxLength={128}
                  autoComplete="current-password"
                  required
                />
              </label>
            ) : (
              <p className="account-muted">{copy.deleteGoogleHint}</p>
            )}
            <label className="account-check">
              <input type="checkbox" name="confirm" required />
              {copy.deleteConfirmLabel}
            </label>
            <button className="account-secondary account-delete" type="submit">
              {copy.deleteAccount}
            </button>
          </form>
        </section>
      </div>
      {isAdmin && (
        <p>
          <Link className="text-link" href="/admin">
            {copy.siteSettings} →
          </Link>
        </p>
      )}
      <a className="text-link" href={`/${locale}/account?view=privacy`}>
        {privacyLabel} →
      </a>
    </section>
  );
}
