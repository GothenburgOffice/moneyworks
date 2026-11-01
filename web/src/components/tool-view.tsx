import type { ReactNode } from "react";
import type { ToolId } from "@/features/tools/catalog";

type ToolViewProps = {
  id: ToolId;
  anchor: string;
  label: string;
  back: string;
  titleLead: string;
  titleEnd: string;
  description: string;
  facts: readonly string[];
  children: ReactNode;
};

/** Static, reusable tool shell. Native hash navigation owns the active view. */
export function ToolView({
  id,
  anchor,
  label,
  back,
  titleLead,
  titleEnd,
  description,
  facts,
  children,
}: ToolViewProps) {
  return (
    <section id={anchor} data-tool-panel={id} aria-labelledby={`${id}-page-title`} tabIndex={-1}>
      <header className="tool-banner page-width">
        <a className="tool-back" href="#tools">
          <span aria-hidden="true">←</span> {back}
        </a>
        <div className="tool-banner-body">
          <div className="intro-copy">
            <p className="tool-eyebrow">{label}</p>
            <h1 id={`${id}-page-title`} tabIndex={-1} data-tool-title>
              <span>{titleLead}</span> <span>{titleEnd}</span>
            </h1>
            <p>{description}</p>
          </div>
          <ul className="tool-banner-facts">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      </header>
      {children}
    </section>
  );
}
