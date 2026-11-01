import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFire,
  pensionAtMonth,
  projectRetirement,
  requiredCapital,
  projectedSavings,
  realAnnualFactor,
  validateFirePlan,
  isValidPension,
  projectSavings,
  monthlySavingToTarget,
} from "../src/features/fire/model.ts";

const base = {
  goal: "portfolio",
  strategy: "drawdown",
  currentAge: 50,
  retirementAge: 55,
  endAge: 85,
  portfolio: 0,
  contribution: 0,
  spending: 1000,
  endBalance: 0,
  annualReturn: 0,
  inflation: 0,
  fee: 0,
  pensions: [],
};
const pension = (startAge, endAge, monthly, extra = {}) => ({
  id: "p1",
  kind: "government",
  name: "",
  monthly,
  startAge,
  endAge,
  indexed: true,
  ...extra,
});
const near = (actual, expected, tolerance = 0.02) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test("savings rows reconcile month-end contributions and reach projected savings", () => {
  const plan = { ...base, portfolio: 10000, contribution: 100 };
  const projection = projectSavings(plan, 55);
  assert.equal(projection.rows.length, 5);
  assert.deepEqual(projection.rows[0], {
    age: 50,
    opening: 10000,
    contribution: 1200,
    growth: 0,
    closing: 11200,
  });
  near(projection.balance, 16000);
  const result = calculateFire(plan);
  near(result.savingsRows.at(-1).closing, result.projectedSavings);
  near(result.monthlySavingNeeded, 5833.34);
  for (const row of result.savingsRows)
    near(row.opening + row.contribution + row.growth, row.closing, 1e-7);
});
test("monthly saving target agrees with independent annuities across real return signs", () => {
  for (const annualReturn of [-5, 0, 6]) {
    const plan = { ...base, portfolio: 10000, contribution: 100, annualReturn };
    const q = realAnnualFactor(plan) ** (1 / 12),
      months = 60,
      target = 50000;
    const coefficient = q === 1 ? months : (q ** months - 1) / (q - 1);
    const exact = Math.max(0, (target - plan.portfolio * q ** months) / coefficient);
    const monthly = monthlySavingToTarget(plan, 55, target);
    assert.ok(monthly >= exact - 1e-8 && monthly < exact + 0.010001);
    assert.ok(projectSavings({ ...plan, contribution: monthly }, 55).balance >= target - 1e-7);
    for (const row of projectSavings(plan, 55).rows)
      near(row.opening + row.contribution + row.growth, row.closing, 1e-7);
  }
});
test("savings projection does not separately add pension income while working", () => {
  const plan = { ...base, portfolio: 10000, contribution: 100, pensions: [pension(50, 55, 10000)] };
  near(projectSavings(plan, 55).balance, 16000);
});
test("retirement now has no invented saving years or finite monthly solution to an immediate gap", () => {
  const plan = { ...base, currentAge: 55, portfolio: 10000 };
  assert.deepEqual(projectSavings(plan, 55), { rows: [], balance: 10000 });
  assert.equal(monthlySavingToTarget(plan, 55, 20000), null);
  assert.equal(monthlySavingToTarget(plan, 55, 10000), 0);
  assert.equal(monthlySavingToTarget(plan, 55, 5000), 0);
});
test("age-mode savings and retirement join at the selected birthday", () => {
  const result = calculateFire({
    ...base,
    goal: "age",
    currentAge: 50,
    endAge: 75,
    spending: 100,
    contribution: 100,
  });
  assert.equal(result.savingsRows.length, 13);
  near(result.savingsRows.at(-1).closing, result.rows[0].opening);
  near(result.monthlySavingNeeded, 92.31);
});
test("extreme monthly targets are unavailable rather than nonfinite or unsupported inputs", () => {
  assert.equal(monthlySavingToTarget({ ...base, currentAge: 54 }, 55, 1e15), null);
  const plan = { ...base, currentAge: 0, annualReturn: 30, inflation: -5 };
  const needed = monthlySavingToTarget(plan, 119, 1);
  assert.ok(
    needed === null || needed > 0,
    "Do not round a positive required saving down to zero over long horizons",
  );
});

