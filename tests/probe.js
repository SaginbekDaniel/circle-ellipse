'use strict';
/* Deterministic probe of the protected maths engine. Used both to create the golden snapshot and to compare against it. */
const E = require('../js/engine.js');
module.exports = function probe() {
  const out = {};
  const ab = [[5, 4], [5, 5], [9, 0.1], [3, 2.5], [10, 0.5]];
  out.props = ab.map(([a, b]) => E.props(a, b));
  out.focal = [0.1, 0.9, 2.2, 4].map((t) => { const p = E.point(5, 4, t); return E.focalDistances(5, 4, p[0], p[1]); });
  out.rotation = [0, 30, 45, -60, 90].map((d) => { const th = d * Math.PI / 180; return { Q: E.quadForm(5, 4, th), ev: E.eig2sym(E.quadForm(5, 4, th)), sc: E.refScaled(th), res: E.rotationResidual(5, 4, th, 720) }; });
  out.optics = [0.3, 1.0, 2.5, 4.0, 5.5].map((t) => E.traceToBoundary(5, 4, t));
  out.gradS = [0.4, 2.0].map((t) => { const p = E.point(5, 4, t); return E.gradS(5, 4, p[0], p[1]); });
  out.billiards = [[1, 0.5, 0.55], [-4.5, 0.3, 0.45], [0, 0.5, 1.2], [0, 0, Math.PI / 2]].map(([x, y, ang]) => {
    const d = [Math.cos(ang), Math.sin(ang)]; const r = E.billiardBounces(5, 4, x, y, d[0], d[1], 300);
    return { lam0: r.lams[0], lamEnd: r.lams[r.lams.length - 1], kind: E.causticKind(5, 4, r.lams[0]), last: r.pts[r.pts.length - 1], end: r.end, n: r.pts.length };
  });
  out.kepler = [0, 1.3, 4.4, 7.7].map((t) => E.keplerState(5, 4, 2 * Math.PI / 9, t));
  out.harmonic = [0, 1.3, 4.4].map((t) => E.harmonicState(5, 4, 2 * Math.PI / 10, t));
  out.sweep = [[0, 10 / 12], [10 / 12, 20 / 12], [4, 4.9]].map(([a, b]) => ({ num: E.sweptAreaNumeric(5, 4, 2 * Math.PI / 10, a, b), exact: E.sweptAreaExact(5, 4, 2 * Math.PI / 10, a, b) }));
  const g = E.sampleGaussian2D(10000, 42, 5, 4);
  out.gauss = { first: Array.from(g.slice(0, 6)), c1: E.countInside(g, 10000, 5, 4, 1), c95: E.countInside(g, 10000, 5, 4, E.CHI2_95), chi95: E.CHI2_95, cov1: E.coverage2D(1), q: E.quantile2D(0.6827), one: E.normalCoverage1D(1) };
  out.perimeter = ab.map(([a, b]) => ({ simpson: E.perimeterIntegral(a, b, 1e-13).value, agm: E.perimeterAGM(a, b), series: E.perimeterSeries(a, b), r1: E.ramanujan1(a, b), r2: E.ramanujan2(a, b) }));
  out.curv = [0, 0.7, Math.PI / 2].map((t) => E.curvature(5, 4, t));
  return out;
};
