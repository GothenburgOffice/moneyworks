import type { Locale } from '@/content/site';
import { getFireCopy } from '@/content/fire';
import { FireFields } from './fire-fields';
import { PensionEditor } from './pension-editor';
import { FireResults } from './fire-results';
import '@/styles/fire.css';

export function FireCalculator({ locale }: { locale: Locale }) {
  const copy = getFireCopy(locale);
  return (
    <section id="fire-workspace" className="fire-calculator page-width" aria-labelledby="fire-heading" data-fire data-ui data-fire-locale={locale} data-fire-copy={JSON.stringify(copy)}>
      <div className="fire-heading">
        <h2 id="fire-heading">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>
      <div className="fire-workspace">
        <form className="fire-form" action="#fire-calculator" autoComplete="off" data-fire-form>
          <fieldset className="fire-choice">
            <legend>{copy.question}</legend>
            <label><input type="radio" name="fire-goal" value="portfolio" defaultChecked />{copy.portfolioGoal}</label>
            <label><input type="radio" name="fire-goal" value="age" />{copy.ageGoal}</label>
          </fieldset>
          <fieldset className="fire-choice">
            <legend>{copy.strategy}</legend>
            <label><input type="radio" name="fire-strategy" value="drawdown" defaultChecked />{copy.drawdown}</label>
            <label><input type="radio" name="fire-strategy" value="preserve" />{copy.preserve}</label>
          </fieldset>
          <p className="fire-help">{copy.strategyHelp}</p>
          <FireFields copy={copy} />
          <PensionEditor copy={copy} />
          <div className="fire-actions">
            <button type="button" className="button-primary" data-fire-calculate disabled>{copy.calculate}</button>
            <button type="button" data-fire-reset disabled>{copy.reset}</button>
          </div>
          <p className="fire-help">{copy.privacy}</p>
          <noscript><p className="fire-warning">{copy.noJS}</p></noscript>
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
