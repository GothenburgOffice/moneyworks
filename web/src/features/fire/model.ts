/** Country-neutral deterministic planning, all balances in today's money.
 * Ages are integer birthdays. Month m covers [age, age + 1/12).
 * Retirement spending/pensions occur at month start, followed by return.
 * While working, the declared savings contribution occurs at month end.
 * No tax rules, mortality tables, market data, persistence or network access.
 */
export type Pension = {
  id: string;
  kind: 'government' | 'employer' | 'other';
  name: string;
  monthly: number;
  startAge: number;
  endAge: number;
  indexed: boolean;
};
export type FirePlan = {
  goal: 'portfolio' | 'age';
  strategy: 'drawdown' | 'preserve';
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
export type FireError = 'ages' | 'amounts' | 'rates' | 'pensions' | 'range';
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
const RESULT_LIMIT = 1e15;
const tolerance = 0.005;

export function isValidPension(pension: Pension): boolean {
  return Boolean(pension && typeof pension.id === 'string'
    && ['government', 'employer', 'other'].includes(pension.kind)
    && typeof pension.name === 'string' && pension.name.length <= 80
    && typeof pension.indexed === 'boolean'
    && Number.isFinite(pension.monthly) && pension.monthly >= 0 && pension.monthly <= MONEY_LIMIT
    && Number.isInteger(pension.startAge) && Number.isInteger(pension.endAge)
    && pension.startAge >= 0 && pension.endAge <= 120 && pension.startAge < pension.endAge);
}

export function validateFirePlan(plan: FirePlan): FireError | null {
  if (!['portfolio', 'age'].includes(plan.goal) || !['drawdown', 'preserve'].includes(plan.strategy)) return 'range';
  if (![plan.currentAge, plan.retirementAge, plan.endAge].every(Number.isInteger)
    || plan.currentAge < 0 || plan.endAge < 75 || plan.endAge > 120
    || plan.currentAge >= plan.endAge
    || (plan.goal === 'portfolio' && (plan.retirementAge < plan.currentAge || plan.retirementAge >= plan.endAge))) return 'ages';
  if (![plan.portfolio, plan.contribution, plan.spending, plan.endBalance]
    .every(value => Number.isFinite(value) && value >= 0 && value <= MONEY_LIMIT)) return 'amounts';
  if (![plan.annualReturn, plan.inflation, plan.fee].every(Number.isFinite)
    || plan.annualReturn < -50 || plan.annualReturn > 30
    || plan.inflation < -5 || plan.inflation > 30 || plan.fee < 0 || plan.fee > 10) return 'rates';
  if (!Array.isArray(plan.pensions)) return 'pensions';
  const ids = new Set<string>();
  for (const pension of plan.pensions) {
    if (!isValidPension(pension) || ids.has(pension.id)) return 'pensions';
    ids.add(pension.id);
  }
  return null;
}

export function realAnnualFactor(plan: FirePlan): number {
  return (1 + plan.annualReturn / 100) * (1 - plan.fee / 100) / (1 + plan.inflation / 100);
}

export function pensionAtMonth(plan: FirePlan, absoluteMonth: number): number {
  return plan.pensions.reduce((sum, pension) => {
    if (absoluteMonth < pension.startAge * 12 || absoluteMonth >= pension.endAge * 12) return sum;
    const fixedMonths = Math.max(0, absoluteMonth - Math.max(plan.currentAge, pension.startAge) * 12);
    const amount = pension.indexed ? pension.monthly
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
export function monthlySavingToTarget(plan: FirePlan, retirementAge: number, target: number): number | null {
  const factor = realAnnualFactor(plan) ** (1 / 12);
  let existing = plan.portfolio, coefficient = 0;
  for (let month = plan.currentAge * 12; month < retirementAge * 12; month++) {
    existing *= factor;
    coefficient = coefficient * factor + 1;
  }
  const gap = target - existing;
  if (gap <= 0) return 0;
  if (coefficient === 0) return null;
  const needed = Math.ceil(gap / coefficient * 100) / 100;
  return Number.isFinite(needed) && needed <= MONEY_LIMIT
    && existing + coefficient * needed <= RESULT_LIMIT ? needed : null;
}

// B[t] = a[t] * initial + c[t]. Every monthly non-borrowing constraint
// supplies a lower bound on initial capital, including the bridge to pensions.
// Preserving initial capital adds a final inequality, not a "safe" 4% rule.
export function requiredCapital(plan: FirePlan, retirementAge: number): number | null {
  const factor = realAnnualFactor(plan) ** (1 / 12);
  let a = 1, c = 0, lower = 0;
  for (let month = retirementAge * 12; month < plan.endAge * 12; month++) {
    a *= factor;
    c = (c + pensionAtMonth(plan, month) - plan.spending) * factor;
    lower = Math.max(lower, -c / a);
  }
  if (plan.strategy === 'drawdown') lower = Math.max(lower, (plan.endBalance - c) / a);
  else {
    const change = a - 1;
    if (change > 1e-10) lower = Math.max(lower, -c / change);
    else if (change < -1e-10) {
      if (lower > c / -change + tolerance) return null;
    } else if (c < -tolerance) return null;
  }
  if (!Number.isFinite(lower) || lower > RESULT_LIMIT) return null;
  // Round upward only at the result boundary, never inside the simulation.
  return Math.max(0, Math.ceil((lower - 1e-8) * 100) / 100);
}

export function projectRetirement(plan: FirePlan, retirementAge: number, initial: number) {
  const factor = realAnnualFactor(plan) ** (1 / 12);
  let balance = initial, solvent = true;
  const rows: ProjectionRow[] = [];
  for (let age = retirementAge; age < plan.endAge; age++) {
    const opening = balance;
    let pension = 0, growth = 0;
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
  const target = plan.strategy === 'preserve' ? initial : plan.endBalance;
  return { rows, balance, funded: solvent && balance + tolerance >= target };
}

export function calculateFire(plan: FirePlan): FireResult {
  const error = validateFirePlan(plan);
  if (error) return { ok: false, error };
  const realReturn = (realAnnualFactor(plan) - 1) * 100;
  let retirementAge: number | null = plan.goal === 'portfolio' ? plan.retirementAge : null;
  if (plan.goal === 'age') {
    // Check each whole age; no monotonicity assumption about pensions or returns.
    for (let age = plan.currentAge; age < plan.endAge; age++) {
      const savings = projectedSavings(plan, age);
      if (!Number.isFinite(savings) || savings > RESULT_LIMIT) return { ok: false, error: 'range' };
      const requirement = requiredCapital(plan, age);
      if (requirement !== null && savings + tolerance >= requirement
        && projectRetirement(plan, age, savings).funded) { retirementAge = age; break; }
    }
  }
  const required = retirementAge === null ? null : requiredCapital(plan, retirementAge);
  const savings = retirementAge === null ? 0 : projectedSavings(plan, retirementAge);
  if (!Number.isFinite(savings) || savings > RESULT_LIMIT) return { ok: false, error: 'range' };
  // Portfolio view shows the minimum-capital retirement path, not an invented
  // projection of the user's unfunded savings. Age view uses projected savings.
  const initial = plan.goal === 'age' ? savings : required;
  const projection = retirementAge !== null && initial !== null
    ? projectRetirement(plan, retirementAge, initial) : null;
  if (projection && (!Number.isFinite(projection.balance) || Math.abs(projection.balance) > RESULT_LIMIT
    || projection.rows.some(row => Math.abs(row.closing) > RESULT_LIMIT))) return { ok: false, error: 'range' };
  const actual = retirementAge !== null && required !== null
    ? projectRetirement(plan, retirementAge, savings) : null;
  return {
    ok: true, funded: actual?.funded ?? false, retirementAge, required,
    projectedSavings: savings, endPortfolio: projection?.balance ?? null, realReturn,
    rows: projection?.rows ?? [],
    savingsRows: retirementAge === null ? [] : projectSavings(plan, retirementAge).rows,
    monthlySavingNeeded: retirementAge === null || required === null ? null
      : monthlySavingToTarget(plan, retirementAge, required),
    outsidePensions: plan.pensions.some(pension => pension.endAge <= (retirementAge ?? plan.currentAge)
      || pension.startAge >= plan.endAge),
  };
}
