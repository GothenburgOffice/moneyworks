import { expect, test, type Page } from "@playwright/test";
import { getFireCopy } from "@/content/fire";
import { getSiteCopy, type Locale } from "@/content/site";

const locales: Locale[] = ["en", "sv"];

// site-ui.js reveals the theme control and marks the view once it has initialized.
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("[data-theme-toggle]")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-active-tool");
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const locale of locales) {
  const copy = getSiteCopy(locale);
  const fire = getFireCopy(locale);

  test.describe(`${locale}`, () => {
    // The enhancement scripts change attributes before React hydrates (in development
    // usually after load), so a missing suppressHydrationWarning shows up here.
    for (const hash of ["", "#fire-calculator"]) {
      test(`loads${hash ? " the tool view" : ""} without console errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`/${locale}${hash}`, { waitUntil: "networkidle" });
        await expect(page.locator("[data-fire-calculate]")).toBeEnabled();
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
      });
    }

    test("hash tool view opens, survives Back/Forward and returns to the tools", async ({
      page,
    }) => {
      await open(page, `/${locale}`);
      const home = page.locator("[data-home-view]");
      const panel = page.locator('[data-tool-panel="fire"]');
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(home.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(panel).toBeHidden();
      await expectNoHorizontalScroll(page);

      await page.getByRole("link", { name: copy.tools.open }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}#fire-calculator$`));
      await expect(panel.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(home).toBeHidden();
      await expect(page.locator("html")).toHaveAttribute("data-active-tool", "fire");
      await expect(page.locator(".skip-link")).toHaveAttribute("href", "#fire-calculator");
      for (const link of await page.locator("[data-locale-link]").all()) {
        await expect(link).toHaveAttribute("href", /#fire-calculator$/);
      }
      await expectNoHorizontalScroll(page);

      await page.goBack();
      await expect(home).toBeVisible();
      await expect(panel).toBeHidden();
      await expect(page.locator("html")).toHaveAttribute("data-active-tool", "");
      await page.goForward();
      await expect(panel.getByRole("heading", { level: 1 })).toBeVisible();

      await panel.getByRole("link", { name: fire.backToTools }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}#tools$`));
      await expect(page.locator("#tools-heading")).toBeInViewport();
      await expect(panel).toBeHidden();
    });

    test("theme switches and is carried across language links", async ({ page }) => {
      const other = locale === "en" ? "sv" : "en";
      await open(page, `/${locale}#fire-calculator`);
      const html = page.locator("html");
      const toggle = page.locator("[data-theme-toggle]");
      await expect(html).toHaveAttribute("data-theme", "dark");
      await expect(toggle).toHaveAttribute("aria-label", copy.nav.themeLight);
      await expect(toggle).toHaveAttribute("aria-pressed", "true");

      await toggle.click();
      await expect(html).toHaveAttribute("data-theme", "light");
      await expect(toggle).toHaveAttribute("aria-label", copy.nav.themeDark);
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await expect(page).toHaveURL(new RegExp(`/${locale}\\?theme=light#fire-calculator$`));
      await expectNoHorizontalScroll(page);

      await page.locator(`[data-locale-link][hreflang="${other}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${other}\\?theme=light#fire-calculator$`));
      await expect(html).toHaveAttribute("lang", other);
      await expect(html).toHaveAttribute("data-theme", "light");
      await expect(page.locator('[data-tool-panel="fire"]')).toBeVisible();
    });

    test("an unknown theme value falls back to dark", async ({ page }) => {
      await open(page, `/${locale}?theme=blue`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(page.locator(`[data-locale-link][hreflang="${locale}"]`)).toHaveAttribute(
        "href",
        `/${locale}?theme=dark`,
      );
    });

    test("header navigation fits the layout", async ({ page, isMobile }) => {
      await open(page, `/${locale}`);
      const menu = page.locator("[data-mobile-menu]");
      const desktopNav = page.locator(".desktop-nav");
      if (!isMobile) {
        await expect(desktopNav).toBeVisible();
        await expect(menu).toBeHidden();
        await desktopNav.getByRole("link", { name: copy.nav.about }).click();
        await expect(page).toHaveURL(new RegExp(`/${locale}#about$`));
        return;
      }
      await expect(desktopNav).toBeHidden();
      const summary = menu.locator("summary");
      const links = menu.getByRole("navigation");

      await summary.click();
      await expect(links).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(links).toBeHidden();
      await expect(summary).toBeFocused();

      await summary.click();
      await links.getByRole("link", { name: copy.nav.learn }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}#learn$`));
      await expect(links).toBeHidden();
      await expect(page.locator("#learn")).toBeInViewport();
    });
  });
}
