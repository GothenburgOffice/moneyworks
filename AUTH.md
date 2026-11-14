# Accounts and privacy foundation

The account foundation provides public email/password registration, email verification,
login/logout, recovery, optional Google sign-in and a private empty account area.
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
- One user per email address, and one sign-in method per member. See
  [Google sign-in](#google-sign-in) and Better Auth's
  [account-linking semantics](https://better-auth.com/docs/concepts/users-accounts).
- Nodemailer handles SMTP/TLS without a hosted email SDK. No consent manager,
  form library, UI package or client authentication SDK was added.
- Dependency versions and integrity are pinned in `web/package-lock.json`.
  The auth foundation added Better Auth and Nodemailer. Component cleanup also
  declares the already-installed `pg` driver directly because the maintenance
  script imports it; this introduces no new package/version into the installed graph.
  The install audit reported zero vulnerabilities at implementation time, not
  a continuing guarantee. Re-audit updates rather than treating the count as permanent.

## Public homepage and account boundary

The `/en` and `/sv` homepage and tool pages remain SSG with metadata and native navigation.
Reading account cookies is confined to the separate dynamic account route and
auth endpoints. The header's generic Account link does not make home dynamic.
Account HTML is private/no-store, noindex and anti-framing. It overrides the
site-wide `same-origin` referrer policy with `strict-origin`: recovery URLs carry
tokens in the query, and `same-origin` would send the full URL as `Referer` to the
page's own scripts and `/api/health`, where logs could keep it. `strict-origin`
sends only the origin, yet preserves the real Origin on native form POSTs. Do
not use no-referrer on these pages: browsers then submit Origin:null and the
intentionally strict CSRF check must reject them.

Forms work through full-document POST/redirect/GET without JavaScript. That is
how they are built, not a requirement: account pages may use JavaScript (decision #4). The small
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

Origins and secrets live in the root `.env` (copied from `.env.example`); mail,
privacy and registration are site settings stored in the database and edited
at `/admin`. All are optional: without them, accounts stay disabled. Compose
passes account settings only to the app service. Launch prerequisites are tracked in #12.

In `.env`, required before accounts work:

- `APP_ORIGIN`: exact origin, HTTPS except explicit loopback development.
- `APP_ORIGIN_ALIASES` (optional): comma-separated extra exact origins, such as
  another domain or `http://127.0.0.1:<port>` locally (the development default).
  Each follows the same rules as `APP_ORIGIN`; one malformed entry disables
  accounts with a 503 that names this setting. Email links always use
  `APP_ORIGIN`. Cookies follow the request's own origin: `__Host-` and Secure
  on HTTPS, the development names on loopback HTTP.
- `AUTH_SECRET`: a private, independently maintained random value of at least
  32 characters. The template's replacement marker is rejected.
- `SETTINGS_ENCRYPTION_KEY`: 32 random bytes, base64 (`openssl rand -base64 32`).
  Encrypts the stored SMTP password (AES-256-GCM, as in vocabulary-training), so
  a database dump alone does not reveal it. Changing it makes the stored
  password unreadable; `/admin` then says so and asks for it again.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the first admin. While no admin exists, signing
  in on the account page with exactly these values creates that verified account
  (password of at least 15 characters). A verified account with that email is
  promoted and keeps its own password; an unverified one proves nobody's
  ownership, so it is taken over: verified, given `ADMIN_PASSWORD`, its sessions
  ended. Once an admin exists, both are ignored. Others can be
  made admin with `UPDATE "User" SET "isAdmin" = true`.

Admins are ordinary members with `User.isAdmin` set: they sign in on the account
page (password or Google, under the same rules as everyone) and their account page
links to `/admin`. Signing in needs only `APP_ORIGIN` and `AUTH_SECRET`, not mail,
so the first admin can get in to set mail up; registration and recovery wait for
mail. `/admin` (English, `noindex`) and its API answer 404 to everyone but a
signed-in admin. It holds:

- Mail: SMTP host, port, implicit TLS, user, password and from address. External
  SMTP must use TLS; user and password must be present or absent together. The
  password is write-only: the page shows only whether it is set and readable.
- Privacy controller name and contact email: real publishable details, not a
  fictitious operator or an inferred personal email.
- Google sign-in: the OAuth client ID and secret (see [Google sign-in](#google-sign-in)).
  The secret is encrypted like the SMTP password and is write-only.
- Allow public registration: off by default. It can be switched on only once
  mail works and the privacy details are real; contact addresses on reserved
  example domains (`example.com`, `.test`, `.invalid` and similar) never count.
  Switch it off to suspend registration without deleting existing accounts.

The devcontainer forces registration on and seeds clearly fake privacy details
(`Local development, not a real operator`, `dev-privacy@example.test`) into its
own database while none are stored; the account test fixture does the same.
Neither value is ever read from `.env`, and no production stack sets them.

Test delivery through the configured SMTP service before enabling public signup.
The local fixture captures mail only; no real verification/recovery emails were
sent during tests. Delivery failures are logged without addresses, passwords or
token URLs. The owner-hosted process must remain running for asynchronous delivery;
this is not a durable queued-mail implementation or a serverless delivery guarantee.
Next development request-URL logging is disabled because email-link URLs contain
tokens. Independently redact auth/account query paths from proxy/hosting logs;
this repository cannot configure those external logs or their retention.

## Google sign-in

Optional. In the Google Cloud console, create an OAuth client of type "Web
application" with the authorized redirect URI `<APP_ORIGIN>/api/auth/callback/google`
(`/admin` shows the exact value), then save its client ID and secret at `/admin`.
Google sign-in is on while both are saved and mail works; removing the secret
switches it off. Saving another client takes effect at once in that app process.

- **One user per email.** Signing in with Google joins the existing user with that
  address, because Google has proved the address. A Google address Google has not
  verified is refused (`email_not_verified`); no provider is "trusted" to skip that.
- **New members** can sign up with Google only while registration is open at
  `/admin` (otherwise `signup_disabled`, with its own message).
- **One sign-in method per member.** When a member signs in with Google, their
  password is removed, and no new one can be created while Google is on: password
  recovery mails a "sign in with Google" note instead of a reset link, and a
  database hook refuses a new password record (`use_google`). If the operator
  switches Google off, recovery works again and gives the member a password, so
  nobody is locked out; their next Google sign-in removes that password again. The
  password is removed only after a Google sign-in has succeeded. Admins are no exception: they reach `/admin` through
  any sign-in.
- **Unverified squatters.** If someone registered the address with a password but
  never verified it, Google signing in proves the real owner: that password and
  its sessions are deleted (as in the admin bootstrap) and the address is verified.
- **Registering an existing address** changes nothing and answers like a new
  registration, so the form never reveals which addresses have accounts. The
  mailbox gets "You already have a MoneyWorks account" (or, for a Google member,
  "Sign in with Google") instead.
- **Data kept:** the address and Google's account ID. The name and photo are not
  copied, and Google's access, refresh and ID tokens are not stored. The privacy
  page describes Google sign-in while it is on.
- The flow starts from a native form (`/api/account/google`, origin-checked like the
  other account forms) that redirects to `accounts.google.com`; the CSP's
  `form-action` allows that origin for this redirect. Google returns to
  `APP_ORIGIN`, so the button is shown only there, not on `APP_ORIGIN_ALIASES`.

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

## Account lifecycle: export, deletion and admin user management

Members manage their own data on the account page:

- **Export:** "Download my data" is `GET /api/account/export`, a JSON file of
  everything stored about the signed-in member: the account row, sign-in methods
  (for Google, the account ID Google gave this site), active sessions with IP and
  browser, and saved scenarios. It never includes password hashes, session tokens or
  anything else that signs in, and it only ever exports the session's own user.
  The format is versioned (`format: "moneyworks-account-export"`, `version: 1`);
  there is no import.
- **Deletion:** the "Delete account" form posts to `/api/account/delete`, which calls
  Better Auth's `delete-user` through the form bridge (rate limited, 5/minute). It
  needs the confirmation box, and a password member's password: the bridge refuses
  an empty one, because Better Auth would otherwise accept any recent session. A
  Google member needs a session younger than `freshAge` (10 minutes), so they sign
  in with Google again first. The user and everything it owns (accounts, sessions,
  scenarios) are deleted at once, with no grace period, and the session cookie is
  cleared. The last admin who can sign in cannot delete their own account: just
  before the delete, one transaction under the admin-actions advisory lock checks
  that rule and moves the account to the trash, so two admins deleting themselves
  at once cannot both pass (and an account whose delete then fails stays locked
  out until the purge).

Admins manage accounts at `/admin/users` (same 404-unless-admin rule as `/admin`):
a server-paged list (50 per page) with email search, an Active/Locked/Trash
filter, sorting by email, creation or last sign-in, and per-account actions:

- **Lock / Unlock:** `User.lockedAt`. Locking ends the account's sessions at once.
- **Trash / Restore:** `User.deletedAt`. The trash also ends sessions and blocks
  sign-in; after 30 days (`TRASH_DAYS`) the account is deleted with all its data.
  Expired trash is purged when the first page of the list loads and by
  `auth:cleanup -- --apply`.
- An admin cannot lock or trash their own account, and the last admin who can still
  sign in cannot be locked or trashed. Changes run one at a time under a
  PostgreSQL advisory lock, so two admins cannot remove each other.

A locked or trashed account cannot sign in by any method: a `session.create.before`
hook refuses the session after the password or Google check, and the account page
says the account is locked (callback error `account_locked` for Google). Once the
session is committed, the `after` hook reads the user row again `FOR SHARE` and
removes the session if the account was locked in between; an admin change updates
the user row before it deletes sessions, so one of the two always catches it.
`User.lastSignInAt` is set on every new session and shown in the list.

## Cookies and privacy

The application uses a necessary-only profile, not a fake consent banner:
the footer contains a small persistent explanation plus native Cookies & privacy
disclosure. No accept-all, pre-ticked consent or consent-dismissal cookie exists.
Locale cookies are disabled; language and theme use URLs. Better Auth telemetry is off.
Anonymous English and Swedish pages were checked to set no cookies.

Tools may keep what a visitor types in `sessionStorage` for that tab (the FIRE
calculator does): it never leaves the browser, ends when the tab closes and is
listed on the privacy page. This is storage the visitor asked for by using the
tool, not tracking, so it needs no consent step.

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
expired sessions/verification, rate-limit records older than a day and accounts
that have been in the admin trash for 30 days. Configure an operator-owned schedule
and backup retention; no automation was created here. Members delete their own
account and download their data on the account page; other erasure or access
requests go to the configured privacy contact. Deleted accounts remain in
backups until those expire.

## Testing

- `npm run test:auth-config`: fail-closed configuration, HTTPS, SMTP and actual
  library cookie attributes.
- `npm run test:architecture`: enforced presentation/server boundaries, pure
  account-query handling, neutral tool catalogue and privacy/content separation.
- `npm run test:accounts`: built-app HTTP integration with an explicit
  `AUTH_TEST_DATABASE_URL` pointing to a migrated disposable database.
  It starts a loopback Next instance and capture-only SMTP service, creates its
  own test user, verifies/reset/logs in/out and removes its own fixtures. It also
  covers the export, self-deletion, the last-admin guard, locking (password and
  Google) and the trash with its 30-day purge.
  Never target a production database.
- `npm run test:e2e:accounts`: the account pages in Chromium (desktop and phone,
  English and Swedish) against the same fixture, after `npm run build` and with
  the same `AUTH_TEST_DATABASE_URL`: registration, the mailed verification and
  recovery links, sign-in, language switching while signed in, sign-out, form
  messages, the disabled reset form, the privacy page, the data download, account
  deletion and the whole flow (deletion included) without JavaScript. It deletes
  the users and rate-limit rows it created.
- Existing lint, typecheck, Prisma, SSG, line-ending and audit checks remain.

Account pages send anti-framing headers. Do not weaken cookie/origin or framing
protections to make sign-in work inside an iframe. Real public
signup requires operator mail/privacy configuration (#12).

The `Scenario` table is ready for saved tool work but nothing writes to it yet
(decision #8). Before storing financial records, add per-user authorization on
every read/write using `User.id`, and review recovery, MFA, encryption, retention
and backup risks.
