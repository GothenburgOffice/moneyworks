import type { FireCopy } from "@/content/fire";

export function FireResults({ copy }: { copy: FireCopy }) {
  return (
    <aside className="fire-results" aria-labelledby="fire-result-heading">
      <h3 id="fire-result-heading">{copy.result}</h3>
      <p className="fire-status" data-fire-status role="status" aria-live="polite">
        {copy.waiting}
      </p>
      <div data-fire-result role="region" aria-label={copy.result} tabIndex={-1} hidden>
        <div className="fire-answer">
          <p data-result-label>{copy.required}</p>
          <strong data-result-primary />
          <p data-result-age />
        </div>
        <p className="fire-help" data-result-funded />
        <div className="fire-phase-toggle" role="group" aria-label={copy.resultPhase}>
          <button type="button" data-result-phase="savings" aria-pressed="false">
            {copy.savingsPlan}
          </button>
          <button type="button" data-result-phase="retirement" aria-pressed="true">
            {copy.retirementPlan}
          </button>
        </div>
        <dl className="fire-metrics">
          <div data-required-metric>
            <dt>{copy.required}</dt>
            <dd data-result-required />
          </div>
          <div>
            <dt>{copy.savings}</dt>
            <dd data-result-savings />
          </div>
          <div data-retirement-end-metric>
            <dt>{copy.ending}</dt>
            <dd data-result-end />
          </div>
          <div data-saving-metric hidden>
            <dt>{copy.savingEntered}</dt>
            <dd data-result-contribution />
          </div>
          <div data-saving-metric hidden>
            <dt>{copy.savingNeeded}</dt>
            <dd data-result-saving-needed />
          </div>
          <div data-saving-metric hidden>
            <dt>{copy.savingGap}</dt>
            <dd data-result-saving-gap />
          </div>
          <div>
            <dt>{copy.realReturn}</dt>
            <dd data-result-return />
          </div>
        </dl>
        <p className="fire-help" data-result-path />
        <p className="fire-help" data-result-saving-help hidden>
          {copy.savingHelp}
        </p>
        <p className="fire-help" data-result-saving-empty hidden>
          {copy.noSavingsYears}
        </p>
        <p className="fire-warning" data-result-saving-unavailable hidden>
          {copy.savingUnavailable}
        </p>
        <figure className="fire-chart">
          <figcaption data-fire-chart-title>{copy.chart}</figcaption>
          <svg viewBox="0 0 560 270" role="img" aria-label={copy.chart} data-fire-chart />
          <p className="fire-help" data-fire-chart-hint>
            {copy.chartHint}
          </p>
        </figure>
        <p className="fire-help" data-retirement-surplus>
          {copy.surplus}
        </p>
        <p className="fire-warning" data-result-outside hidden>
          {copy.outside}
        </p>
        <details className="fire-yearly">
          <summary>{copy.yearly}</summary>
          <div className="fire-table-scroll" role="region" aria-label={copy.yearly} tabIndex={0}>
            <table>
              <caption>{copy.yearly}</caption>
              <thead>
                <tr data-fire-table-head>
                  {[
                    copy.age,
                    copy.opening,
                    copy.pensionIncome,
                    copy.annualSpending,
                    copy.growth,
                    copy.closing,
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody data-fire-table />
            </table>
          </div>
        </details>
      </div>
      <p className="fire-caution">{copy.caution}</p>
    </aside>
  );
}
