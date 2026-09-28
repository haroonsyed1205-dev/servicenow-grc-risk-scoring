'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { load, plain } = require('./harness');
const data = require('../sample_data/risks.json');

const ctx = load(['RiskScoringEngine.js', 'VendorRiskTiering.js']);
const engine = new ctx.RiskScoringEngine({ appetite: { default: 12, cyber: 8 } });

test('controls compound: effective 50% then partial 25% of remaining = 62.5%', () => {
  const r = engine.score(data.risks[0], data.risks[0].controls, data.today);
  assert.strictEqual(r.inherent, 20);
  assert.strictEqual(r.inherentRating, 'critical');
  assert.strictEqual(r.controlReductionPct, 63);
  assert.strictEqual(r.residual, 8);          // 20 * 0.375 = 7.5 -> 8
  assert.strictEqual(r.residualRating, 'medium');
  assert.strictEqual(r.appetiteBreach, false); // cyber appetite 8
});

test('stale control evidence is not counted', () => {
  const r = engine.score(data.risks[1], data.risks[1].controls, data.today);
  assert.strictEqual(r.residual, 12);
  assert.strictEqual(r.controlReductionPct, 0);
  assert.match(r.notes[0], /CTL020: test evidence older than 365 days/);
  assert.strictEqual(r.appetiteBreach, false); // 12 is not above 12
});

test('no controls: residual equals inherent', () => {
  const r = engine.score(data.risks[2], [], data.today);
  assert.strictEqual(r.residual, 10);
  assert.strictEqual(r.residualRating, 'medium');
});

test('reduction is capped at 80% and residual never below 1', () => {
  const ctls = Array.from({ length: 5 }, (_, i) => ({ id: 'C' + i, effectiveness: 'effective', lastTested: '2026-09-01' }));
  const r = engine.score({ likelihood: 5, impact: 5 }, ctls, data.today);
  assert.strictEqual(r.controlReductionPct, 80);
  assert.strictEqual(r.residual, 5);
  assert.strictEqual(engine.score({ likelihood: 1, impact: 1 }, ctls, data.today).residual, 1);
});

test('appetite breach by category', () => {
  const r = engine.score({ likelihood: 3, impact: 3, category: 'cyber' }, [], data.today);
  assert.strictEqual(r.appetiteBreach, true);
  assert.strictEqual(r.appetiteLimit, 8);
});

test('invalid likelihood/impact rejected', () => {
  const r = engine.score({ likelihood: 0, impact: 2.5 });
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.errors.length, 2);
});

test('vendor tiering from sample questionnaires', () => {
  const t = new ctx.VendorRiskTiering();
  const res = data.vendors.map((v) => plain(t.tier(v.answers)));
  assert.deepStrictEqual(res.map((r) => [r.score, r.tier]), [[70, 1], [0, 3], [35, 1]]);
  assert.deepStrictEqual(res[2].forcedReasons, ['Customer PII without a SOC 2 report']);
  assert.strictEqual(res[1].reassessMonths, 36);
});

test('vendor tiering validates answers', () => {
  const r = new ctx.VendorRiskTiering().tier({ data_access: 'lots' });
  assert.strictEqual(r.valid, false);
  assert.ok(r.errors.some((e) => /Invalid answer for data_access/.test(e)));
  assert.ok(r.errors.some((e) => /Missing answer: soc2_report/.test(e)));
});
