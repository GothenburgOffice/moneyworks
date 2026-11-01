/** Country-neutral deterministic planning, all balances in today's money.
 * Ages are integer birthdays. Month m covers [age, age + 1/12).
 * Retirement spending/pensions occur at month start, followed by return.
 * While working, the declared savings contribution occurs at month end.
 * No tax rules, mortality tables, market data, persistence or network access.
 */
export type Pension = {
  id: string;
  kind: "government" | "employer" | "other";
  name: string;
  monthly: number;
  startAge: number;
  endAge: number;
  indexed: boolean;
};
export type FirePlan = {
  goal: "portfolio" | "age";
  strategy: "drawdown" | "preserve";
  currentAge: number;
  retirementAge: number;
  endAge: number;
  portfolio: number;
  contribution: number;
  spending: number;
  endBalance: number;
  annualReturn: number;
  inflation: number;
  fee: number;
  pensions: Pension[];
};
export type FireError = "ages" | "amounts" | "rates" | "pensions" | "range";
export type ProjectionRow = {
  age: number;
  opening: number;
  pension: number;
  spending: number;
  growth: number;
  closing: number;
};
export type SavingsRow = {
  age: number;
  opening: number;
  contribution: number;
  growth: number;
  closing: number;
};
export type FireResult =
  | { ok: false; error: FireError }
  | {
      ok: true;
      funded: boolean;
      retirementAge: number | null;
      required: number | null;
      projectedSavings: number;
      endPortfolio: number | null;
      realReturn: number;
      rows: ProjectionRow[];
      savingsRows: SavingsRow[];
      monthlySavingNeeded: number | null;
      outsidePensions: boolean;
    };

const MONEY_LIMIT = 1e12;
const tolerance = 0.005;
// Integer months must be representable exactly; this is not a lifespan limit.
const validAge = (age: number) => Number.isSafeInteger(age * 12) && age >= 0;

export function isValidPension(pension: Pension): boolean {
  return Boolean(
    pension &&
    typeof pension.id === "string" &&
    ["government", "employer", "other"].includes(pension.kind) &&
    typeof pension.name === "string" &&
    pension.name.length <= 80 &&
    typeof pension.indexed === "boolean" &&
    Number.isFinite(pension.monthly) &&
    pension.monthly >= 0 &&
    pension.monthly <= MONEY_LIMIT &&
    Number.isInteger(pension.startAge) &&
    Number.isInteger(pension.endAge) &&
    validAge(pension.startAge) &&
    validAge(pension.endAge) &&
    pension.startAge < pension.endAge,
  );
}

export function validateFirePlan(plan: FirePlan): FireError | null {
  if (
    !["portfolio", "age"].includes(plan.goal) ||
    !["drawdown", "preserve"].includes(plan.strategy)
  )
    return "range";
  if (
    ![plan.currentAge, plan.retirementAge, plan.endAge].every(
      (age) => Number.isInteger(age) && validAge(age),
    ) ||
    plan.currentAge >= plan.endAge ||
    (plan.goal === "portfolio" &&
      (plan.retirementAge < plan.currentAge || plan.retirementAge >= plan.endAge))
  )
    return "ages";
  if (
    ![plan.portfolio, plan.contribution, plan.spending, plan.endBalance].every(
      (value) => Number.isFinite(value) && value >= 0 && value <= MONEY_LIMIT,
    )
  )
    return "amounts";
  if (
    ![plan.annualReturn, plan.inflation, plan.fee].every(Number.isFinite) ||
    plan.annualReturn < -50 ||
    plan.annualReturn > 30 ||
    plan.inflation < -5 ||
    plan.inflation > 30 ||
    plan.fee < 0 ||
    plan.fee > 10
  )
    return "rates";
  if (!Array.isArray(plan.pensions)) return "pensions";
  const ids = new Set<string>();
  for (const pension of plan.pensions) {
    if (!isValidPension(pension) || ids.has(pension.id)) return "pensions";
    ids.add(pension.id);
  }
  return null;
}

