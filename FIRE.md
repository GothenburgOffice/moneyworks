# Pension-aware FIRE planning

The calculator is part of the static English/Swedish homepage.
It is a deterministic scenario, not a pension entitlement estimate, tax calculation,
recommended withdrawal rate, probability of success or financial advice.
No government/employer service, Google integration or market feed is used.

## Currency display

Currency displays use whole units in results, accepted payouts, chart ticks and
yearly tables, regardless of currency label. Minimum monthly saving rounds up so
the displayed requirement is not understated. Other currency amounts round to the
nearest integer; displayed yearly rows reconcile at that precision. Fractional
inputs, percentage rates and internal model arithmetic remain unchanged.

## Demonstration

The focused tool has a “Watch a 90-second walkthrough” disclosure above the inputs.
It follows one example and one pension through focused current-interface captures,
custom payout ages and retirement/savings views. English narration replaces long
text overlays. Native, self-hosted video has optional English/Swedish captions
(off by default) and a readable walkthrough; it does not
autoplay or add a tracking/player service. Closing it or leaving the tool pauses it.
The illustrative amounts are arbitrary currency units with zero return, inflation
and fees, not recommended planning assumptions.

## Questions and strategies

- **Portfolio needed:** Find minimum capital at the chosen retirement age that
  avoids a monthly shortfall and meets the end target. Compare with savings plus
  contributions projected to that age. The chart uses minimum required capital,
  not unfunded projected savings.
- **When can I retire?:** Test each whole age from now through one year before
  the planning end. Find the first whose projected savings pass every monthly
  check and the end target. Resolution is whole years, not exact dates; the chart
  uses projected actual savings.
- **Planned drawdown:** Target at least the entered real end balance, default zero,
  at the chosen plan end age. Zero has no safety buffer.
  Extra savings or pension surpluses can leave more: no extra spending is invented
  to force an exact zero.
- **Preserve starting capital:** Require at least the real retirement starting
  capital at the plan end, with no borrowing. Capital may dip before later pensions
  arrive. This is not indefinite preservation or the 4% rule.

## Result phases

The calculator is entered from its tool card into the focused `#fire-calculator`
view, not shown open on the clean homepage. Its pre-rendered ToolView supplies a
FIRE-specific banner, shared header/footer and All tools link; native hash
navigation works without JavaScript. Locale/theme controls keep tool context,
not financial values. Explicit tool-link refresh reopens that view.

The result switches between Savings plan and Retirement plan without changing the
inputs or funding verdict. Savings shows the entered current portfolio, month-end
contributions and real net growth up to the selected/calculated retirement birthday.
Its closing balance is the same projected-savings figure used by the retirement
age search. Pension payouts are not separately added while working.

The savings chart includes a distinct target line for minimum required retirement
capital. It never substitutes that target for actual projected savings. Its yearly
table shows opening balance, contributions, net growth and closing balance.
The monthly saving target is the total constant real month-end contribution
needed to reach minimum retirement capital, rounded up to cents, not an additional
top-up. It accounts for growth on current capital. Reaching that minimum alone is
not a promise that a larger actual portfolio meets every preservation constraint;
the separate funding verdict checks the entered plan.

Retirement view retains its previous convention: minimum required capital in
portfolio-needed mode, actual projected savings in retirement-age mode. Consequently,
an unfunded savings chart does not necessarily join the portfolio-needed retirement
chart. Each phase labels its scenario explicitly. Retiring now shows one current
portfolio point, no invented savings years, and no monthly solution to an immediate
capital gap. Monthly targets or resulting projections outside supported ranges
are explicitly unavailable.

Phase selection survives recalculation and clears on Reset. Everything remains
page-local with keyboard-accessible native buttons and no additional dependencies.

## Units, timing and income

Use one arbitrary currency and today's purchasing power; there is no conversion.
Monetary inputs start blank/zero, not fabricated user records. Age and rate defaults
are editable illustrations, not forecasts. Spending and contributions are constant
in real terms. Enter pension payouts after income tax, include withdrawal taxes in
spending and adjust investment return for relevant investment taxes. No country
rules or pension eligibility calculation is supplied.

Portfolio, contributions, end reserve and payout amounts start empty with a `0`
placeholder; blank means zero. Spending and ages remain required. Clear restores
the placeholders, and reopening a saved zero payout shows a placeholder too.
Redundant integer-leading zeros are removed on blur, not while typing; decimal
precision, negative rate signs and exponent notation are preserved.

