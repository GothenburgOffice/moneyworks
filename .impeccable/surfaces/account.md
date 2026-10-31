# MoneyWorks account surface

These are implementation handoff notes, not current release or test status.
The later Swedish Pengar jobbar/PJ identity supersedes references to a shared
M/W mark below. Current behavior is defined by the source, README and AUTH.

## Scope and question

Extend the selected C world, not a new brand. How can a visitor create or access
their account and understand the next security step? Keep account tasks separate
from the static public hub.

## Real objects and states

- User identity: actual verified email and immutable ID, no invented financial data.
- Credential account: one email/password method now, explicit linking later.
- Session: database validated; no cookie-presence-only protection.
- Registration: verification required, no silent signed-in state.
- Recovery: short-lived email link, new password and session revocation.
- Guest: no cookies, account state or misleading saved balances.
- Empty workspace: account exists, but portfolios/tax work are not yet implemented.
- Operator-unconfigured host: controls honestly unavailable, not simulated success.
- Cookie notice: necessary-only disclosure, no consent marketing or accept-all.

## Composition

Reuse header/footer, original M/W, Manrope and C charcoal/lime. The guest entry
places a direct heading and explanation beside one narrow native form; on mobile
they stack. Sign-in/registration are explicit links, not a JavaScript-only tab.
The real workspace leads with identity and an honest empty state; no charts,
balances, growth figures or decorative security scores.

Taste's workspace/settings draw was run with palette/type preserved, seed
1515700789, true-black-flat. Its sidebar/data-panel shell is not adopted:
this is a public sign-in task and small account area inside the selected
single-page identity, not a dense dashboard. C's lime action and square controls
remain explicit owner constraints rather than a new generated palette.

## Verification boundaries

Impeccable context and craft-floor guidance were read. Verify keyboard/native
forms, no-JS registration/login, labels, field sizes, mobile overflow, both
languages/themes, generic errors and privacy links in the actual browser.
Skill reports do not establish authentication security: the real PostgreSQL,
mail-capture, CSRF, rate-limit, recovery and session tests are separate evidence.

Teardown and Graphify were loaded as named by the owner, but no illustration or
graph deliverable was requested. Their runtimes are not production dependencies
and no unrelated graphic/extraction toolchain is installed into the application.
