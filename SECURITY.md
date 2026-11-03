# Security policy

MoneyWorks is self-hosted software with accounts, sessions and an admin page,
so security reports are welcome. The project is maintained by one person in
their spare time: there is no bug bounty and no guaranteed response time.

## Supported versions

Only the latest code on `main` and the latest release image
(`ghcr.io/gothenburgoffice/moneyworks:latest`) get security fixes. There are
no versioned releases or backports. No public MoneyWorks instance is run by the
project yet, so reports concern the code and images in this repository.

## Reporting a vulnerability

Report privately through
[GitHub private vulnerability reporting](https://github.com/GothenburgOffice/moneyworks/security/advisories/new).
Do not open a public issue, pull request or discussion for a vulnerability.

Please include:

- the affected route, component or file, and the commit or image tag you tested;
- steps to reproduce, ideally against a local stack started as described in the
  [README](README.md#getting-started);
- what an attacker gains, and any configuration it depends on.

You should get an acknowledgement within a couple of weeks. Once a fix is
merged, the advisory is published and you are credited unless you prefer not
to be.

## In scope

- Sign-in, registration, email verification, password recovery and sessions
- Google sign-in: the OAuth flow, joining a Google identity to an existing
  account by email address, and removing the password when Google is linked
- Authorization of account data and the `/admin` page and API
- Handling of stored secrets (`SiteSetting` encryption, environment variables)
- Security headers, CSP, cookie attributes and origin checks
- The Dockerfile, Compose files and published release image
- Leaks of financial inputs from the browser (the FIRE calculator is meant to
  keep them on the device)

[AUTH.md](AUTH.md) describes the intended security boundaries; behavior that
contradicts it is worth reporting.

## Out of scope

- Instances run by other people: report those to their operator
- Reverse proxy, TLS, backups or hosting setup outside this repository
- Vulnerabilities in dependencies without a way to reach them through
  MoneyWorks (report them upstream; Dependabot tracks updates here)
- Missing hardening without a concrete impact, automated scanner output without
  a working proof of concept, and denial of service through traffic volume
- Social engineering of the maintainer or of third parties

## Testing

Test against your own local stack. Do not test against instances you do not
operate, access other people's data or send email to addresses you do not own.
