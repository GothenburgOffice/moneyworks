# MoneyWorks starter verification

## Preview verification scope

Small preview changes get focused component/interaction and visual checks only.
Full suites are reserved for an explicit request or an authorized GitHub push.

## Focused tool view

- A clean homepage shows the overview, not an already-open calculator.
- Open FIRE from its card: replace the general hero and hub sections with the
  FIRE banner and workspace. Shared header/navigation/footer remain.
- All tools / header navigation / logo return to the appropriate homepage section.
  Browser Back/Forward and explicit tool deep-link refresh work; in-page values
  survive leaving/re-entering, but full reload/language change still clear them.
- Language/theme links preserve tool context, never financial inputs. No-JS
  hash navigation still opens the tool and shows the honest no-JS notice.
- Focused spot checks: EN desktop, SV mobile, entry/exit, one calculation,
  context-preserving locale link and native no-JS entry. No full regression run.

## Savings / retirement result toggle

- Switch Savings plan / Retirement plan in the result. Chart, cash-flow columns,
  explanation and phase-specific metrics switch together; buttons expose pressed state.
- Savings starts at the entered portfolio with month-end contributions and the same
  real growth. Show entered monthly saving, total monthly saving to reach the
  retirement target, and the retirement gap. Never pretend an unfunded target is saved.
- Savings closing equals projected savings; age-mode retirement opens there.
  Portfolio mode still shows the explicitly labelled minimum-capital retirement path.
  Pensions before retirement must not be double-counted.
- Retirement now has no savings rows, a single current-portfolio point, finite axes,
  and an unavailable saving target if capital is needed immediately. Invalid/no
  solution results stay honest.
- Keyboard toggle, recalculation preserves selection, Reset clears it, stale results
  hide. Check both goals/strategies, zero/negative return, EN/SV/themes/mobile,
  resizing and sandbox without forms, with no requests or persistence.

## Number input acceptance

- Portfolio, monthly saving, end reserve and payout amount start empty with a
  zero placeholder. Blank means zero; spending and ages remain required.
- Type into an untouched zero-placeholder field without selecting/deleting
  anything first: digits must not join a prefilled zero. Clear and retype freely.
- Explicit zero remains valid. Clear/reset restores empty zero placeholders.
  Reopening a saved zero payout also uses an empty zero-placeholder input.
- Redundant leading zeros normalize on blur, not while typing; decimals,
  negative rates, scientific notation and fresh Enter results remain valid.
- Verify both languages/themes, desktop/mobile, payout save/edit/cancel,
  both calculator modes and sandbox without forms. No persistence/dependencies.

## Payout save and edit acceptance

- Add more than 20 payouts; Add remains enabled and all accepted payouts calculate.
- Save a valid payout while unrelated spending is blank. Its editor closes;
  summary shows source/name, monthly amount, ages and indexing. Other rows stay compact.
- Edit/save/remove entries; Cancel restores accepted values or discards a new draft.
  Multiple open editors are supported. Calculate asks to save/cancel open edits.
- Invalid amounts, missing/fractional ages and reversed ranges cannot save.
- Currency changes refresh summaries. Clear removes saved entries and drafts.
  Enter saves an open payout, otherwise calculates, even in a sandbox without forms.
- Check EN/SV, both themes, narrow mobile, no network/storage. Save is page-only;
  reloading/changing language clears the plan. No new dependencies or GitHub writes.

## Sticky compact navigation acceptance

- Shared header stays at viewport top on homepage and every account/privacy view.
- Expanded 92px desktop/78px mobile bar becomes 64px/60px once past its original
  height; scrolling to top expands it. Reserved slot prevents page layout jumps.
- Test both locales/themes, 1440/768/375/320, scroll restoration, hash entry,
  resizing, native mobile menu, Escape and in-page menu closing.
- Section/skip/calculator-result targets remain below the bar. Header logo still
  returns to top; no footer Back to top control/label/anchor remains.
