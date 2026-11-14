import { readFile } from "node:fs/promises";
import { getAccountCopy } from "@/content/account";
import { getPrivacyCopy } from "@/content/privacy";
import type { Locale } from "@/content/site";
import {
  expect,
  fillCredentials,
  mailedLink,
  password,
  register,
  registerVerified,
  signIn,
  test,
  uniqueEmail,
} from "./support";

const locales: Locale[] = ["en", "sv"];
const newPassword = "a different long browser test passphrase";

for (const locale of locales) {
  const copy = getAccountCopy(locale);
  const privacy = getPrivacyCopy(locale);
  const other: Locale = locale === "en" ? "sv" : "en";

  test.describe(`${locale}`, () => {
    test("registration, email verification, sign-in, language switch and sign-out", async ({
      page,
    }) => {
      const email = uniqueEmail(`register-${locale}`);
      await register(page, locale, email);

      // Unverified accounts cannot sign in yet.
      await signIn(page, locale, email);
      await expect(page.getByRole("status")).toHaveText(copy.failed);

      await page.goto(await mailedLink(email, "/api/auth/verify-email"));
      await expect(page).toHaveURL(new RegExp(`/${locale}/account`));
      await signIn(page, locale, email);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.futureTitle);
      await expect(page.locator("main").getByText(email)).toBeVisible();
      await expect(page.getByText(copy.verified)).toBeVisible();

      // The language link keeps the account view, and the session.
      await page.locator(`.language-switcher a[hreflang="${other}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${other}/account\\?view=login`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        getAccountCopy(other).futureTitle,
      );

      // A cached public page asks for the member after load and shows the account menu,
      // in the theme picked on the account page.
      await page.goto(`/${locale}/account`);
      await page.locator("[data-theme-toggle]").click();
      const theme = await page.locator("html").getAttribute("data-theme");
      await page.goto(`/${locale}/tools/fire`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme ?? "");
      const menu = page.getByRole("button", { name: copy.accountMenu });
      await menu.click();
      const panel = page.locator(".account-menu-panel");
      await expect(panel.getByText(email)).toBeVisible();
      await expect(panel.getByRole("link", { name: copy.admin })).toHaveCount(0);
      await panel.getByRole("link", { name: copy.accountSettings }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.futureTitle);

      await page.getByRole("button", { name: copy.accountMenu }).click();
      await page.locator(".account-menu-panel").getByRole("button", { name: copy.logout }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.loginTitle);
      await page.goto(`/${locale}`);
      await expect(page.locator("[data-account-control]")).toHaveAccessibleName(copy.login);
      await expect(page.getByRole("button", { name: copy.accountMenu })).toHaveCount(0);
      await expect(page.getByText(email)).toHaveCount(0);
    });

    test("password recovery through the mailed link", async ({ page }) => {
      const email = uniqueEmail(`recover-${locale}`);
      await registerVerified(page, locale, email);

      await page.goto(`/${locale}/account?view=forgot`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.forgotTitle);
      await page.getByLabel(copy.email).fill(email);
      await page.getByRole("button", { name: copy.sendReset }).click();
      await expect(page.getByRole("status")).toHaveText(copy.resetSent);

      await page.goto(await mailedLink(email, "/api/auth/reset-password/"));
      await expect(page).toHaveURL(new RegExp(`/${locale}/account\\?view=reset&token=`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.resetTitle);

      // A mismatch keeps the recovery token, so the form can be submitted again.
      await page.getByLabel(copy.password, { exact: true }).fill(newPassword);
      await page.getByLabel(copy.confirmPassword).fill(`${newPassword} typo`);
      await page.getByRole("button", { name: copy.reset }).click();
      await expect(page.getByRole("status")).toHaveText(copy.passwordMismatch);
      await expect(page).toHaveURL(/view=reset&.*token=/);
      await page.getByLabel(copy.password, { exact: true }).fill(newPassword);
      await page.getByLabel(copy.confirmPassword).fill(newPassword);
      await page.getByRole("button", { name: copy.reset }).click();
      await expect(page.getByRole("status")).toHaveText(copy.passwordChanged);

      await signIn(page, locale, email);
      await expect(page.getByRole("status")).toHaveText(copy.failed);
      await signIn(page, locale, email, newPassword);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.futureTitle);
    });

    test("data export and deleting the account", async ({ page }) => {
      const email = uniqueEmail(`delete-${locale}`);
      await registerVerified(page, locale, email);
      await signIn(page, locale, email);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.futureTitle);

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("link", { name: copy.exportData }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/^moneyworks-account-\d{4}-\d{2}-\d{2}\.json$/);
      const exported = JSON.parse(await readFile(await download.path(), "utf8")) as {
        account: { email: string };
      };
      expect(exported.account.email).toBe(email);

      const danger = page.getByRole("region", { name: copy.deleteTitle });
      await danger.getByLabel(copy.password).fill(`${password} typo`);
      await danger.getByLabel(copy.deleteConfirmLabel).check();
      await danger.getByRole("button", { name: copy.deleteAccount }).click();
      await expect(page.getByRole("status")).toHaveText(copy.deleteWrongPassword);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.futureTitle);

      await danger.getByLabel(copy.password).fill(password);
      await danger.getByLabel(copy.deleteConfirmLabel).check();
      await danger.getByRole("button", { name: copy.deleteAccount }).click();
      await expect(page.getByRole("status")).toHaveText(copy.deleted);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.loginTitle);
      await signIn(page, locale, email);
      await expect(page.getByRole("status")).toHaveText(copy.failed);
    });

    test("form messages, disabled reset and the privacy page", async ({ page }) => {
      await page.goto(`/${locale}/account?view=register`);
      await fillCredentials(page, locale, uniqueEmail(`mismatch-${locale}`), password);
      await page.getByLabel(copy.confirmPassword).fill(`${password} typo`);
      await page.getByRole("button", { name: copy.register }).click();
      await expect(page.getByRole("status")).toHaveText(copy.passwordMismatch);

      await page.goto(`/${locale}/account?view=reset`);
      await expect(page.getByText(copy.resetMissing)).toBeVisible();
      await expect(page.getByRole("button", { name: copy.reset })).toBeDisabled();

      await page.goto(`/${locale}/account?view=register`);
      await page
        .locator(".account-form-panel")
        .getByRole("link", { name: privacy.privacy, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/account\\?view=privacy`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(privacy.privacyTitle);
      await expect(
        page.getByText("Automated test controller, not a public operator"),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "test-controller@example.invalid" }),
      ).toHaveAttribute("href", "mailto:test-controller@example.invalid");
    });
  });
}

// Every account form is a native form post, so accounts work without JavaScript.
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("registration, verification, sign-in and sign-out", async ({ page }) => {
    const copy = getAccountCopy("sv");
    const email = uniqueEmail("nojs");
    await registerVerified(page, "sv", email);
    await signIn(page, "sv", email);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.futureTitle);
    await page.getByRole("button", { name: copy.logout }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.loginTitle);
  });

  test("deleting the account", async ({ page }) => {
    const copy = getAccountCopy("en");
    const email = uniqueEmail("nojs-delete");
    await registerVerified(page, "en", email);
    await signIn(page, "en", email);
    const danger = page.getByRole("region", { name: copy.deleteTitle });
    await danger.getByLabel(copy.password).fill(password);
    await danger.getByLabel(copy.deleteConfirmLabel).check();
    await danger.getByRole("button", { name: copy.deleteAccount }).click();
    await expect(page.getByRole("status")).toHaveText(copy.deleted);
  });
});
