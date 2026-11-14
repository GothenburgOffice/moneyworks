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
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("[data-theme-toggle]")).toBeHidden();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      // The account control falls back to a plain link to the account page.
      await expect(page.locator("[data-account-control]")).toHaveAttribute(
        "href",
        `/${locale}/account`,
      );

      // Native details disclose planned-tool information.
      const crypto = page.locator("#crypto");
      await crypto.locator("summary").click();
      await expect(crypto.locator(".tool-detail-body")).toBeVisible();

      if (isMobile) {
        const menu = page.locator("[data-mobile-menu]");
        await menu.locator("summary").click();
        await expect(menu.getByRole("link", { name: copy.nav.about })).toBeVisible();
      }

      // The tool card is a plain link to the tool's own page.
      await page.getByRole("link", { name: copy.tools.open }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/tools/fire$`));
      await expect(page.locator('[data-tool-panel="fire"] h1')).toBeVisible();
    });

    test("the FIRE page explains itself while calculation is unavailable", async ({ page }) => {
      await page.goto(`/${locale}/tools/fire`);
      const calculator = page.locator("[data-fire]");
      await expect(calculator.getByRole("heading", { name: fire.title })).toBeVisible();
      // Chromium stops scripts here but still parses <noscript> as one raw text node.
      // Swap in its parsed content, as a browser with scripting off would, so the
      // check covers the page's CSS too.
      await calculator.locator("noscript").evaluate((noscript) => {
        noscript.outerHTML = noscript.textContent ?? "";
      });
      await expect(calculator.getByText(fire.noJS)).toBeVisible();
      await expect(calculator.getByRole("button", { name: fire.calculate })).toBeDisabled();
      await expect(calculator.getByRole("button", { name: fire.addGovernment })).toBeDisabled();

      await calculator.getByText(fire.method).click();
      await expect(calculator.getByText(fire.methodFormula)).toBeVisible();
    });
  });
}