export function realAnnualFactor(plan: FirePlan): number {
  return ((1 + plan.annualReturn / 100) * (1 - plan.fee / 100)) / (1 + plan.inflation / 100);
}

export function pensionAtMonth(plan: FirePlan, absoluteMonth: number): number {
  return plan.pensions.reduce((sum, pension) => {
    if (absoluteMonth < pension.startAge * 12 || absoluteMonth >= pension.endAge * 12) return sum;
    const fixedMonths = Math.max(
      0,
      absoluteMonth - Math.max(plan.currentAge, pension.startAge) * 12,
    );
    const amount = pension.indexed
      ? pension.monthly
      : pension.monthly / (1 + plan.inflation / 100) ** (fixedMonths / 12);
    return sum + amount;
  }, 0);
}

export function projectedSavings(plan: FirePlan, retirementAge: number): number {
  return projectSavings(plan, retirementAge).balance;
}

export function projectSavings(plan: FirePlan, retirementAge: number) {
  const factor = realAnnualFactor(plan) ** (1 / 12);
  let balance = plan.portfolio;
  const rows: SavingsRow[] = [];
  for (let age = plan.currentAge; age < retirementAge; age++) {
    const opening = balance;
    let growth = 0;
    for (let month = 0; month < 12; month++) {
      const next = balance * factor;
      growth += next - balance;
      balance = next + plan.contribution;
    }
    rows.push({ age, opening, contribution: plan.contribution * 12, growth, closing: balance });
  }
  return { rows, balance };
}

/** Total month-end contribution to reach minimum retirement capital, not an
 * extra top-up or guarantee that a larger portfolio meets preservation rules.
 */
export function monthlySavingToTarget(
  plan: FirePlan,
  retirementAge: number,
  target: number,
): number | null {
  const factor = realAnnualFactor(plan) ** (1 / 12);
  let existing = plan.portfolio,
    coefficient = 0;
  for (let month = plan.currentAge * 12; month < retirementAge * 12; month++) {
    existing *= factor;
    coefficient = coefficient * factor + 1;
  }
  const gap = target - existing;
  if (gap <= 0) return 0;
  if (coefficient === 0) return null;
  const needed = Math.ceil((gap / coefficient) * 100) / 100;
  return Number.isFinite(needed) &&
    needed <= MONEY_LIMIT &&
    Number.isFinite(existing + coefficient * needed)
    ? needed
    : null;
}

type FundingBounds = { required: number | null; maximum: number };

// Work backwards once. Unlike forward growth coefficients, discounted cash flow
// stays stable over long positive-return horizons. Store each birthday so age
// search does not resimulate the whole remaining plan for every candidate.
function fundingTimeline(plan: FirePlan, firstAge: number): Map<number, FundingBounds> {
  const factor = realAnnualFactor(plan) ** (1 / 12);
  const timeline = new Map<number, FundingBounds>();
  let needed = plan.strategy === "drawdown" ? plan.endBalance : 0;
  let discount = 1,
    cash = 0;
  for (let month = plan.endAge * 12 - 1; month >= firstAge * 12; month--) {
    const flow = pensionAtMonth(plan, month) - plan.spending;
    needed = Math.max(0, needed / factor - flow);
    if (plan.strategy === "preserve") {
      if (factor > 1) {
        discount /= factor;
        cash = flow + cash / factor;
      } else {
        discount *= factor;
        cash += flow * discount;
      }
    }
    if (month % 12 !== 0) continue;
    let lower = needed,
      maximum = Infinity,
      feasible = true;
    if (plan.strategy === "preserve") {
      const change = factor > 1 ? 1 - discount : discount - 1;
      if (change > 1e-10) lower = Math.max(lower, -cash / change);
      else if (change < -1e-10) {
        const upper = cash / -change;
        feasible = lower <= upper + tolerance;
        maximum = (cash + tolerance) / -change;
      } else if (cash < -tolerance) feasible = false;
    }
    // Preserve large finite values without overflowing merely while rounding.
    const cents = (lower - 1e-8) * 100;
    const required =
      feasible && Number.isFinite(lower)
        ? Math.max(0, Number.isFinite(cents) ? Math.ceil(cents) / 100 : lower)
        : null;
    timeline.set(month / 12, { required, maximum });
  }
  return timeline;
}

