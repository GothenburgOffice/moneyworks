import type { AccountCopy } from '@/content/account';
import type { Locale } from '@/content/site';
import type { AccountFormView } from '@/features/account/view';

type Props = { locale: Locale; view: AccountFormView; copy: AccountCopy };

export function AccountTabs({ locale, view, copy }: Props) {
  return (
    <nav className="account-tabs" aria-label={copy.account}>
      <a href={`/${locale}/account?view=login`} aria-current={view === 'login' ? 'page' : undefined}>
        {copy.login}
      </a>
      <a href={`/${locale}/account?view=register`} aria-current={view === 'register' ? 'page' : undefined}>
        {copy.register}
      </a>
    </nav>
  );
}
