# Accounts and privacy foundation

This local revision adds public email/password registration, email verification,
login/logout, recovery and a private empty account area. Google is explicitly
planned next; it is not enabled or represented by a non-working button.
No saved portfolios or tax records have been implemented. The separate FIRE
calculator is client-local and does not save inputs to an account.

## Identity and dependencies

- A stable `User.id` owns the account and must own future saved work.
  `Account` holds separate credential/provider identities; do not use email or
  a provider identity as the financial-data owner.
- Better Auth is the focused authentication dependency, with the existing
  Prisma/PostgreSQL connection. It supplies password hashing, session handling,
  verification, recovery, origin checks and rate limiting instead of new
  application-designed crypto. See its [email/password guide](https://www.better-auth.com/docs/authentication/email-password)
  and [Next integration](https://www.better-auth.com/docs/integrations/next).
- Linking is configured for explicit authenticated action, matching emails,
  no unverified trusted-provider override and no implicit email-based merging.
  No social providers are configured. Preserve these safeguards when adding
  Google; see [account-linking semantics](https://better-auth.com/docs/concepts/users-accounts).
- Nodemailer handles SMTP/TLS without a hosted email SDK. No consent manager,
  form library, UI package or client authentication SDK was added.
- Dependency versions and integrity are pinned in `web/package-lock.json`.
  The auth foundation added Better Auth and Nodemailer. Component cleanup also
  declares the already-installed `pg` driver directly because the maintenance
  script imports it; this introduces no new package/version into the installed graph.
  The install audit reported zero vulnerabilities at implementation time, not
  a continuing guarantee. Re-audit updates rather than treating the count as permanent.

## Public homepage and account boundary

The `/en` and `/sv` homepage remains SSG with metadata and native navigation.
Reading account cookies is confined to the separate dynamic account route and
auth endpoints. The header's generic Account link does not make home dynamic.
Account HTML is private/no-store, noindex and anti-framing. Its strict-origin
referrer policy excludes paths/query tokens while preserving the real Origin on
native form POSTs. Do not use no-referrer on these pages: browsers then submit
Origin:null and the intentionally strict CSRF check must reject them.

Forms work through full-document POST/redirect/GET without JavaScript. The small
form bridge invokes the actual Better Auth HTTP handler, not `auth.api` for
mutations: [server API calls bypass library rate limits](https://www.better-auth.com/docs/concepts/rate-limit).
Session validation on the private account page checks the real database, not
just the presence of a cookie.

The account route now orchestrates request/session state and delegates entry,
form, tabs and workspace presentation to `components/account/`. The public
privacy presentation and bilingual copy are separate under `components/privacy/`
and `content/privacy.ts`; components never receive full auth configuration or
session records. Native POST endpoints and security policy remain unchanged.
`test:architecture` and ESLint protect these boundaries. Feature styles are
split from global tokens/site styles without changing the C design.

## Operator configuration

Maintain root `.env` manually from `.env.example`; no generator was added and no
existing private file was overwritten. Compose passes account settings only to web.
The development preview uses its separate disposable configuration.

Required before registration is available:

- `AUTH_BASE_URL`: exact origin, HTTPS except explicit loopback development.
- `AUTH_SECRET`: a private, independently maintained random value of at least
  32 characters. The template's replacement marker is rejected.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`.
  External SMTP must use TLS; both credential fields must be present or absent.
- `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`: real publishable details,
  not a fictitious operator or an inferred personal email.
- `AUTH_PUBLIC_SIGNUP=true`: public self-registration after the above is ready.
  Set false to suspend registration without deleting existing accounts.

Test delivery through the configured SMTP service before enabling public signup.
The local fixture captures mail only; no real verification/recovery emails were
sent during tests. Delivery failures are logged without addresses, passwords or
token URLs. The owner-hosted process must remain running for asynchronous delivery;
this is not a durable queued-mail implementation or a serverless delivery guarantee.
Next development request-URL logging is disabled because email-link URLs contain
tokens. Independently redact auth/account query paths from proxy/hosting logs;
this repository cannot configure those external logs or their retention.

## Sessions and abuse protection

- Verification is required before email/password login. Passwords are 15–128
  characters, with password-manager/paste support and no arbitrary symbol rules.
- Verification links expire after 24 hours. Recovery links expire after 30 minutes;
  successful recovery revokes all sessions and consumes the recovery token.
- HTTPS cookies use `__Host-moneyworks.*`, Secure, HttpOnly, SameSite=Lax, Path=/,
  and no Domain. Loopback-only HTTP uses a separate development prefix.
  Session caching in cookies is disabled. The UI requests browser-session login;
  server sessions have a 24-hour expiry with activity-based renewal.
- Logout is POST. Mutations require a trusted origin. The native form bridge
  additionally checks exact Origin and caps streamed bodies at 8 KiB. The library
  API is allowlisted, including its GET recovery-token redirect.
- Rate limits are always enabled and database-backed: five logins/minute and
  three registrations or recovery-email requests/minute per bucket.
- A client cannot supply the internal IP limiter header. Without trusted-proxy
  configuration, all visitors share one conservative bucket rather than bypassing
  protection. For normal public traffic set `AUTH_TRUSTED_IP_HEADER` only when
  the reverse proxy overwrites it and the app origin is inaccessible directly.
  Never blindly trust arbitrary X-Forwarded-For. See the library's
  [proxy and IP guidance](https://www.better-auth.com/docs/concepts/rate-limit).

## Cookies and privacy

The application uses a necessary-only profile, not a fake consent banner:
the footer contains a small persistent explanation plus native Cookies & privacy
disclosure. No accept-all, pre-ticked consent or consent-dismissal cookie exists.
Locale cookies are disabled; language and theme use URLs. Better Auth telemetry is off.
Anonymous English and Swedish pages were checked to set no cookies.

Authentication cookies necessary for a requested sign-in are exempt from prior
cookie consent under the [PTS guidance](https://pts.se/internet-och-telefoni/kakor-cookies/).
Information about purposes, duration, names and account-data handling is still
provided. This is an implemented profile and draft privacy information, not a
certification of EU/GDPR compliance or a substitute for operator legal review.

Before public launch the operator must verify controller/contact details, legal
bases, recipient/processor and hosting disclosures, transfers, data-subject handling,
retention and backups. SMTP providers receive delivery information. Additional
host/platform cookies are outside this application's control and need a separate
hosting audit. If analytics, embeds, marketing or other non-essential storage is
introduced, gate it appropriately before loading and revisit consent design.

`npm run auth:cleanup` is a dry run. `npm run auth:cleanup -- --apply` purges only
expired sessions/verification and rate-limit records older than a day. Configure
an operator-owned schedule and backup retention; no automation was created here.
Account-erasure requests currently go to the configured contact, not a made-up
self-service deletion screen.

## Testing and preview

- `npm run test:auth-config`: fail-closed configuration, HTTPS, SMTP and actual
  library cookie attributes.
- `npm run test:architecture`: enforced presentation/server boundaries, pure
  account-query handling, neutral tool catalogue and privacy/content separation.
- `npm run test:accounts`: built-app HTTP integration with an explicit
  `AUTH_TEST_DATABASE_URL` pointing to a migrated disposable database.
  It starts a loopback Next instance and capture-only SMTP service, creates its
  own test user, verifies/reset/logs in/out and removes its own fixtures.
  Never target a production database. No browser test dependency was added.
- Existing lint, typecheck, Prisma, SSG, status, line-ending and audit checks remain.

The Perplexity embedded review is intentionally read-only for credentials. Its
account screens are clearly labelled and disabled, while the actual first-party
Next application is tested against PostgreSQL and a capture mailbox. Do not weaken
cookie/origin or anti-framing protections to force login into an opaque iframe.
Real public signup requires operator mail/privacy configuration and owner hosting.
Committing this foundation does not configure public hosting or authorize publication.

Before storing financial records, add per-user authorization on every read/write
using `User.id`, and review recovery, MFA, encryption, retention and backup risks.
