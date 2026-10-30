# MoneyWorks web

The app is a single-page personal-finance tool hub. English is the default, Swedish is available at `/sv`, and both are country-neutral. The FIRE and crypto-tax calculators are clearly marked as planned, not working tools.

Both locales are pre-rendered HTML with metadata. The page is composed from Server Components in `src/components/` and typed translated content in `src/content/site.ts`. Direction C (Bright works) is the selected starter: charcoal/lime by default, with a light counterpart. Native links and disclosures work without JavaScript; two small scripts enhance menu closing, theme switching and the real database check in the footer. Without JavaScript, content remains readable in dark mode, the theme button stays hidden and the connection status remains "checking". Theme preference follows locale links via a validated query value; guarded history updates keep ordinary page reloads consistent. No browser-storage API is used. Run `npm run test:ui` for theme enhancement regression checks.

In the devcontainer, open a terminal in `/workspace/web` and run:

```bash
npm run dev -- --hostname 0.0.0.0
```

Useful checks are `npm run lint`, `npm run typecheck`, `npm run db:validate` and `npm run build`. `npm run db:setup` generates the Prisma client and applies committed migrations; the only model is the `Greeting` connection test, not a financial-data model.

With the app and database running, `npm run test:smoke` checks both languages, static HTML, metadata, routing, health and the actual status script. `npm run test:db-status` tests only the enhancement; set `EXPECTED_DB_STATUS=unavailable` when deliberately testing an outage. Set `TEST_BASE_URL` to test a server other than `http://127.0.0.1:3000`.
