import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workspace = JSON.parse(readFileSync(new URL('../../moneyworks.code-workspace', import.meta.url), 'utf8'));

test('VS Code opens the repository root and scopes tooling to web', () => {
  assert.deepEqual(workspace.folders, [{ path: '.' }]);
  assert.deepEqual(workspace.settings['eslint.workingDirectories'], ['web']);
  assert.equal(workspace.settings['typescript.tsdk'], 'web/node_modules/typescript/lib');
});

test('workspace recommends the requested extensions and existing-stack tooling', () => {
  const ids = workspace.extensions.recommendations;
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [
    'anthropic.claude-code', 'ms-azuretools.vscode-docker',
    'github.vscode-github-actions', 'ms-vscode-remote.remote-containers',
    'dbaeumer.vscode-eslint', 'Prisma.prisma',
  ]) assert.ok(ids.includes(id), `Missing ${id}`);
  assert.equal(workspace.tasks, undefined);
  assert.equal(workspace.launch, undefined);
});
