'use strict';
/* Protects the mathematical engine: (1) analytic invariants that must hold regardless of any snapshot,
   (2) a golden snapshot taken from the ORIGINAL engine before the redesign.   Run: node --test tests/ */
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), crypto = require('crypto'), path = require('path');
const E = require('../js/engine.js');
const probe = require('./probe.js');

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} |${a} - ${b}| = ${Math.abs(a - b)} > ${tol}`);
function compare(a, b, p, tol = 1e-12) {
  if (typeof a === 'number') { assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${p}: ${a} vs ${b}`); return; }
  if (a && typeof a === 'object') { for (const k of Object.keys(b)) compare(a[k], b[k], p + '.' + k, tol); return; }
  assert.equal(a, b, p);
}

test('engine.js is byte-identical to the pre-redesign engine', () => {
  const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../js/engine.js'))).digest('hex');
  assert.equal(h, 'f57076f381e832c1fb18955b803b3d3864144378a5045125942fe6483a6d85c0');
});
test('golden snapshot: every probed engine output is unchanged', () => {
  const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'engine.golden.json'), 'utf8'));
  compare(JSON.parse(JSON.stringify(probe())), golden, 'probe');
});
test('reference ellipse 5/4: c=3, e=0.6, area=20π', () => {
  const p = E.props(5, 4); close(p.c, 3, 1e-15); close(p.e, 0.6, 1e-15); close(p.area, 20 * Math.PI, 1e-12);
});
test('focal-distance sum is 2a on the whole curve', () => {
  for (let i = 0; i < 720; i++) { const p = E.point(5, 4, (E.TAU * i) / 720), f = E.focalDistances(5, 4, p[0], p[1]); close(f.sum, 10, 1e-12); }
});
test('reflection theorem: ray from F1 reflects exactly toward F2', () => {
  for (let i = 1; i < 40; i++) { const tr = E.traceToBoundary(5, 4, (E.TAU * i) / 40); close(tr.miss, 0, 1e-9); close(tr.inc, tr.refl, 1e-12); close(tr.lenIn + tr.lenOut, 10, 1e-12); }
});
test('rotated ellipse: 73x² − 18√3xy + 91y² = 1600 at 30°', () => {
  const s = E.refScaled(Math.PI / 6); close(s.A, 73, 1e-12); // xy coefficient is −72·sinθ·cosθ = −18√3
  close(s.B, -18 * Math.sqrt(3), 1e-12); close(s.C, 91, 1e-12);
  assert.ok(E.rotationResidual(5, 4, Math.PI / 6, 720) < 1e-14);
});
test('billiards conserve the confocal invariant λ', () => {
  const r = E.billiardBounces(5, 4, 1, 0.5, Math.cos(0.55), Math.sin(0.55), 2000);
  for (const l of r.lams) close(l, r.lams[0], 1e-9);
});
test('Kepler: equal areas in equal times, numeric vs (ab/2)ΔM', () => {
  const n = E.TAU / 10; for (let k = 0; k < 12; k++) close(E.sweptAreaNumeric(5, 4, n, (10 * k) / 12, (10 * (k + 1)) / 12), E.sweptAreaExact(5, 4, n, (10 * k) / 12, (10 * (k + 1)) / 12), 1e-8);
});
test('Gaussian experiment is seeded and reproducible (n = 10 000)', () => {
  const a = E.sampleGaussian2D(10000, 42, 5, 4), b = E.sampleGaussian2D(10000, 42, 5, 4);
  assert.deepEqual(Array.from(a), Array.from(b));
  close(E.coverage2D(1), 1 - Math.exp(-0.5), 1e-15); close(E.CHI2_95, 5.991464547107979, 1e-12);
  const c1 = E.countInside(a, 10000, 5, 4, 1) / 10000; close(c1, 0.3935, 0.03);
});
test('perimeter: four independent methods agree for (5,4)', () => {
  const P = E.perimeterIntegral(5, 4, 1e-13).value;
  close(P, 28.361667889, 1e-8); close(E.perimeterAGM(5, 4), P, 1e-10); close(E.perimeterSeries(5, 4), P, 1e-10); close(E.ramanujan2(5, 4), P, 1e-9);
});
