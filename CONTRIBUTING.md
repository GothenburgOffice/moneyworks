# Contributing

This is a small, owner-maintained project. Review time is limited, so outside
contributions are accepted only on the terms below.

## Before you write code

Only work on an issue if one of these is true:

1. It has the **`help wanted`** label, or
2. You commented on the issue with what you plan to do, and a maintainer
   **replied approving it**.

Everything else, including issues labelled `decision`, needs that approval
first. Closed issues are the maintainer's work log, not open tasks. If there's
no issue for your idea, open one and wait for a reply.

**Pull requests that don't meet this will probably be closed without review.**
That includes unsolicited fixes, refactors, dependency bumps and typo-only changes.

## Pull request requirements

- Link the issue (`Closes #123`) and keep the change limited to it.
- Branch from an up-to-date `main`. Merging needs the `unit` and `containers`
  CI checks to pass on an up-to-date branch.
- Before pushing, run `npm run lint`, `npm run typecheck`, `npm run test:ui`,
  `npm run test:architecture`, `npm run test:fire` and `npm run build` in `web/`.
  Run `npm run test:smoke` too if you changed pages, routing or the database,
  and `npm run test:auth-config` if you changed account code. The
  [devcontainer](README.md#option-a-vs-code-devcontainer-recommended) has
  everything set up; no host Node.js is needed.
- Add or update tests for behavior changes.
- Follow the rules in [.github/copilot-instructions.md](.github/copilot-instructions.md),
  for example: public pages stay pre-rendered and readable without JavaScript,
  financial inputs never leave the browser, the site stays country-neutral,
  migrations are append-only, new dependencies are agreed in the issue first,
  and the app stays Node 22 compatible.
- **Disclose AI assistance** in the PR description, and say what you ran yourself.

## Security issues

Don't open public issues for vulnerabilities. Use
[GitHub private vulnerability reporting](https://github.com/GothenburgOffice/moneyworks/security/advisories/new) instead.

## License

By contributing you agree that your contribution is licensed under the
[MIT License](LICENSE).
