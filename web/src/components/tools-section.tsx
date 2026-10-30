import type { SiteCopy } from '@/content/site';
import { ToolCard } from './tool-card';

export function ToolsSection({ copy }: { copy: SiteCopy['tools'] }) {
  return (
    <section className="tools-section page-width" id="tools" aria-labelledby="tools-heading">
      <div className="section-heading"><h2 id="tools-heading">{copy.title}</h2><p>{copy.description}</p></div>
      <div className="tools-grid">
        <ToolCard id="fire" tool={copy.fire} planned={copy.planned} details={copy.details} />
        <ToolCard id="crypto" tool={copy.crypto} planned={copy.planned} details={copy.details} />
      </div>
    </section>
  );
}