test("payout count has no fixed ceiling and every stream contributes", () => {
  const pensions = Array.from({ length: 250 }, (_, index) =>
    pension(55, 85, 2, { id: `p${index}` }),
  );
  const plan = { ...base, pensions };
  assert.equal(validateFirePlan(plan), null);
  assert.equal(pensionAtMonth(plan, 55 * 12), 500);
  near(calculateFire(plan).required, 180000);
});
test("individual payout validation is independent of unrelated plan fields", () => {
  assert.equal(isValidPension(pension(65, 85, 100)), true);
  for (const invalid of [
    pension(65, 65, 1),
    pension(65.5, 85, 1),
    pension(65, 85, NaN),
    pension(65, 85, -1),
    pension(65, 85, 1, { name: "x".repeat(81) }),
  ])
    assert.equal(isValidPension(invalid), false);
});

test("zero-return drawdown is months times spending plus the end reserve", () => {
  near(requiredCapital(base, 55), 360000);
  near(requiredCapital({ ...base, endBalance: 50000 }, 55), 410000);
  near(calculateFire(base).endPortfolio, 0);
});
test("delayed pension cannot finance the earlier bridge, even with a large later surplus", () => {
  const plan = { ...base, pensions: [pension(65, 85, 10000)] };
  near(requiredCapital(plan, 55), 120000);
  assert.equal(projectRetirement(plan, 55, 119000).funded, false);
});
test("government and employer pensions add and stop exactly at exclusive end ages", () => {
  const plan = {
    ...base,
    pensions: [pension(65, 75, 600), pension(70, 85, 400, { id: "p2", kind: "employer" })],
  };
  assert.equal(pensionAtMonth(plan, 65 * 12 - 1), 0);
  assert.equal(pensionAtMonth(plan, 65 * 12), 600);
  assert.equal(pensionAtMonth(plan, 70 * 12), 1000);
  assert.equal(pensionAtMonth(plan, 75 * 12), 400);
  assert.equal(pensionAtMonth(plan, 85 * 12), 0);
  near(requiredCapital(plan, 55), 216000);
});
test("payouts before retirement do not increase the declared working savings", () => {
  near(projectedSavings({ ...base, pensions: [pension(50, 55, 10000)] }, 55), 0);
});
test("fixed pensions lose real purchasing power only from start or now", () => {
  const plan = { ...base, inflation: 10, pensions: [pension(65, 85, 1100, { indexed: false })] };
  near(pensionAtMonth(plan, 65 * 12), 1100);
  near(pensionAtMonth(plan, 66 * 12), 1000);
  const active = { ...plan, currentAge: 70 };
  near(pensionAtMonth(active, 70 * 12), 1100);
  near(pensionAtMonth(active, 71 * 12), 1000);
});
test("return, percentage fee and inflation use the documented multiplicative factor", () => {
  near(
    realAnnualFactor({ ...base, annualReturn: 5, fee: 1, inflation: 2 }),
    (1.05 * 0.99) / 1.02,
    1e-12,
  );
});
test("positive-return funding agrees with an independent beginning-month annuity formula", () => {
  const plan = { ...base, annualReturn: 6 };
  const q = 1.06 ** (1 / 12),
    n = 360;
  const expected = (1000 * (1 - q ** -n)) / (1 - 1 / q);
  near(requiredCapital(plan, 55), expected);
});
test("preservation solves the capital inequality, not a hardcoded withdrawal percentage", () => {
  const plan = { ...base, strategy: "preserve", annualReturn: 6 };
  const initial = requiredCapital(plan, 55);
  near(initial, 1000 / (1 - 1.06 ** (-1 / 12)));
  assert.equal(projectRetirement(plan, 55, initial).funded, true);
  assert.ok(projectRetirement(plan, 55, initial).balance >= initial - 0.01);
});
test("zero/negative real returns cannot preserve a positive spending gap", () => {
  assert.equal(requiredCapital({ ...base, strategy: "preserve" }, 55), null);
  assert.equal(requiredCapital({ ...base, strategy: "preserve", annualReturn: -5 }, 55), null);
  assert.ok(requiredCapital({ ...base, annualReturn: -5 }, 55) > 360000);
});
test("zero required capital is valid when pensions cover spending immediately", () => {
  const plan = { ...base, pensions: [pension(55, 85, 1000)] };
  near(requiredCapital(plan, 55), 0);
  assert.equal(calculateFire(plan).funded, true);
});
test("negative-return preservation is not assumed feasible for arbitrarily large savings", () => {
  const plan = {
    ...base,
    strategy: "preserve",
    annualReturn: -5,
    portfolio: 1e8,
    pensions: [pension(55, 85, 1100)],
  };
  near(requiredCapital(plan, 55), 0);
  assert.equal(calculateFire(plan).funded, false);
});
test("retirement search finds the first feasible whole age and stops contributions then", () => {
  const result = calculateFire({
    ...base,
    goal: "age",
    currentAge: 50,
    endAge: 75,
    spending: 100,
    contribution: 100,
  });
  assert.equal(result.retirementAge, 63);
  near(result.projectedSavings, 15600);
  assert.equal(result.funded, true);
  near(result.endPortfolio, 1200);
});
test("age mode reports no funded age before the horizon, not the end age itself", () => {
  const result = calculateFire({ ...base, goal: "age", endAge: 75 });
  assert.equal(result.retirementAge, null);
  assert.equal(result.required, null);
  assert.deepEqual(result.rows, []);
});
test("yearly cash-flow rows reconcile and minimum funding stays solvent", () => {
  const plan = {
    ...base,
    annualReturn: 4,
    inflation: 2,
    fee: 0.3,
    pensions: [pension(67, 85, 700)],
  };
  const result = calculateFire(plan);
  for (const row of result.rows)
    near(row.opening + row.pension - row.spending + row.growth, row.closing, 1e-7);
  assert.equal(projectRetirement(plan, 55, result.required).funded, true);
  assert.ok(result.rows.every((row) => row.closing >= -0.005));
});
test("invalid ages, nonfinite/negative amounts, fees and pension ranges are rejected", () => {
  assert.equal(validateFirePlan({ ...base, endAge: 55 }), "ages");
  assert.equal(validateFirePlan({ ...base, retirementAge: 85 }), "ages");
  assert.equal(validateFirePlan({ ...base, currentAge: 50.5 }), "ages");
  assert.equal(validateFirePlan({ ...base, spending: NaN }), "amounts");
  assert.equal(validateFirePlan({ ...base, portfolio: -1 }), "amounts");
  assert.equal(validateFirePlan({ ...base, fee: 11 }), "rates");
  assert.equal(validateFirePlan({ ...base, pensions: [pension(65, 65, 1)] }), "pensions");
  assert.equal(
    validateFirePlan({ ...base, pensions: [pension(65, 85, 1), pension(65, 85, 1)] }),
    "pensions",
  );
});
test("large finite projections are not rejected by an arbitrary capital ceiling", () => {
  const result = calculateFire({
    ...base,
    currentAge: 0,
    retirementAge: 119,
    endAge: 120,
    portfolio: 1e12,
    annualReturn: 30,
  });
  assert.equal(result.ok, true);
  assert.ok(result.projectedSavings > 1e15);
  assert.ok(Number.isFinite(result.projectedSavings));
});
test("genuine numeric overflow never escapes as nonfinite result values", () => {
  const result = calculateFire({
    ...base,
    currentAge: 0,
    retirementAge: 10000,
    endAge: 10001,
    portfolio: 1e12,
    annualReturn: 30,
  });
  assert.deepEqual(result, { ok: false, error: "range" });
});

