import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { test } from "node:test";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

const trackedFiles = git(["ls-files", "-z"]).split("\0").filter(Boolean);
const containerInputs = trackedFiles.filter((path) =>
  /(^|\/)(Dockerfile[^/]*|\.dockerignore|\.env\.example)$|\.(sh|ya?ml|sql|prisma|toml)$/.test(path),
);

test("container inputs in this checkout contain no CRLF", () => {
  assert.ok(containerInputs.length > 0);
  for (const path of containerInputs) {
    assert.ok(!readFileSync(join(root, path)).includes("\r\n"), `${path} contains CRLF`);
  }
});

test("container inputs stay LF with Windows-style Git checkout settings", () => {
  const directory = mkdtempSync(join(tmpdir(), "moneyworks-checkout-"));
  try {
    git(["-c", "core.autocrlf=true", "checkout-index", `--prefix=${directory}${sep}`, "--all"]);
    for (const path of containerInputs) {
      assert.ok(
        !readFileSync(join(directory, path)).includes("\r\n"),
        `${path} acquired CRLF with core.autocrlf=true`,
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("future shell scripts explicitly use LF", () => {
  assert.equal(
    git(["check-attr", "text", "eol", "--", "docker/future-entrypoint.sh"]),
    "docker/future-entrypoint.sh: text: set\ndocker/future-entrypoint.sh: eol: lf\n",
  );
});

test("workflow stays tracked and LF, but is ignored by source archive exports", () => {
  git(["ls-files", "--error-unmatch", ".github/workflows/ci.yml"]);
  assert.match(
    git(["check-attr", "export-ignore", "--", ".github/workflows"]),
    /export-ignore: set/,
  );
  assert.match(git(["check-attr", "eol", "--", ".github/workflows/ci.yml"]), /eol: lf/);
});
