// The editable financial model: built from the planner engine, every figure a formula.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const hasPython = spawnSync('python3', ['-c', 'import openpyxl'], { encoding: 'utf8' }).status === 0;

test('the financial model is written with formulas for each variant, and the engine figures are kept for the check', { skip: !hasPython && 'python3 with openpyxl is not installed' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'model-test-'));
  const out = path.join(dir, 'model.xlsx');
  const log = execFileSync(process.execPath, ['scripts/model/make.mjs', 'scripts/model/example.fr.json', out], { cwd: root, encoding: 'utf8' });
  assert.match(log, /3 variants/);
  const probe = execFileSync('python3', ['-c', `
import json, sys
from openpyxl import load_workbook
wb = load_workbook(sys.argv[1])
print(json.dumps({"sheets": wb.sheetnames, "budget": wb["Plan A"]["C28"].value, "margin": wb["Plan B"]["I18"].value, "cash": wb["Trésorerie C"]["F6"].value, "area": wb["Plan A"]["C5"].value}))
`, out], { encoding: 'utf8' });
  const p = JSON.parse(probe);
  assert.deepEqual(p.sheets, ['Synthèse', 'Plan A', 'Trésorerie A', 'Plan B', 'Trésorerie B', 'Plan C', 'Trésorerie C', 'Sources']);
  assert.equal(p.budget, '=C26+C27');
  assert.equal(p.margin, '=SUMPRODUCT(D14:D17,I14:I17)');
  assert.match(String(p.cash), /^=/);
  assert.ok(p.area > 10 && p.area < 11, 'variant A plants about 10.8 ha');
  const engine = JSON.parse(fs.readFileSync(out.replace(/\.xlsx$/, '.engine.json'), 'utf8'));
  assert.equal(engine.variants.length, 3);
  assert.ok(Math.abs(engine.variants[0].engine.total - 100000 * engine.fx2) < 1, 'the budget uses the whole capital');
});