test("shorter plans and ages beyond 120 have no lifespan restriction", () => {
  assert.equal(validateFirePlan({ ...base, endAge: 60 }), null);
  assert.equal(
    validateFirePlan({ ...base, currentAge: 1000, retirementAge: 1005, endAge: 10000 }),
    null,
  );
  assert.equal(isValidPension(pension(1000, 10000, 1)), true);
  near(calculateFire({ ...base, endAge: 60 }).required, 60000);
});
test("10,000-year portfolio and preservation plans include the full horizon", () => {
  const plan = { ...base, currentAge: 0, retirementAge: 0, endAge: 10000, spending: 1 };
  const result = calculateFire(plan);
  assert.equal(result.ok, true);
  near(result.required, 120000);
  assert.equal(result.rows.length, 10000);
  near(result.endPortfolio, 0);
  const covered = calculateFire({
    ...plan,
    strategy: "preserve",
    pensions: [pension(0, 10000, 1)],
  });
  assert.equal(covered.ok, true);
  near(covered.required, 0);
  assert.equal(covered.funded, true);
});
test("10,000-year age search checks every birthday without repeated full-horizon simulations", () => {
  const result = calculateFire({
    ...base,
    goal: "age",
    currentAge: 0,
    endAge: 10000,
    spending: 1,
    contribution: 1,
  });
  assert.equal(result.ok, true);
  assert.equal(result.retirementAge, 5000);
  assert.equal(result.funded, true);
  near(result.projectedSavings, 60000);
});
test("10,000-year positive-return plans stay numerically stable and finite", () => {
  const result = calculateFire({ ...base, endAge: 10000, annualReturn: 5, inflation: 2, fee: 0.3 });
  assert.equal(result.ok, true);
  assert.ok(result.required > 0);
  assert.ok(Number.isFinite(result.endPortfolio));
});
test("cached age search matches exhaustive candidate checks with pensions and both strategies", () => {
  for (let scenario = 0; scenario < 24; scenario++) {
    const plan = {
      ...base,
      goal: "age",
      strategy: scenario % 2 ? "preserve" : "drawdown",
      portfolio: scenario % 3 ? 10000 : 1e6,
      contribution: scenario % 4 ? 300 : 0,
      annualReturn: [-5, 0, 6][scenario % 3],
      pensions: [pension(65, 75, 300), pension(70, 85, 900, { id: "p2" })],
    };
    let expected = null;
    for (let age = plan.currentAge; age < plan.endAge; age++) {
      const required = requiredCapital(plan, age),
        saved = projectedSavings(plan, age);
      if (
        required !== null &&
        saved + 0.005 >= required &&
        projectRetirement(plan, age, saved).funded
      ) {
        expected = age;
        break;
      }
    }
    const actual = calculateFire(plan);
    assert.equal(actual.ok, true);
    assert.equal(actual.retirementAge, expected, `scenario ${scenario}`);
  }
});

test("finite-horizon preservation can bridge to later income without borrowing", () => {
  const plan = { ...base, strategy: "preserve", pensions: [pension(65, 85, 2000)] };
  near(requiredCapital(plan, 55), 120000);
  assert.equal(projectRetirement(plan, 55, 120000).funded, true);
});

test("200 drawdown scenarios agree with independent backward monthly funding", () => {
  let seed = 37;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (let i = 0; i < 200; i++) {
    const plan = {
      ...base,
      spending: 100 + random() * 3000,
      annualReturn: -8 + random() * 20,
      inflation: random() * 8,
      fee: random() * 2,
      endBalance: random() * 10000,
      pensions: [
        pension(60 + Math.floor(random() * 15), 85, random() * 3000, { indexed: random() > 0.5 }),
      ],
    };
    const q = realAnnualFactor(plan) ** (1 / 12);
    let needed = plan.endBalance;
    for (let month = plan.endAge * 12 - 1; month >= 55 * 12; month--) {
      needed = Math.max(0, needed / q + plan.spending - pensionAtMonth(plan, month));
    }
    const required = requiredCapital(plan, 55);
    near(required, needed);
    assert.equal(projectRetirement(plan, 55, required).funded, true, `scenario ${i}`);
  }
});
