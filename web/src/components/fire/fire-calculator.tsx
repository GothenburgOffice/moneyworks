import type { Locale } from "@/content/site";
import { getFireCopy } from "@/content/fire";
import { ToolDemo } from "@/components/tool-demo";
import { getFireDemoCopy } from "@/content/fire-demo";
import { FireWorkspace } from "./fire-workspace";
import "@/styles/fire.css";

// The heading, walkthrough and method stay server-rendered; only the
// workspace hydrates as a client component.
export function FireCalculator({ locale }: { locale: Locale }) {
  const copy = getFireCopy(locale);
  const demo = getFireDemoCopy(locale);
  return (
    <section
      id="fire-workspace"
      className="fire-calculator page-width"
      aria-labelledby="fire-heading"
      data-fire
      data-ui
    >
      <div className="fire-heading">
        <h2 id="fire-heading">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>
      <ToolDemo
        id="fire-demo"
        title={demo.watch}
        label={demo.label}
        note={demo.note}
        example={demo.example}
        downloadLabel={demo.download}
        transcriptLabel={demo.transcript}
        steps={demo.steps}
        source="/media/fire-demo.mp4?v=whole-units-90"
        poster="/media/fire-demo-poster.webp?v=whole-units-90"
        subtitles={["en", "sv"].map((language) => ({
          language,
          label: language === "sv" ? "Svenska" : "English",
          source: `/media/fire-demo.${language}.vtt?v=whole-units-90`,
          default: false,
        }))}
      />
      <FireWorkspace copy={copy} locale={locale} />
      <details className="fire-method">
        <summary>{copy.method}</summary>
        <p>{copy.methodBody}</p>
        <p>{copy.methodFormula}</p>
      </details>
    </section>
  );
}
