# MoneyWorks

The shared project reference for coding agents (also read by Copilot):

@.github/copilot-instructions.md

## Claude Code specifics

- The host has Docker but no Node.js or npm. Run project commands inside the
  devcontainer (`/workspace/web`), or from the host through
  `docker compose -f compose.yaml -f compose.dev.yaml exec app <command>`.
- Every image is Debian-based (`node:22.23.4-trixie-slim`); install
  system packages with `apt-get`, not `apk`.
- Node 22 is the oldest supported line and the dev runtime. Do not use APIs
  added after Node 22; CI and the release image also run on Node 22.
- Claude Code's login and settings persist in the devcontainer's
  `claude-config` volume (`CLAUDE_CONFIG_DIR=/root/.claude`). The container
  bind-mounts project memory from `~/.claude-memory/moneyworks`
  (`CLAUDE_MEMORY_DIR` overrides it) at `/root/.claude/projects/-workspace/memory`.
  Claude Code on a Windows host shares that memory only after its
  `.claude\projects\<slug>\memory` folder is replaced by a junction to the same
  folder; the README's "Sharing Claude Code memory with the host" has the
  one-time steps. To remove or retarget a junction, use `cmd /c rmdir "<link>"`;
  in PowerShell 5.1 `Remove-Item -Recurse` on a junction can delete the
  target's contents.
- Never label issues `good first issue` or `help wanted`; the owner sets those
  manually. Outside pull requests are only accepted for `help wanted` issues or
  approved plans (see `CONTRIBUTING.md`).
- Open decisions are GitHub issues labelled `decision`
  (`gh issue list --label decision`). Check them before starting feature work.
- Put session logs, verification notes and scratch decisions in the gitignored
  `notes/` folder or `CLAUDE.local.md`, not in tracked docs.
