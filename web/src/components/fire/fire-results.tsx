import type { Ref } from "react";
import type { FireCopy } from "@/content/fire";
import type { FirePlan, FireResult } from "@/features/fire/model";
import { FireChart } from "./fire-chart";
import type { FireFormatters } from "./fire-format";

export type FirePhase = "savings" | "retirement";
export type FireStatus = { text: string; warning: boolean; hidden: boolean };
export type FireCalculation = {
  plan: FirePlan;
  result: Extract<FireResult, { ok: true }> & { retirementAge: number; required: number };
};

type Props = {
  copy: FireCopy;
  format: FireFormatters;
  currency: string;
  status: FireStatus;
  calculation: FireCalculation | null;
  phase: FirePhase;
  onPhase: (phase: FirePhase) => void;
  resultRef: Ref<HTMLDivElement>;
};

const rounded = (value: number) => Math.sign(value) * Math.round(Math.abs(value));

export function FireResults({
  copy,
  format,
  currency,
  status,
  calculation,
  phase,
  onPhase,
  resultRef,
}: Props) {
  return (
    <aside className="fire-results" aria-labelledby="fire-result-heading">
      <h3 id="fire-result-heading">{copy.result}</h3>
      <p
        className={`fire-status${status.warning ? " fire-warning" : ""}${status.hidden ? " sr-only" : ""}`}
        data-fire-status
        role="status"
        aria-live="polite"
      >
        {status.text}
      </p>
      <div
        ref={resultRef}
        data-fire-result
        role="region"
        aria-label={copy.result}
        tabIndex={-1}
        hidden={!calculation}
      >
        {calculation && (
          <ResultBody
            copy={copy}
            format={format}
            currency={currency}
            calculation={calculation}
            phase={phase}
            onPhase={onPhase}
          />
        )}
      </div>
      <p className="fire-caution">{copy.caution}</p>
    </aside>
  );
}

