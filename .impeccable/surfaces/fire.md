# FIRE extension

These are historical 2026-10-30 handoff notes, not current release/test status.
Later refinements removed arbitrary age caps, use whole-unit currency displays
and add the approved narrated demo. Current behavior is defined by the source
and FIRE.md; bounded-age descriptions and handoff verdicts below describe an
earlier iteration, not the current app.

## Direction contract

THESIS: Answer how much capital, or how soon retirement, with the bridge before
pensions made visible; not a single spending-times-25 number.

OWN-WORLD: Extend the approved C palette, Manrope and sharp native controls.
No sidebar, new identity, dashboard tiles or third-party chart/form library.

STORY: Choose a question and capital strategy, enter spending and pension age
ranges, then inspect the required capital and its path through the chosen age.

FIRST VIEWPORT: Within the existing one-page site, a compact FIRE heading and two
radio choices precede a two-column assumption/result workspace. The result leads
with one figure and a ruled, lime forecast line; pension rows sit below the core
inputs. Mobile stacks the result immediately after the form.

FORM: Local extension of the existing site, not a new world or separate route.
Pure monthly model, static Server Component form, small vanilla enhancement.
No seed round required for the inherited local extension.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Final hosted follow-through

After the documenter handoff below, the final hosted version passed all 16 FIRE
interaction cases and the stricter opaque-origin sandbox test without
`allow-forms`, including Calculate and numeric-input Enter. The new action
handlers do not change account forms or security policy. The reviewer scored this
targeted interaction fix resolved; the earlier EN/SV scenario-label clarification
was also resolved. Comet manually confirmed a synthetic zero-return result.
See the external preview's `qa/fire-hosted-verification.json` and
`qa/fire-embedded-hosted-verification.json`; no browser errors were reported.

PRODUCT purpose/evidence paragraphs were subsequently refreshed to describe the
working local calculator. This does not migrate the pre-existing DESIGN schema,
approve publication or clear production/privacy/account launch prerequisites.

## Local finish evidence · 2026-10-30

- **Inherited system:** Compared `DESIGN.md` with `web/src/app/globals.css`,
  `web/src/styles/fire.css` and the FIRE calculator/results Server Components.
  C charcoal/lime and its light counterpart, self-hosted Manrope, shared 3px
  control corners, flat ruled surfaces and native controls remain intact.
  Feature headings/results use 25–34px type, inputs 16px and tabular figures;
  the two-column workspace stacks at 740px, fields at 380px. These are local
  adaptations, not new shared tokens or identity. DESIGN.md and its sidecar
  remain unchanged; no new raster assets ship.
- **Implemented scope:** Pure monthly pension-aware model with manual payout
  age ranges, portfolio-needed/retirement-age questions, and drawdown/preserve
  strategies at a 75–120 planning end age. Static Server Components and a small
  generated vanilla enhancement add no runtime dependency, network submission
  or persistence. Model conventions and limitations remain in `FIRE.md`.
- **Finish verdict:** The independent reviewer reported **SHIP FOR LOCAL
  HANDOFF**, independently rerunning all 18 model tests via transpilation.
  The suite includes 200 independent backward scenarios. Its nonblocking
  metric/source-scenario label clarification was fixed in EN/SV and marked
  resolved against updated viewport PNGs; no unresolved local finish finding
  was reported.
- **Verification evidence:** `/home/user/workspace/moneyworks-preview/qa/`
  contains `fire-local-verification.json` (16 EN/SV, dark/light cases at
  1440/768/375/320px plus no-JavaScript explanation), empty
  `fire-design-findings.json`, homepage checks (20), account backend checks
  (13), and account UI checks (72 plus no-JavaScript flow). Build, lint,
  typecheck, architecture checks (13) and production dependency audit
  (zero known vulnerabilities) passed in the implementation handoff.
  Counts/verdict not directly rerun by this documentation pass are attributed
  to that handoff. QA screenshots use synthetic inputs, not user financial
  records, and remain outside the public bundle.
- **Release boundary:** This records source/functional and visual review,
  not legal, financial-advice or screen-reader certification. Hosted update
  validation is still pending and is not claimed here. Production launch,
  operator mail/privacy configuration, account prerequisites and separate
  GitHub/publication approvals remain outstanding as documented in
  `PRODUCT.md` and `FIRE.md`.
- **Documentation debt, not canonized:** Existing `PRODUCT.md` purpose/evidence
  paragraphs still describe a pre-calculator iteration despite its newer FIRE
  section. Existing DESIGN.md heading/schema drift from the current document
  playbook is also left untouched: this ordinary extension authorizes only this
  finish appendix, not a product or design-system migration.