export function requiredCapital(plan: FirePlan, retirementAge: number): number | null {
  return fundingTimeline(plan, retirementAge).get(retirementAge)?.required ?? null;
}

export function projectRetirement(plan: FirePlan, retirementAge: number, initial: number) {
  const factor = realAnnualFactor(plan) ** (1 / 12);
  let balance = initial,
    solvent = true;
  const rows: ProjectionRow[] = [];
  for (let age = retirementAge; age < plan.endAge; age++) {
    const opening = balance;
    let pension = 0,
      growth = 0;
    for (let month = age * 12; month < (age + 1) * 12; month++) {
      const income = pensionAtMonth(plan, month);
      const afterCash = balance + income - plan.spending;
      if (afterCash < -tolerance) solvent = false;
      const next = afterCash * factor;
      pension += income;
      growth += next - afterCash;
      balance = next;
    }
    rows.push({ age, opening, pension, spending: plan.spending * 12, growth, closing: balance });
  }
  const target = plan.strategy === "preserve" ? initial : plan.endBalance;
  return { rows, balance, funded: solvent && balance + tolerance >= target };
}

export function calculateFire(plan: FirePlan): FireResult {
  const error = validateFirePlan(plan);
  if (error) return { ok: false, error };
  const realReturn = (realAnnualFactor(plan) - 1) * 100;
  let retirementAge: number | null = plan.goal === "portfolio" ? plan.retirementAge : null;
  const timeline = fundingTimeline(
    plan,
    plan.goal === "age" ? plan.currentAge : plan.retirementAge,
  );
  if (plan.goal === "age") {
    // Still check every whole age: pension timing need not be monotonic.
    // Funding bounds and working savings both advance in linear time.
    const factor = realAnnualFactor(plan) ** (1 / 12);
    let savings = plan.portfolio;
    for (let age = plan.currentAge; age < plan.endAge; age++) {
      if (!Number.isFinite(savings)) return { ok: false, error: "range" };
      const { required: requirement, maximum } = timeline.get(age)!;
      if (
        requirement !== null &&
        savings + tolerance >= requirement &&
        savings <= maximum &&
        projectRetirement(plan, age, savings).funded
      ) {
        retirementAge = age;
        break;
      }
      for (let month = 0; month < 12; month++) savings = savings * factor + plan.contribution;
    }
  }
  const required = retirementAge === null ? null : timeline.get(retirementAge)!.required;
  const savings = retirementAge === null ? 0 : projectedSavings(plan, retirementAge);
  if (!Number.isFinite(savings)) return { ok: false, error: "range" };
  // Portfolio view shows the minimum-capital retirement path, not an invented
  // projection of the user's unfunded savings. Age view uses projected savings.
  const initial = plan.goal === "age" ? savings : required;
  const projection =
    retirementAge !== null && initial !== null
      ? projectRetirement(plan, retirementAge, initial)
      : null;
  if (
    projection &&
    (!Number.isFinite(projection.balance) ||
      projection.rows.some(
        (row) =>
          ![row.opening, row.pension, row.spending, row.growth, row.closing].every(Number.isFinite),
      ))
  )
    return { ok: false, error: "range" };
  const actual =
    retirementAge !== null && required !== null
      ? projectRetirement(plan, retirementAge, savings)
      : null;
  return {
    ok: true,
    funded: actual?.funded ?? false,
    retirementAge,
    required,
    projectedSavings: savings,
    endPortfolio: projection?.balance ?? null,
    realReturn,
    rows: projection?.rows ?? [],
    savingsRows: retirementAge === null ? [] : projectSavings(plan, retirementAge).rows,
    monthlySavingNeeded:
      retirementAge === null || required === null
        ? null
        : monthlySavingToTarget(plan, retirementAge, required),
    outsidePensions: plan.pensions.some(
      (pension) =>
        pension.endAge <= (retirementAge ?? plan.currentAge) || pension.startAge >= plan.endAge,
    ),
  };
}