A pension range includes the start birthday and excludes the end birthday.
Overlapping government/employer/other streams add. A later payout cannot finance
earlier spending. There is no fixed stream-count limit. Streams support optional
names and inflation linking.
For linked payouts, real amounts stay constant. For fixed payouts, enter the first
payment in today's money, or the current payment if already receiving it; real
value changes with inflation from the later of start age and current age.
Future nominal quotes must be converted to this convention before entry.

Each retirement month adds pensions, deducts spending, then applies growth.
Pension surplus is reinvested. Before retirement, declared savings arrive at
month end; pension income is not added separately while working. Include savings
from those payments in contributions. Do not count pension assets in investable
capital and again as payouts.

## Model

Payout editors have Save and Cancel actions. Save validates that payout independently
of other plan fields and collapses it into a summary with Edit and Remove controls.
Accepted values remain in page memory; collapsed controls are disabled and the
calculation reads accepted records, not hidden inputs. Cancel restores an accepted
record or removes an unsaved draft. Save/cancel open edits before calculating.
Enter in a payout input saves that row; Enter in other inputs calculates.
Changing currency updates summaries without conversion. Clear removes all entries.
No account, database or browser-storage persistence is implied by Save.

The annual real factor is `(1 + return/100) * (1 - fee/100) / (1 + inflation/100)`;
the monthly factor is its twelfth root. Rates are constant, not sampled.
The fee convention is an annual percentage reduction applied multiplicatively.

Funding requirements are computed backwards, checking every month's non-borrowing
constraint and the final reserve. Preservation adds a discounted final-capital
inequality. Positive-return horizons use present values to avoid overflowing
forward growth coefficients. Negative real growth can make preservation
impossible or impose an upper feasible capital bound. Age search reuses one
backward timeline and advances working savings forwards, rather than repeatedly
resimulating the whole remaining horizon; it still checks every whole birthday.

Only minimum required capital is rounded upward to cents; internal arithmetic
is unrounded floating point with half-cent feasibility tolerance. Display tables
use two decimals and assign rounding residuals to growth so displayed rows
reconcile. This is a scenario model, not an accounting ledger.

There is no fixed minimum lifespan or maximum age. Ages are non-negative whole
birthdays, representable as integer months, with plan end after current/retirement
age. Amount inputs remain
0–1 trillion; return −50% to 30%, inflation −5% to 30%, fees 0% to 10%.
Finite projections are not capped at an arbitrary capital amount; large displayed
values use scientific notation. Genuine floating-point overflow is reported as
unrepresentable, not as an age restriction. An unavailable solution can reflect
strategy or numeric representation, not real-world impossibility.

Not modelled: volatility/sequence risk, stochastic inflation, changing spending
or contributions, automatic pension rules, allocation, emergencies or withdrawal
tax schedules. Stress-test lower returns, higher spending and longer horizons.

## Component walkthrough and adding another tool

- **Catalogue:** `web/src/features/tools/catalog.ts` owns approved IDs, status
  and entry links. Add another approved tool and both site translations here;
  the shared `ToolCard` does not need hardcoded calls.
- **Arithmetic:** `web/src/features/fire/model.ts` owns validation and calculations,
  without DOM, runtime dependencies, server imports or side effects. Give each
  future tool its own pure model and independent golden tests.
- **Presentation:** `web/src/components/fire/` separates section, numeric fields,
  pension editing and result scaffold. `content/fire.ts` owns EN/SV copy;
  `styles/fire.css` owns the feature styles.
- **Interaction:** `web/src/enhancements/fire-calculator.js` reads native controls,
  draws safe text/SVG/table output and hides stale results. Another tool should
  have its own small enhancement, not grow this one.
- **Build:** `scripts/build-fire.mjs` uses the existing TypeScript compiler to
  combine the tested engine and DOM enhancement into one classic script, rejecting
  runtime imports. No browser compiler, client framework or chart package is added.
  Prebuild/predev generates ignored `public/fire-calculator.js`; after editing
  model/enhancement source during development, rerun this generator before reload.
- **Tests:** `npm run test:fire` covers independent annuity/backward calculations,
  pension boundaries/overlaps, bridging, reserves, preservation, zero/negative
  returns and age search. Architecture, browser and account checks still apply.

Main content remains SSG, not a client-rendered app. Without JavaScript, labels,
explanations and method remain HTML; calculation/pension controls are disabled.
Native account forms remain unaffected.

## Privacy

Financial values have no form field names, avoiding accidental URL submission.
The enhancement uses a local button/Enter handler, also intercepts submission,
and makes no network requests. Inputs stay
in the current page: no cookies, browser storage, account saving or schema changes.
Changing language/reloading starts another page. No real pension entitlement is
invented or retrieved.
