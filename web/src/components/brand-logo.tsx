import { getBrand } from '@/content/brand';
import type { Locale } from '@/content/site';

type Props = { locale: Locale; label: string; compact?: boolean; href?: string };

export function BrandMark({ locale }: { locale: Locale }) {
  return (
    <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      {getBrand(locale).paths.map((path) => (
        <path key={path} d={path} stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function BrandLogo({ locale, label, compact = false, href = '#top' }: Props) {
  return (
    <a className={`brand${compact ? ' brand--footer' : ''}`} data-brand={locale} href={href} aria-label={label}>
      <BrandMark locale={locale} />
      <span className="brand-name">{getBrand(locale).name}<span className="brand-period">.</span></span>
    </a>
  );
}
