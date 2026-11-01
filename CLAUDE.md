# MoneyWorks

The shared project reference for coding agents (also read by Copilot):

@.github/copilot-instructions.md

## Claude Code specifics

- The host has Docker but no Node.js or npm. Run project commands inside the
  devcontainer (`/workspace/web`), or from the host through
  `docker compose -f docker-compose.dev.yml exec web <command>`.
- The development image is Debian-based (`node:22.23.4-trixie-slim`); install
  system packages with `apt-get`, not `apk`.
- Node 22 is the oldest supported line and the dev runtime. Do not use APIs
  added after Node 22; CI and the release image also run on Node 22.
- Claude Code's login and settings persist in the devcontainer's
  `claude_config` volume (`CLAUDE_CONFIG_DIR=/root/.claude`).
- Never label issues `good first issue` or `help wanted`; the owner sets those
  manually. Outside pull requests are only accepted for `help wanted` issues or
  approved plans (see `CONTRIBUTING.md`).
- Open decisions are GitHub issues labelled `decision`
  (`gh issue list --label decision`). Check them before starting feature work.
- Put session logs, verification notes and scratch decisions in the gitignored
  `notes/` folder or `CLAUDE.local.md`, not in tracked docs.
