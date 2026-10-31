# Moneyworks repository instructions

Read and follow [Moneyworks Copilot Instructions](copilot-instruction.md) before making changes. `.github/copilot-instruction.md` is the maintained, detailed project reference; this standard entry-point filename makes that reference discoverable to Copilot.

- Keep the detailed instructions and relevant README guidance aligned with meaningful repository changes.
- Open `moneyworks.code-workspace` for the root folder and relevant extension recommendations. The current repository is `GothenburgOffice/moneyworks`; preserve Docker-first development.
- This is an owner-hosted, country-neutral personal-finance tool hub with a single pre-rendered page per language. FIRE works in the local preview; crypto tax is still planned. Payout Save/Edit/Cancel is page-memory only, with no fixed payout-count ceiling.
- Preserve reusable Server Components, the selected C (Bright works) design, English-default/Swedish content, localized theme enhancement and real database-status check.
- Keep public content SSG; use the separate account boundary for sessions. Follow `AUTH.md` for verification, recovery, necessary-only cookies, explicit provider linking and operator configuration. Qualify new dependencies; do not install packages for trivial UI or utilities.
- Zero-default calculator amounts use empty inputs with `0` placeholders; blank means zero, while spending/ages remain required. Preserve decimal entry and normalize redundant leading zeros only on blur.
- The result can show the savings phase or retirement phase. Keep actual projected savings distinct from minimum required capital, and use the shared engine for both chart/table phases.
- Homepage and focused tools share one pre-rendered document per locale. ToolView provides a tool-specific banner and workspace while retaining only shared navigation/footer from the hub. Native hashes select the view; no financial inputs in URLs.
- Routine preview edits get focused checks, not full suites. Full checks run on explicit request or before an explicitly requested and confirmed GitHub push.
- FIRE's demo is self-hosted native video with local subtitles and a text walkthrough. Keep playback user-initiated; no third-party player, tracker or video-production dependency in the app.
- The current FIRE walkthrough is narrated, with short on-screen headings and optional captions off by default; it follows one plan and one pension.
- Currency displays use whole units across summaries, charts and yearly tables. Keep fractional input/rate/model precision; round the minimum required saving up.
- Preserve manually maintained, gitignored `.env` files; do not introduce a credential generator.
- Never delete the owner's database volumes as a routine rebuild. Destructive CI cleanup applies only to disposable GitHub runner resources.
- Preserve LF safeguards and run the checks appropriate to the change. Report actual results, not assumed test or deployment success.
