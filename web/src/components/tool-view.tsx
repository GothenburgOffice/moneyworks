import type { ReactNode } from "react";
import type { ToolId } from "@/features/tools/catalog";

type ToolViewProps = {
  id: ToolId;
  backHref: string;
  label: string;
  back: string;
  titleLead: string;
  titleEnd: string;
  description: string;
  facts: readonly string[];
  children: ReactNode;
};

/** Static, reusable tool shell: banner with a way back to the hub, then the workspace. */
export function ToolView({
  id,
  backHref,
  label,
  back,
  titleLead,
  titleEnd,
  description,
  facts,
  children,
}: ToolViewProps) {
  return (
    <section data-tool-panel={id} aria-labelledby={`${id}-page-title`}>
      <header className="tool-banner page-width">
        <a className="tool-back" href={backHref}>
          <span aria-hidden="true">←</span> {back}
        </a>
        <div className="tool-banner-body">
          <div className="intro-copy">
            <p className="tool-eyebrow">{label}</p>
            <h1 id={`${id}-page-title`}>
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