function ResultBody({
  copy,
  format,
  currency,
  calculation: { plan, result },
  phase,
  onPhase,
}: Omit<Props, "status" | "calculation" | "resultRef"> & { calculation: FireCalculation }) {
  const money = (value: number) => `${format.number(value)} ${currency}`;
  const savings = phase === "savings";
  const ageGoal = plan.goal === "age";
  const label = ageGoal ? copy.ageResult : copy.required;
  const yearly = savings ? copy.savingsYearly : copy.yearly;
  const chartTitle = savings ? copy.savingsChart : copy.chart;
  const chartHint = savings ? copy.savingsChartHint : copy.chartHint;
  const rows = savings ? result.savingsRows : result.rows;
  const headings = savings
    ? [copy.age, copy.opening, copy.contributions, copy.growth, copy.closing]
    : [copy.age, copy.opening, copy.pensionIncome, copy.annualSpending, copy.growth, copy.closing];
  const tableRows = rows.map((row) => {
    const opening = rounded(row.opening);
    const closing = rounded(row.closing);
    const income = rounded("contribution" in row ? row.contribution : row.pension);
    const spending = "spending" in row ? rounded(row.spending) : 0;
    // Reconcile whole-unit rows without changing the model. For extreme
    // amounts, retain finite model growth instead of unsafe integer sums.
    const growth = [opening, closing, income, spending].every(Number.isSafeInteger)
      ? rounded(closing - opening - income + spending)
      : rounded(row.growth);
    return savings
      ? [row.age, opening, income, growth, closing]
      : [row.age, opening, income, spending, growth, closing];
  });

  return (
    <>
      <div className="fire-answer">
        <p data-result-label>{label}</p>
        <strong data-result-primary>
          {ageGoal ? String(result.retirementAge) : money(result.required)}
        </strong>
        <p data-result-age>
          {savings
            ? `${copy.startAge} ${plan.currentAge} · ${copy.stopAge} ${result.retirementAge}`
            : `${copy.atAge.replace("{age}", String(result.retirementAge))} · ${copy.throughAge.replace("{age}", String(plan.endAge))}`}
        </p>
      </div>
      <p className={`fire-help${result.funded ? "" : " fire-warning"}`} data-result-funded>
        {result.funded ? copy.funded : copy.gap}
      </p>
      <div className="fire-phase-toggle" role="group" aria-label={copy.resultPhase}>
        {(["savings", "retirement"] as const).map((value) => (
          <button
            key={value}
            type="button"
            data-result-phase={value}
            aria-pressed={phase === value}
            onClick={() => onPhase(value)}
          >
            {value === "savings" ? copy.savingsPlan : copy.retirementPlan}
          </button>
        ))}
      </div>
      <dl className="fire-metrics">
        {ageGoal && (
          <div data-required-metric>
            <dt>{copy.required}</dt>
            <dd data-result-required>{money(result.required)}</dd>
          </div>
        )}
        <div>
          <dt>{copy.savings}</dt>
          <dd data-result-savings>{money(result.projectedSavings)}</dd>
        </div>
        {savings ? (
          <>
            <div data-saving-metric>
              <dt>{copy.savingEntered}</dt>
              <dd data-result-contribution>{money(plan.contribution)}</dd>
            </div>
            <div data-saving-metric>
              <dt>{copy.savingNeeded}</dt>
              <dd data-result-saving-needed>
                {result.monthlySavingNeeded === null
                  ? copy.notAvailable
                  : money(Math.ceil(result.monthlySavingNeeded))}
              </dd>
            </div>
            <div data-saving-metric>
              <dt>{copy.savingGap}</dt>
              <dd data-result-saving-gap>
                {money(Math.max(0, result.required - result.projectedSavings))}
              </dd>
            </div>
          </>
        ) : (
          <div data-retirement-end-metric>
            <dt>{copy.ending}</dt>
            <dd data-result-end>{money(result.endPortfolio ?? 0)}</dd>
          </div>
        )}
        <div>
          <dt>{copy.realReturn}</dt>
          <dd data-result-return>{format.rate(result.realReturn)}</dd>
        </div>
      </dl>
      <p className="fire-help" data-result-path>
        {savings ? copy.savingsPath : ageGoal ? copy.actualPath : copy.requiredPath}
      </p>
      {savings && (
        <>
          <p className="fire-help" data-result-saving-help>
            {copy.savingHelp}
          </p>
          {rows.length === 0 && (
            <p className="fire-help" data-result-saving-empty>
              {copy.noSavingsYears}
            </p>
          )}
          {rows.length > 0 && result.monthlySavingNeeded === null && (
            <p className="fire-warning" data-result-saving-unavailable>
              {copy.savingUnavailable}
            </p>
          )}
        </>
      )}
      <figure className="fire-chart">
        <figcaption data-fire-chart-title>{chartTitle}</figcaption>
        <FireChart
          values={[
            rows[0]?.opening ?? (savings ? plan.portfolio : (result.rows[0]?.opening ?? 0)),
            ...rows.map((row) => row.closing),
          ]}
          startAge={savings ? plan.currentAge : result.retirementAge}
          endAge={savings ? result.retirementAge : plan.endAge}
          title={chartTitle}
          description={chartHint}
          currency={currency}
          ageLabel={copy.age}
          target={savings ? result.required : null}
          targetLabel={copy.targetLine}
          format={format}
        />
        <p className="fire-help" data-fire-chart-hint>
          {chartHint}
        </p>
      </figure>
      {!savings && (
        <p className="fire-help" data-retirement-surplus>
          {copy.surplus}
        </p>
      )}
      {!savings && result.outsidePensions && (
        <p className="fire-warning" data-result-outside>
          {copy.outside}
        </p>
      )}
      <details className="fire-yearly">
        <summary>{yearly}</summary>
        <div className="fire-table-scroll" role="region" aria-label={yearly} tabIndex={0}>
          <table>
            <caption>{yearly}</caption>
            <thead>
              <tr data-fire-table-head>
                {headings.map((heading) => (
                  <th scope="col" key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody data-fire-table>
              {tableRows.map((values) => (
                <tr key={values[0]}>
                  {values.map((value, index) => (
                    <td key={index}>{index === 0 ? String(value) : format.number(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
