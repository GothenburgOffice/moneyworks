type Props = { label: string; compact?: boolean; href?: string };

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M5 32V12c0-3 3-4 5-1l12 19 12-19c2-3 5-2 5 1v20" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5 19 9 14c1 2 3 2 4 0l4-6 4 6c1 2 3 2 4 0l9-14" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandLogo({ label, compact = false, href = '#top' }: Props) {
  return (
    <a className={`brand${compact ? ' brand--footer' : ''}`} href={href} aria-label={label}>
      <BrandMark />
      <span>MoneyWorks<span className="brand-period">.</span></span>
    </a>
  );
}
