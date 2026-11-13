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
- Assign every pull request you open to `hkarn`, so it shows up in the owner's
  GitHub views: `gh pr create --assignee hkarn`, or
  `gh pr edit <N> --add-assignee hkarn` for a pull request opened another way (a
  GitHub MCP tool, or a draft the environment opened).
- Reply to every review comment (see the workflow in
  `.github/copilot-instructions.md`) but never resolve a conversation: `main`
  requires resolved conversations, and the owner resolves them.
- Never merge, approve or enable auto-merge on a pull request; the owner's merge
  is the approval.
- Sign everything you post on GitHub (pull request descriptions, issues,
  comments and review replies) with a last line
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- On GitHub, a `@claude` mention in an issue runs `.github/workflows/claude.yml`,
  which is read-only. Only when running in that workflow (the prompt says you
  are helping with a GitHub issue, and Bash/Edit/Write are denied): review the
  issue against the code on `main`; if it's already done or no longer applies,
  say so and suggest closing it; otherwise reply with a concrete plan (files,
  steps, tests owed, open questions). Don't try to change files or push there.
  Every other session, wherever it runs, works on issues as usual.
