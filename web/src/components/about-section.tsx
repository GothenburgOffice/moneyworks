import type { Locale, SiteCopy } from '@/content/site';
import { BrandMark } from './brand-logo';
import { ArrowIcon } from './ui-icons';

export function AboutSection({ copy, locale }: { copy: SiteCopy['about']; locale: Locale }) {
  return (
    <section className="about-band" id="about" aria-labelledby="about-heading">
      <div className="about-section page-width">
      <div className="about-title"><BrandMark locale={locale} /><h2 id="about-heading">{copy.title}</h2></div>
      <div className="about-copy"><p>{copy.description}</p><a className="text-link" href="#tools">{copy.link}<ArrowIcon /></a></div>
      </div>
    </section>
  );
}
