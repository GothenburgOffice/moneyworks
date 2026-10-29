# Moneyworks repository instructions

Read and follow [Moneyworks Copilot Instructions](copilot-instruction.md) before making changes. `.github/copilot-instruction.md` is the maintained, detailed project reference; this standard entry-point filename makes that reference discoverable to Copilot.

- Keep the detailed instructions and relevant README guidance aligned with meaningful repository changes.
- This is an owner-hosted, database-backed hello-world project, not a completed financial application.
- Preserve manually maintained, gitignored `.env` files; do not introduce a credential generator.
- Never delete the owner's database volumes as a routine rebuild. Destructive CI cleanup applies only to disposable GitHub runner resources.
- Preserve LF safeguards and run the checks appropriate to the change. Report actual results, not assumed test or deployment success.
