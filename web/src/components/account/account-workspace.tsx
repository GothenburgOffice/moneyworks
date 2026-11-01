import type { AccountCopy } from "@/content/account";
import type { Locale } from "@/content/site";

type Props = {
  locale: Locale;
  copy: AccountCopy;
  privacyLabel: string;
  user: { email: string; emailVerified: boolean };
};

export function AccountWorkspace({ locale, copy, privacyLabel, user }: Props) {
  return (
    <section className="account-workspace">
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
          <p>{copy.emailMethod}</p>
          <p className="account-muted">{copy.laterProviders}</p>
        </section>
        <section>
          <h2>{copy.security}</h2>
          <p>{copy.securityBody}</p>
          <a href={`/${locale}/account?view=forgot`}>{copy.forgot}</a>
        </section>
      </div>
      <a className="text-link" href={`/${locale}/account?view=privacy`}>
        {privacyLabel} →
      </a>
    </section>
  );
}
