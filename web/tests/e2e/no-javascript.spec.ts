import { expect, test } from "@playwright/test";
import { getFireCopy } from "@/content/fire";
import { getSiteCopy, type Locale } from "@/content/site";

const locales: Locale[] = ["en", "sv"];

test.use({ javaScriptEnabled: false });

for (const locale of locales) {
  const copy = getSiteCopy(locale);
  const fire = getFireCopy(locale);

  test.describe(`${locale}`, () => {
    test("the hub is readable and navigable without JavaScript", async ({ page, isMobile }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("[data-home-view] h1")).toBeVisible();
      await expect(page.locator("[data-theme-toggle]")).toBeHidden();
      await expect(page.locator('[data-tool-panel="fire"]')).toBeHidden();

      // Native details disclose planned-tool information.
      const crypto = page.locator("#crypto");
      await crypto.locator("summary").click();
      await expect(crypto.locator(".tool-detail-body")).toBeVisible();

      if (isMobile) {
        const menu = page.locator("[data-mobile-menu]");
        await menu.locator("summary").click();
        await expect(menu.getByRole("link", { name: copy.nav.about })).toBeVisible();
      }

      // CSS :target selects the pre-rendered tool view.
      await page.getByRole("link", { name: copy.tools.open }).click();
      await expect(page.locator('[data-tool-panel="fire"] h1')).toBeVisible();
      await expect(page.locator("[data-home-view]")).toBeHidden();
    });

    test("the FIRE view explains itself while calculation is unavailable", async ({ page }) => {
      await page.goto(`/${locale}#fire-calculator`);
      const calculator = page.locator("[data-fire]");
      await expect(calculator.getByRole("heading", { name: fire.title })).toBeVisible();
      // Chromium stops scripts here but still parses <noscript> as raw text, so check
      // the notice is in the markup rather than that it renders.
      expect(await calculator.locator("noscript").innerHTML()).toContain(fire.noJS);
      await expect(calculator.getByRole("button", { name: fire.calculate })).toBeDisabled();
      await expect(calculator.getByRole("button", { name: fire.addGovernment })).toBeDisabled();

      await calculator.getByText(fire.method).click();
      await expect(calculator.getByText(fire.methodFormula)).toBeVisible();
    });
  });
}
