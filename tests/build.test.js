import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('the site builds: content, knowledge base and engine bundle without syntax errors', () => {
  const out = execFileSync(process.execPath, ['site/build.mjs', '--target=artifact'], { cwd: root, encoding: 'utf8' });
  assert.match(out, /artifact build/);
});

test('the android bundle builds offline: one page, hash routes, forms sent to the public site', async () => {
  const fs = await import('node:fs');
  const out = execFileSync(process.execPath, ['site/build.mjs', '--target=android'], { cwd: root, encoding: 'utf8', env: { ...process.env, APP_SITE_URL: 'https://djalumo.test' } });
  assert.match(out, /android build/);
  const html = fs.readFileSync(new URL('../android-www/index.html', import.meta.url), 'utf8');
  assert.match(html, /const AF_TARGET = "android"/);
  assert.match(html, /"siteUrl":"https:\/\/djalumo\.test"/);
  assert.match(html, /connect-src 'self' https:\/\/djalumo\.test/);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.ok(fs.existsSync(new URL('../android-www/img/founder-tomato.webp', import.meta.url)));
});
