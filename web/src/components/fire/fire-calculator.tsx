import type { Locale } from "@/content/site";
import { getFireCopy } from "@/content/fire";
import { FireFields } from "./fire-fields";
import { PensionEditor } from "./pension-editor";
import { FireResults } from "./fire-results";
import { ToolDemo } from "@/components/tool-demo";
import { getFireDemoCopy } from "@/content/fire-demo";
import "@/styles/fire.css";

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
      data-fire-locale={locale}
      data-fire-copy={JSON.stringify(copy)}
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
      <div className="fire-workspace">
        <form className="fire-form" action="#fire-calculator" autoComplete="off" data-fire-form>
          <fieldset className="fire-choice">
            <legend>{copy.question}</legend>
            <label>
              <input type="radio" name="fire-goal" value="portfolio" defaultChecked />
              {copy.portfolioGoal}
            </label>
            <label>
              <input type="radio" name="fire-goal" value="age" />
              {copy.ageGoal}
            </label>
          </fieldset>
          <fieldset className="fire-choice">
            <legend>{copy.strategy}</legend>
            <label>
              <input type="radio" name="fire-strategy" value="drawdown" defaultChecked />
              {copy.drawdown}
            </label>
            <label>
              <input type="radio" name="fire-strategy" value="preserve" />
              {copy.preserve}
            </label>
          </fieldset>
          <p className="fire-help">{copy.strategyHelp}</p>
          <FireFields copy={copy} />
          <PensionEditor copy={copy} />
          <div className="fire-actions">
            <button type="button" className="button-primary" data-fire-calculate disabled>
              {copy.calculate}
            </button>
            <button type="button" data-fire-reset disabled>
              {copy.reset}
            </button>
          </div>
          <p className="fire-help">{copy.privacy}</p>
          <noscript>
            <p className="fire-warning">{copy.noJS}</p>
          </noscript>
        </form>
        <FireResults copy={copy} />
      </div>
      <details className="fire-method">
        <summary>{copy.method}</summary>
        <p>{copy.methodBody}</p>
        <p>{copy.methodFormula}</p>
      </details>
    </section>
  );
}
