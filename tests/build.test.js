import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('the site builds: content, knowledge base and engine bundle without syntax errors', () => {
  const out = execFileSync(process.execPath, ['site/build.mjs', '--target=artifact'], { cwd: root, encoding: 'utf8' });
  assert.match(out, /artifact build/);
});
