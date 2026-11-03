import { expect, test as base, type Page } from "@playwright/test";
import { getAccountCopy } from "@/content/account";
import type { Locale } from "@/content/site";

// Every test account uses this pattern; teardown.ts deletes them afterwards.
export const emailPrefix = "mw-e2e-";
export const emailDomain = "@example.invalid";
// Rate-limit buckets of these tests; teardown.ts deletes them too.
export const ipPrefix = "198.18.";
export const password = "a long unique browser test passphrase";
const mailbox = "http://127.0.0.1:3304/messages";

// The fixture trusts x-test-client-ip, so each test gets its own rate-limit bucket
// instead of sharing one with every other test (5 sign-ins a minute).
export const test = base.extend({
  page: async ({ page }, provide) => {
    const random = () => Math.floor(Math.random() * 254) + 1;
    await page.setExtraHTTPHeaders({ "x-test-client-ip": `${ipPrefix}${random()}.${random()}` });
    await provide(page);
  },
});
export { expect };

export function uniqueEmail(label: string) {
  return `${emailPrefix}${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}${emailDomain}`;
}

// The newest link to `path` mailed to `email` by the fixture's capture-only SMTP server.
export async function mailedLink(email: string, path: string) {
  let link = "";
  await expect
    .poll(
      async () => {
        const messages: string[] = await (await fetch(mailbox)).json();
        for (const message of messages.filter((text) => text.includes(email)).reverse()) {
          // Quoted-printable lines are unfolded for the plain-text message.
          const decoded = message
            .replace(/=\r\n/g, "")
            .replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
          const url = decoded.match(/http:\/\/127\.0\.0\.1:3302\/[^\s<>]+/)?.[0];
          if (url?.includes(path)) return (link = url);
        }
        return "";
      },
      { timeout: 10_000, message: `a ${path} link mailed to ${email}` },
    )
    .not.toBe("");
  return link;
}

export async function fillCredentials(page: Page, locale: Locale, email: string, secret: string) {
  const copy = getAccountCopy(locale);
  await page.getByLabel(copy.email).fill(email);
  await page.getByLabel(copy.password, { exact: true }).fill(secret);
}

export async function register(page: Page, locale: Locale, email: string) {
  const copy = getAccountCopy(locale);
  await page.goto(`/${locale}/account?view=register`);
  await fillCredentials(page, locale, email, password);
  await page.getByLabel(copy.confirmPassword).fill(password);
  await page.getByRole("button", { name: copy.register }).click();
  await expect(page.getByRole("status")).toHaveText(copy.verificationSent);
}

export async function registerVerified(page: Page, locale: Locale, email: string) {
  await register(page, locale, email);
  await page.goto(await mailedLink(email, "/api/auth/verify-email"));
  await expect(page).toHaveURL(new RegExp(`/${locale}/account`));
}

export async function signIn(page: Page, locale: Locale, email: string, secret = password) {
  const copy = getAccountCopy(locale);
  await page.goto(`/${locale}/account?view=login`);
  await fillCredentials(page, locale, email, secret);
  await page.getByRole("button", { name: copy.login }).click();
}
