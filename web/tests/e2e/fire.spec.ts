import { expect, test, type Page } from "@playwright/test";
import { getFireCopy } from "@/content/fire";
import type { Locale } from "@/content/site";
import { calculateFire, type FirePlan } from "@/features/fire/model";

const locales: Locale[] = ["en", "sv"];

// The form's defaults, with only the required spending filled in.
const defaults: FirePlan = {
  goal: "portfolio",
  strategy: "drawdown",
  currentAge: 35,
  retirementAge: 55,
  endAge: 95,
  portfolio: 0,
  contribution: 0,
  spending: 3000,
  endBalance: 0,
  annualReturn: 5,
  inflation: 2,
  fee: 0.3,
  pensions: [],
};

// Same whole-unit formatting as the calculator, for amounts in the normal range.
function money(locale: Locale, value: number, units: string) {
  const format = new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-GB", {
    maximumFractionDigits: 0,
  });
  return `${format.format(value)} ${units}`;
}

for (const locale of locales) {
  const copy = getFireCopy(locale);

  test.describe(`${locale}`, () => {
    // The calculator enables its controls once React has hydrated it.
    async function openCalculator(page: Page) {
      await page.goto(`/${locale}/tools/fire`);
      const calculator = page.locator("[data-fire]");
      await expect(calculator.getByRole("button", { name: copy.calculate })).toBeEnabled();
      return calculator;
    }

    test("portfolio needed matches the model, with both result phases", async ({ page }) => {
      const calculator = await openCalculator(page);
      const status = calculator.locator("[data-fire-status]");
      const result = calculator.locator("[data-fire-result]");
      const savings = calculator.getByRole("button", { name: copy.savingsPlan });
      const retirement = calculator.getByRole("button", { name: copy.retirementPlan });
      await expect(status).toHaveText(copy.waiting);
      await expect(result).toBeHidden();

      await calculator.getByLabel(copy.spending).fill("3000");
      await calculator.getByLabel(copy.contribution).fill("1500");
      await calculator.getByRole("button", { name: copy.calculate }).click();
      const expected = calculateFire({ ...defaults, contribution: 1500 });
      if (!expected.ok || expected.required === null) throw new Error("Unexpected fixture");
      await expect(result).toBeVisible();
      await expect(result).toBeFocused();
      await expect(calculator.locator("[data-result-label]")).toHaveText(copy.required);
      await expect(calculator.locator("[data-result-primary]")).toHaveText(
        money(locale, expected.required, copy.units),
      );
      await expect(retirement).toHaveAttribute("aria-pressed", "true");
      await expect(calculator.locator("[data-fire-chart-title]")).toHaveText(copy.chart);
      await expect(calculator.locator("[data-fire-chart] polyline")).toHaveCount(1);

      await savings.click();
      await expect(savings).toHaveAttribute("aria-pressed", "true");
      await expect(retirement).toHaveAttribute("aria-pressed", "false");
      await expect(calculator.locator("[data-fire-chart-title]")).toHaveText(copy.savingsChart);
      await expect(calculator.locator(".fire-chart-target")).toHaveCount(1);
      await expect(calculator.locator("[data-result-contribution]")).toHaveText(
        money(locale, 1500, copy.units),
      );
      await calculator.locator(".fire-yearly summary").click();
      await expect(calculator.locator("[data-fire-table] tr")).toHaveCount(
        expected.savingsRows.length,
      );

      // A changed input hides the stale result; recalculating keeps the chosen phase.
      await calculator.getByLabel(copy.spending).fill("3200");
      await expect(result).toBeHidden();
      await expect(status).toHaveText(copy.changed);
      await page.keyboard.press("Enter");
      await expect(result).toBeVisible();
      await expect(savings).toHaveAttribute("aria-pressed", "true");

      // Clear resets the phase to the retirement plan.
      await calculator.getByRole("button", { name: copy.reset }).click();
      await expect(result).toBeHidden();
      await expect(status).toHaveText(copy.waiting);
      await expect(calculator.getByLabel(copy.spending)).toBeFocused();
      await calculator.getByLabel(copy.spending).fill("3000");
      await calculator.getByRole("button", { name: copy.calculate }).click();
      await expect(retirement).toHaveAttribute("aria-pressed", "true");
    });

    test("retirement age with preserved capital matches the model", async ({ page }) => {
      const calculator = await openCalculator(page);
      await calculator.getByLabel(copy.ageGoal).check();
      await calculator.getByLabel(copy.preserve).check();
      await expect(calculator.getByLabel(copy.retirementAge)).toBeHidden();
      await expect(calculator.getByLabel(copy.endBalance)).toBeHidden();

      await calculator.getByLabel(copy.spending).fill("2000");
      await calculator.getByLabel(copy.portfolio).fill("250000");
      await calculator.getByLabel(copy.contribution).fill("2500");
      await calculator.getByRole("button", { name: copy.calculate }).click();
      const plan = {
        ...defaults,
        goal: "age",
        strategy: "preserve",
        retirementAge: 35,
        spending: 2000,
        portfolio: 250000,
        contribution: 2500,
      } satisfies FirePlan;
      const expected = calculateFire(plan);
      if (!expected.ok || expected.retirementAge === null) throw new Error("Unexpected fixture");
      await expect(calculator.locator("[data-result-label]")).toHaveText(copy.ageResult);
      await expect(calculator.locator("[data-result-primary]")).toHaveText(
        String(expected.retirementAge),
      );
    });

    test("payouts save, edit, cancel and remove before calculating", async ({ page }) => {
      const calculator = await openCalculator(page);
      const status = calculator.locator("[data-fire-status]");
      const empty = calculator.locator("[data-pension-empty]");
      const add = calculator.getByRole("button", { name: copy.addGovernment });
      await calculator.getByLabel(copy.spending).fill("3000");
      await expect(empty).toBeVisible();

      await add.click();
      const row = calculator.locator("[data-pension-list] [data-pension-id]");
      await expect(row).toHaveCount(1);
      await expect(row.getByLabel(copy.kind)).toBeFocused();
      await expect(row.getByLabel(copy.kind)).toHaveValue("government");
      await expect(empty).toBeHidden();

      // An open editor blocks calculation.
      await calculator.getByRole("button", { name: copy.calculate }).click();
      await expect(status).toHaveText(copy.unsavedPensions);
      await expect(row.getByRole("button", { name: copy.savePension })).toBeFocused();

      // The shared validator rejects an end age before the start age.
      await row.getByLabel(copy.monthlyPayout).fill("1200");
      await row.getByLabel(copy.startAge).fill("67");
      await row.getByLabel(copy.stopAge).fill("60");
      await row.getByRole("button", { name: copy.savePension }).click();
      await expect(row.locator("[data-pension-error]")).toHaveText(copy.error_pensions);
      await expect(row.getByLabel(copy.stopAge)).toBeFocused();

      // Enter saves the row being edited.
      await row.getByLabel(copy.stopAge).fill("95");
      await page.keyboard.press("Enter");
      const summary = row.locator("[data-pension-summary]");
      await expect(summary).toBeVisible();
      await expect(row.locator("[data-pension-editor]")).toBeHidden();
      await expect(row.locator("[data-pension-summary-amount]")).toHaveText(
        `${money(locale, 1200, copy.units)} ${copy.perMonth}`,
      );
      const edit = row.locator("[data-edit-pension]");
      await expect(edit).toBeFocused();

      // Cancel restores the accepted values.
      await edit.click();
      await expect(edit).toHaveAttribute("aria-expanded", "true");
      await row.getByLabel(copy.monthlyPayout).fill("9999");
      await row.getByRole("button", { name: copy.cancelPension }).click();
      await expect(row.locator("[data-pension-summary-amount]")).toHaveText(
        `${money(locale, 1200, copy.units)} ${copy.perMonth}`,
      );

      await calculator.getByRole("button", { name: copy.calculate }).click();
      const pension = {
        id: "pension-1",
        kind: "government",
        name: "",
        monthly: 1200,
        startAge: 67,
        endAge: 95,
        indexed: true,
      } as const;
      const expected = calculateFire({ ...defaults, pensions: [pension] });
      if (!expected.ok || expected.required === null) throw new Error("Unexpected fixture");
      await expect(calculator.locator("[data-result-primary]")).toHaveText(
        money(locale, expected.required, copy.units),
      );

      await row.locator("[data-remove-pension]").click();
      await expect(row).toHaveCount(0);
      await expect(empty).toBeVisible();
      await expect(add).toBeFocused();
      await expect(calculator.locator("[data-fire-result]")).toBeHidden();

      // Cancelling a new draft discards it.
      await calculator.getByRole("button", { name: copy.addEmployer }).click();
      await calculator.getByRole("button", { name: copy.cancelPension }).click();
      await expect(row).toHaveCount(0);
    });

    test("optional amounts start blank and lose redundant zeros on blur", async ({ page }) => {
      const calculator = await openCalculator(page);
      const portfolio = calculator.getByLabel(copy.portfolio);
      await expect(portfolio).toHaveValue("");
      await expect(portfolio).toHaveAttribute("placeholder", "0");
      await portfolio.fill("007.50");
      await calculator.getByLabel(copy.spending).focus();
      await expect(portfolio).toHaveValue("7.50");
    });
  });
}
