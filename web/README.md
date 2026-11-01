# MoneyWorks web app

The Next.js application. Setup, commands and configuration are in the
[root README](../README.md); engineering rules are in
[.github/copilot-instructions.md](../.github/copilot-instructions.md).

In the devcontainer the dev server starts with the container (`npm run dev`,
listening on port 3000 inside it and `localhost:3410` on the host).

With the app and database running, `npm run test:smoke` checks both locales,
routing, the health endpoint and the database-status script. Set
`TEST_BASE_URL` to test a server other than `http://127.0.0.1:3000`, and
`EXPECTED_DB_STATUS=unavailable` with `npm run test:db-status` when testing an
outage on purpose.
