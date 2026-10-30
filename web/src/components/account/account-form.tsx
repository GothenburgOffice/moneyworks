import type { AccountCopy } from '@/content/account';
import type { PrivacyCopy } from '@/content/privacy';
import type { Locale } from '@/content/site';
import type { AccountFormView, AccountMessage } from '@/features/account/view';
import { AccountTabs } from './account-tabs';

type Props = {
  locale: Locale;
  view: AccountFormView;
  title: string;
  copy: AccountCopy;
  privacy: PrivacyCopy;
  disabled: boolean;
  token: string;
  message?: AccountMessage;
  hasError: boolean;
};

export function AccountForm({ locale, view, title, copy, privacy, disabled, token, message, hasError }: Props) {
  const submit: Record<AccountFormView, string> = {
    login: copy.login,
    register: copy.register,
    forgot: copy.sendReset,
    reset: copy.reset,
    resend: copy.sendVerification,
  };
  const needsEmail = view !== 'reset';
  const needsPassword = view === 'login' || view === 'register' || view === 'reset';
  const needsConfirmation = view === 'register' || view === 'reset';

  return (
    <section className="account-form-panel" aria-label={title}>
      <AccountTabs locale={locale} view={view} copy={copy} />
      {message && <p className="account-notice" role="status">{copy[message]}</p>}
      {hasError && <p className="account-notice" role="status">{copy.failed}</p>}
      {disabled && (
        <p className="account-notice">
          {view === 'reset' && !token ? copy.resetMissing : copy.unavailable}
        </p>
      )}
      <form action={`/api/account/${view}`} method="post">
        <input type="hidden" name="locale" value={locale} />
        {view === 'reset' && <input type="hidden" name="token" value={token} />}
        <fieldset disabled={disabled}>
          {needsEmail && (
            <label>
              {copy.email}
              <input type="email" name="email" autoComplete="email" maxLength={254} required />
            </label>
          )}
          {needsPassword && (
            <label>
              {copy.password}
              <input
                type="password"
                name="password"
                minLength={view === 'login' ? 1 : 15}
                maxLength={128}
                autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                aria-describedby={view === 'login' ? undefined : 'password-hint'}
                required
              />
            </label>
          )}
          {needsConfirmation && (
            <>
              <p id="password-hint" className="account-help">{copy.passwordHint}</p>
              <label>
                {copy.confirmPassword}
                <input type="password" name="confirmPassword" minLength={15} maxLength={128} autoComplete="new-password" required />
              </label>
            </>
          )}
          {view === 'register' && (
            <p className="account-help">
              {privacy.privacyAgreement}{' '}
              <a href={`/${locale}/account?view=privacy`}>{privacy.privacy}</a>
            </p>
          )}
          <button className="button-primary account-submit" type="submit">{submit[view]}</button>
        </fieldset>
      </form>
      <div className="account-form-links">
        <a href={`/${locale}/account?view=forgot`}>{copy.forgot}</a>
        <a href={`/${locale}/account?view=resend`}>{copy.resend}</a>
      </div>
      <p className="account-help">{privacy.cookieShort}</p>
    </section>
  );
}
