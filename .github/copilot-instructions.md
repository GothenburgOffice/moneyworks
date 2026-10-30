# Moneyworks repository instructions

Read and follow [Moneyworks Copilot Instructions](copilot-instruction.md) before making changes. `.github/copilot-instruction.md` is the maintained, detailed project reference; this standard entry-point filename makes that reference discoverable to Copilot.

- Keep the detailed instructions and relevant README guidance aligned with meaningful repository changes.
- This is an owner-hosted, country-neutral personal-finance tool hub with a single pre-rendered page per language. FIRE and crypto-tax calculators are planned, not functional.
- Preserve reusable Server Components, the selected C (Bright works) design, English-default/Swedish content, localized theme enhancement and real database-status check.
- Preserve manually maintained, gitignored `.env` files; do not introduce a credential generator.
- Never delete the owner's database volumes as a routine rebuild. Destructive CI cleanup applies only to disposable GitHub runner resources.
- Preserve LF safeguards and run the checks appropriate to the change. Report actual results, not assumed test or deployment success.
