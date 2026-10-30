import type { ComponentProps } from 'react';
import type { AccountFormView } from '@/features/account/view';
import { AccountForm } from './account-form';

type Props = Omit<ComponentProps<typeof AccountForm>, 'title'>;

export function AccountEntry(props: Props) {
  const { locale, view, copy } = props;
  const titles: Record<AccountFormView, string> = {
    login: copy.loginTitle,
    register: copy.registerTitle,
    forgot: copy.forgotTitle,
    reset: copy.resetTitle,
    resend: copy.resendTitle,
  };
  const intro = view === 'register' ? copy.registerIntro
    : view === 'forgot' ? copy.forgotIntro : copy.loginIntro;

  return (
    <div className="account-entry">
      <section className="account-intro">
        <p className="account-kicker">MoneyWorks</p>
        <h1>{titles[view]}</h1>
        <p>{intro}</p>
        <a className="text-link" href={`/${locale}`}>{copy.back} →</a>
      </section>
      <AccountForm {...props} title={titles[view]} />
    </div>
  );
}