- Without JS, header stays sticky at full size and native menu/anchors work.
- Preserve calculator, account, cookie disclosure and real health flows. Reuse
  the same private preview; no dependencies, storage, DB or GitHub writes.

## FIRE calculator acceptance

- One static public page per locale, with a functional FIRE section and crypto
  still explicitly planned. No financial inputs sent to a server or persisted.
- Toggle portfolio needed / retirement age, and planned drawdown / preserving
  starting capital at plan end. Plan-through age is at least 75.
- Add/edit/remove government, employer and other pension streams with inclusive
  start and exclusive end ages; overlaps add, fixed payouts lose purchasing power.
- Verify a delayed pension cannot finance an earlier shortfall. End targets,
  fees/inflation, zero/negative returns and unfunded plans need honest results.
- Show projection chart and accessible yearly data from the same model.
- Check invalid/blank input, unrestricted payout counts, both languages/themes, mobile widths,
  native keyboard operation and no-JS explanation. Preserve account flows.
- Reuse the existing preview; no Google integration, persistent saving, migration or GitHub write.

## Local component-cleanup acceptance

- Preserve every flow below, both locales, both themes, native forms and existing URLs.
- Keep account page orchestration server-side; extract form, tabs, entry and workspace
  presentation without passing auth configuration or session tokens into components.
- Keep privacy copy/presentation independent of account copy and auth imports.
- Render the same two explicitly planned tools from a neutral typed catalogue.
- Enforce server-only database access and presentation/content import boundaries.
- Correct outdated schema/auth statements in README, PRODUCT and Copilot guidance.
- Split account/privacy/cookie styles without changing computed appearance or layout.
- Add no Google scripts, consent platform, provider, financial feature or schema change.
- Test invalid view/message/token query values, unavailable configuration and no-JS
  verification/login/logout against disposable fixtures, not owner data.
- Keep the existing private preview binding and credential-disabled review behavior.

Direction C, Bright works, is the owner-selected visual starting point. This is a
one-page English/Swedish tool hub with a local FIRE calculator, not the hypothetical
ten-tool/blog/video expansion.

- Main content and metadata are present in pre-rendered HTML without JavaScript.
- Dark charcoal/lime is the fresh default. The localized theme toggle switches to
  light and back and carries a validated URL preference through language links.
  Guard history updates for restricted iframes; do not use browser-storage APIs.
- Native language links select English/Swedish; root defaults to English even with
  Swedish browser language/cookies.
- Header, hero illustration links and main CTA reach actual section anchors.
  Footer branding links to the localized homepage, not a redundant top control.
- Planned tools expand via native details; no fake inputs or results exist.
- Information disclosures, mobile navigation, Escape closing, focus and skip link work.
- Real database status reports success/failure without hiding the static content.
- Cookie/privacy notice is discreet, native and available without JavaScript.
  Anonymous EN/SV responses set no locale, tracking or consent-dismissal cookie.
- Account navigation opens sign-in/registration, recovery and privacy views.
  Missing mail/privacy configuration must leave forms safely unavailable.
- On an explicitly configured disposable first-party instance: register, capture
  verification mail locally, reject unverified sign-in, verify and log in, inspect
  the real empty workspace, recover, reject old password/token replay and log out.
- Test CSRF/origin, body limits, database-backed rate limits, host-only secure cookie
  settings, anonymous privacy, no-secret HTML and preservation of Greeting data.
- Embedded account review is read-only, never a fake signed-in session or a place
  to collect real credentials. No public publishing or new GitHub write is authorized
  by this feature request.
- Test both locales/modes at 1440, 1000, 768, 375 and 320. Check overflow, heading
  wrapping, fonts, browser errors and reduced motion.
- Rebuild/deploy the existing MoneyWorks Development Preview only. The public
  design board is separate and is not republished with this work.
- Run lint, types, build, LF, UI units, smoke/status tests and preview browser checks
  before the approved GitHub commit/push; verify the resulting CI separately.
