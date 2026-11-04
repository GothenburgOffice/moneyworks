import type { Locale, SiteCopy } from "@/content/site";
import { getTools, toolPath } from "@/features/tools/catalog";
import { ToolCard } from "./tool-card";

export function ToolsSection({ copy, locale }: { copy: SiteCopy["tools"]; locale: Locale }) {
  return (
    <section className="tools-section page-width" id="tools" aria-labelledby="tools-heading">
      <div className="section-heading">
        <h2 id="tools-heading">{copy.title}</h2>
        <p>{copy.description}</p>
      </div>
      <div className="tools-grid">
        {getTools(copy).map((tool) => (
          <ToolCard
            key={tool.id}
            id={tool.id}
            tool={tool.content}
            statusLabel={tool.status === "available" ? copy.available : copy.planned}
            details={copy.details}
            action={
              tool.status === "available"
                ? { href: toolPath(locale, tool.id), label: copy.open }
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
