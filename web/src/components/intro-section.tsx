import type { SiteCopy } from '@/content/site';
import { ArrowIcon } from './ui-icons';
import { BrandMark } from './brand-logo';

export function IntroSection({ copy }: { copy: SiteCopy['intro'] }) {
  return (
    <section className="intro-section page-width" aria-labelledby="page-title">
      <div className="intro-copy">
        <h1 id="page-title"><span>{copy.titleLead}</span>{' '}<span>{copy.titleEnd}</span></h1>
        <p>{copy.description}</p>
        <a className="button-primary" href="#tools">{copy.action}<ArrowIcon /></a>
      </div>
      <aside className="intro-art" aria-labelledby="start-heading">
        <h2 id="start-heading" className="sr-only">{copy.asideTitle}</h2>
        <div className="intro-mark" aria-hidden="true"><BrandMark /></div>
        <a className="intro-signal intro-signal--future" href="#fire">
          <ArrowIcon diagonal />
          <span><span className="signal-caption">{copy.future}</span><strong>{copy.futureLink}</strong></span>
        </a>
        <a className="intro-signal intro-signal--trades" href="#crypto">
          <ArrowIcon />
          <span><span className="signal-caption">{copy.trades}</span><strong>{copy.tradesLink}</strong></span>
        </a>
      </aside>
    </section>
  );
}
