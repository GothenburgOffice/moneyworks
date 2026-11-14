import { expect, test, type Page } from "@playwright/test";
import { getAccountCopy } from "@/content/account";
import { getFireCopy } from "@/content/fire";
import { getSiteCopy, type Locale } from "@/content/site";

const locales: Locale[] = ["en", "sv"];

// site-ui.js reveals the theme control once it has initialized.
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("[data-theme-toggle]")).toBeVisible();
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
    for (const path of ["", "/tools/fire"]) {
      test(`loads${path ? " the tool page" : ""} without console errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
        await expect(page.locator("[data-theme-toggle]")).toBeVisible();
        if (path) await expect(page.locator("[data-fire-calculate]")).toBeEnabled();
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
      });
    }

    test("the tool page opens from its card, survives Back/Forward and returns to the tools", async ({
      page,
    }) => {
      await open(page, `/${locale}`);
      const panel = page.locator('[data-tool-panel="fire"]');
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(panel).toHaveCount(0);
      await expectNoHorizontalScroll(page);

      await page.getByRole("link", { name: copy.tools.open }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/tools/fire$`));
      await expect(panel.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(`^${fire.bannerLabel} \\|`));
      await expect(page.locator(".skip-link")).toHaveAttribute("href", "#main-content");
      for (const link of await page.locator(".language-switcher a").all()) {
        await expect(link).toHaveAttribute("href", /\/tools\/fire$/);
      }
      await expectNoHorizontalScroll(page);

      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`/${locale}$`));
      await expect(page.locator("#tools-heading")).toBeVisible();
      await page.goForward();
      await expect(panel.getByRole("heading", { level: 1 })).toBeVisible();

      await panel.getByRole("link", { name: fire.backToTools }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}#tools$`));
      await expect(page.locator("#tools-heading")).toBeInViewport();
    });

    test("the theme follows the system until picked, then sticks on every page", async ({
      page,
    }) => {
      const other = locale === "en" ? "sv" : "en";
      await page.emulateMedia({ colorScheme: "light" });
      await open(page, `/${locale}/tools/fire`);
      const html = page.locator("html");
      const toggle = page.locator("[data-theme-toggle]");
      await expect(html).toHaveAttribute("data-theme", "light");
      await expect(toggle).toHaveAttribute("aria-label", copy.nav.themeDark);
      await expect(toggle).toHaveAttribute("aria-pressed", "false");

      await toggle.click();
      await expect(html).toHaveAttribute("data-theme", "dark");
      await expect(toggle).toHaveAttribute("aria-label", copy.nav.themeLight);
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(new RegExp(`/${locale}/tools/fire$`));
      await expectNoHorizontalScroll(page);

      await page.reload();
      await expect(html).toHaveAttribute("data-theme", "dark");
      await page.locator(`.language-switcher a[hreflang="${other}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${other}/tools/fire$`));
      await expect(html).toHaveAttribute("lang", other);
      await expect(html).toHaveAttribute("data-theme", "dark");
      await open(page, `/${other}/account`);
      await expect(html).toHaveAttribute("data-theme", "dark");
    });

    test("the stored theme applies before the enhancement script runs", async ({ page }) => {
      // Without site-ui.js only the inline <head> script can set the theme.
      await page.route("**/site-ui.js", (route) => route.abort());
      await page.addInitScript(() => localStorage.setItem("theme", "light"));
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    });

    test("the account control shows Log in when signed out or the session check fails", async ({
      page,
    }) => {
      const account = getAccountCopy(locale);
      await page.route("**/api/account/session", (route) =>
        route.fulfill({ status: 503, json: { signedIn: false } }),
      );
      await open(page, `/${locale}`);
      const control = page.locator("[data-account-control]");
      await expect(control).toHaveAccessibleName(account.login);
      await expect(control).toHaveAttribute("href", `/${locale}/account`);
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test("the account menu opens for a member and closes with Escape", async ({ page }) => {
      const account = getAccountCopy(locale);
      const email = "member@example.test";
      await page.route("**/api/account/session", (route) =>
        route.fulfill({ json: { signedIn: true, email, isAdmin: true } }),
      );
      await open(page, `/${locale}`);
      const button = page.getByRole("button", { name: account.accountMenu });
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      const panel = page.locator(".account-menu-panel");
      await expect(panel.getByText(email)).toBeVisible();
      await expect(panel.getByRole("link", { name: account.accountSettings })).toHaveAttribute(
        "href",
        `/${locale}/account`,
      );
      await expect(panel.getByRole("link", { name: account.admin })).toHaveAttribute(
        "href",
        "/admin",
      );
      await expect(panel.getByRole("button", { name: account.logout })).toBeVisible();
      await expectNoHorizontalScroll(page);

      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await expect(button).toBeFocused();

      await button.click();
      // An outside click closes it; the panel is right-aligned, so click the left edge.
      await page.locator("main").click({ position: { x: 4, y: 4 } });
      await expect(panel).toBeHidden();
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
