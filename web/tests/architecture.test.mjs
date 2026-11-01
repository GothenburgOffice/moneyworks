import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { ESLint } from "eslint";
import { inspectPresentationSource } from "./support/source-boundaries.mjs";

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(filename) : /\.tsx?$/.test(filename) ? [filename] : [];
  });
}

test("presentation, content and pure features stay free of auth, persistence and environment access", () => {
  for (const directory of ["components", "content", "features", "i18n"]) {
    for (const filename of sourceFiles(path.resolve("src", directory))) {
      assert.deepEqual(
        inspectPresentationSource(readFileSync(filename, "utf8"), filename),
        [],
        filename,
      );
    }
  }
});

test("boundary inspection catches aliases, relatives, re-exports, dynamic imports and environment reads", () => {
  const filename = path.resolve("src/components/account/fixture.tsx");
  for (const source of [
    "import {getDatabase} from '@/lib/db';",
    "export {getAuth} from '../../lib/auth';",
    "const auth = import('@/lib/auth-config');",
    "const db = require('../../lib/db.ts');",
    "import type {User} from '@/generated/prisma/client';",
    "const secret = process.env.AUTH_SECRET;",
    "const secret = process['env'].AUTH_SECRET;",
  ])
    assert.ok(inspectPresentationSource(source, filename).length, source);
  assert.deepEqual(
    inspectPresentationSource("import type {Locale} from '@/content/site';", filename),
    [],
  );
});

test("ESLint actively rejects server imports in presentation files", async () => {
  const eslint = new ESLint();
  for (const specifier of ["@/lib/db", "../../lib/auth-config", "@/generated/prisma/client"]) {
    const [result] = await eslint.lintText(`import '${specifier}';\n`, {
      filePath: "src/components/account/boundary-fixture.tsx",
    });
    assert.ok(
      result.messages.some((message) => message.ruleId === "no-restricted-imports"),
      specifier,
    );
  }
});

test("database and auth modules retain explicit server-only guards", () => {
  for (const name of ["db", "auth", "auth-http", "auth-mail"]) {
    assert.match(readFileSync(`src/lib/${name}.ts`, "utf8"), /^import ["']server-only["'];/);
  }
});

test("public SSG boundary stays outside session lookup", () => {
  const page = readFileSync("src/app/[locale]/page.tsx", "utf8");
  const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8");
  assert.match(page, /dynamic = ["']force-static["']/);
  assert.doesNotMatch(page + layout, /getSession|next\/headers|@\/lib\/auth/);
});

test("privacy presentation and copy are independent of account content and auth", () => {
  for (const filename of [
    "src/content/privacy.ts",
    "src/components/cookie-notice.tsx",
    "src/components/privacy/privacy-content.tsx",
  ])
    assert.doesNotMatch(readFileSync(filename, "utf8"), /content\/account|@\/lib\/auth/);
});

test("cleanup uses an explicitly declared, locked runtime dependency", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  assert.equal(manifest.dependencies.pg, lock.packages[""].dependencies.pg);
  assert.equal(manifest.dependencies.pg, lock.packages["node_modules/pg"].version);
});
