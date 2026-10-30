import type { SiteCopy } from '@/content/site';
import { PlusIcon } from './ui-icons';

type Props = {
  id: string;
  tool: SiteCopy['tools']['fire'];
  planned: string;
  details: string;
};

export function ToolCard({ id, tool, planned, details }: Props) {
  return (
    <article className={`tool-card tool-card--${id}`} id={id} aria-labelledby={`${id}-title`}>
      <div className="tool-card-top">
        <span className="tool-category">{tool.category}</span>
        <span className="planned-label"><span aria-hidden="true" />{planned}</span>
      </div>
      <h3 id={`${id}-title`}>{tool.title}</h3>
      <p className="tool-description">{tool.description}</p>
      <p className="tool-context">{tool.context}</p>
      <details className="tool-details">
        <summary>{details}<PlusIcon /></summary>
        <div className="tool-detail-body">
          <h4>{tool.detailTitle}</h4>
          <ul>{tool.items.map(item => <li key={item}>{item}</li>)}</ul>
          <p>{tool.note}</p>
        </div>
      </details>
    </article>
  );
}
