// Captures the calculator plates the compositions use, from a running app.
// Run inside the render container (see VIDEO.md). Environment:
//   FIRE_URL      the FIRE tool page, e.g. http://127.0.0.1:3000/sv/tools/fire?theme=dark
//   OUT           folder for the PNG plates, e.g. fire-demo/sv/assets
//   PENSION_NAME  the example payout's name in that language
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire("/opt/capture/package.json");
const { chromium } = require("playwright-core");

const { FIRE_URL, OUT, PENSION_NAME = "Example pension" } = process.env;
if (!FIRE_URL || !OUT) throw new Error("Set FIRE_URL and OUT");

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(FIRE_URL, { waitUntil: "networkidle" });
  const root = page.locator("[data-fire]");
  const field = (key) => root.locator(`[data-field="${key}"]`);
  async function shot(name, locator) {
    await locator.scrollIntoViewIfNeeded();
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
    await locator.screenshot({ path: `${OUT}/${name}.png` });
  }
  await field("currentAge").waitFor();
  await page.waitForFunction(() => !document.querySelector("[data-fire-calculate]")?.disabled);
  // One example for every video: arbitrary currency units, zero return, inflation and fees.
  for (const [key, value] of Object.entries({
    currentAge: 50,
    retirementAge: 55,
    endAge: 85,
    spending: 1000,
    portfolio: 100000,
    contribution: 500,
    annualReturn: 0,
    inflation: 0,
    fee: 0,
  }))
    await field(key).fill(String(value));
  for (const key of [
    "currentAge",
    "retirementAge",
    "endAge",
    "spending",
    "portfolio",
    "contribution",
  ])
    await shot(`n-${key}`, field(key).locator(".."));
  await root.locator('[data-add-pension="government"]').click();
  const row = root.locator('[data-pension-list] [role="listitem"]').last();
  for (const [key, value] of Object.entries({
    name: PENSION_NAME,
    monthly: 600,
    startAge: 65,
    endAge: 85,
  }))
    await row.locator(`[data-pension-field="${key}"]`).fill(String(value));
  await page.evaluate(() => document.activeElement?.blur());
  await shot("n-pension", row.locator("[data-pension-editor]"));
  await row.locator("[data-save-pension]").click();
  await shot("n-saved", root.locator("[data-pension-list]"));
  await shot("n-calculate", root.locator(".fire-actions"));
  await root.locator("[data-fire-calculate]").click();
  await shot("n-answer", root.locator(".fire-answer"));
  await shot("n-retirement", root.locator(".fire-chart svg"));
  await root.locator('[data-result-phase="savings"]').click();
  await shot("n-toggle", root.locator(".fire-phase-toggle"));
  for (const [key, name] of [
    ["savings", "projected"],
    ["saving-needed", "needed"],
    ["saving-gap", "gap"],
  ])
    await shot(`n-savings-${name}`, root.locator(`[data-result-${key}]`).locator(".."));
  const result = {
    required: await root.locator("[data-result-primary]").innerText(),
    savings: await root.locator("[data-result-savings]").innerText(),
    monthlyNeeded: await root.locator("[data-result-saving-needed]").innerText(),
    gap: await root.locator("[data-result-saving-gap]").innerText(),
  };
  writeFileSync(`${OUT}/../capture.json`, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
