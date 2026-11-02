/* engine.js — the mathematics behind every scene. Pure functions, no DOM.
   Loaded in the browser as `Engine` and in Node by tests/math.test.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const TAU = 2 * Math.PI;
  const REF = Object.freeze({ a: 5, b: 4 });

  /* ---------- ellipse basics (a >= b > 0) ---------- */
  function props(a, b) {
    const c = Math.sqrt(Math.max(0, a * a - b * b));
    return { a, b, c, e: c / a, area: Math.PI * a * b };
  }
  function focalDistances(a, b, x, y) {
    const c = props(a, b).c;
    const d1 = Math.hypot(x + c, y), d2 = Math.hypot(x - c, y);
    return { d1, d2, sum: d1 + d2, c };
  }
  function point(a, b, t, theta) {
    const th = theta || 0, x = a * Math.cos(t), y = b * Math.sin(t);
    return [x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th)];
  }
  /* parameter t of the boundary point reached by scaling (x,y) back to the unit-circle picture —
     used to drag a point along the curve */
  function paramFromPoint(a, b, x, y) { return Math.atan2(y / b, x / a); }
  function samplePath(a, b, n, theta) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(point(a, b, (TAU * i) / n, theta));
    return out;
  }
  function curvature(a, b, t) {
    const s = Math.sin(t), c = Math.cos(t);
    return (a * b) / Math.pow(a * a * s * s + b * b * c * c, 1.5);
  }

  /* ---------- linear algebra ---------- */
  /* Q = R(θ) diag(1/a², 1/b²) R(θ)ᵀ — the ellipse rotated CCW by θ is {p : pᵀQp = 1} */
  function quadForm(a, b, theta) {
    const c = Math.cos(theta), s = Math.sin(theta), d1 = 1 / (a * a), d2 = 1 / (b * b);
    return { xx: d1 * c * c + d2 * s * s, xy: (d1 - d2) * c * s, yy: d1 * s * s + d2 * c * c };
  }
  /* eigen-decomposition of a symmetric 2×2 matrix; values ascending, unit vectors */
  function eig2sym(m) {
    const mean = (m.xx + m.yy) / 2, half = Math.hypot((m.xx - m.yy) / 2, m.xy);
    const phi = 0.5 * Math.atan2(2 * m.xy, m.xx - m.yy); // direction of the larger eigenvalue
    return {
      values: [mean - half, mean + half],
      vectors: [[-Math.sin(phi), Math.cos(phi)], [Math.cos(phi), Math.sin(phi)]],
    };
  }
  function quadValue(m, x, y) { return m.xx * x * x + 2 * m.xy * x * y + m.yy * y * y; }
  /* 1600·Q for the reference ellipse: (64c²+100s²)x² − 72sc·xy + (64s²+100c²)y² = 1600 */
  function refScaled(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    return { A: 64 * c * c + 100 * s * s, B: -72 * s * c, C: 64 * s * s + 100 * c * c, rhs: 1600 };
  }
  /* largest |pᵀQp − 1| over points generated from the parametrisation (independent check) */
  function rotationResidual(a, b, theta, n) {
    const Q = quadForm(a, b, theta), N = n || 720;
    let worst = 0;
    for (let i = 0; i < N; i++) {
      const p = point(a, b, (TAU * i) / N, theta);
      worst = Math.max(worst, Math.abs(quadValue(Q, p[0], p[1]) - 1));
    }
    return worst;
  }

  /* ---------- optics ---------- */
  /* smallest positive t with |P + t·d| on the ellipse, P inside or on it */
  function rayEllipse(a, b, px, py, dx, dy) {
    const A = (dx * dx) / (a * a) + (dy * dy) / (b * b);
    const B = 2 * ((px * dx) / (a * a) + (py * dy) / (b * b));
    const C = (px * px) / (a * a) + (py * py) / (b * b) - 1;
    const disc = B * B - 4 * A * C;
    if (disc < 0 || A === 0) return null;
    const sq = Math.sqrt(disc);
    const t = B >= 0 ? (-2 * C) / (B + sq) : (-B + sq) / (2 * A);
    return t > 0 ? t : null;
  }
  function normalAt(a, b, x, y) {
    const nx = x / (a * a), ny = y / (b * b), L = Math.hypot(nx, ny);
    return [nx / L, ny / L];
  }
  function reflect(dx, dy, nx, ny) {
    const k = 2 * (dx * nx + dy * ny);
    return [dx - k * nx, dy - k * ny];
  }
  function angleBetween(u, v) {
    const cross = u[0] * v[1] - u[1] * v[0], dot = u[0] * v[0] + u[1] * v[1];
    return Math.abs(Math.atan2(cross, dot));
  }
  /* full optical trace of one ray leaving F1 at angle phi: intersection, normal, law of reflection */
  function traceFromFocus(a, b, phi) {
    const c = props(a, b).c, d = [Math.cos(phi), Math.sin(phi)];
    const t = rayEllipse(a, b, -c, 0, d[0], d[1]);
    if (t === null) return null;
    const P = [-c + t * d[0], t * d[1]], n = normalAt(a, b, P[0], P[1]);
    const r = reflect(d[0], d[1], n[0], n[1]);
    const toF2 = [c - P[0], -P[1]], L = Math.hypot(toF2[0], toF2[1]);
    const tof = [toF2[0] / L, toF2[1] / L];
    return { P, n, d, r, toF2: tof, miss: angleBetween(r, tof),
      inc: angleBetween(d, n), refl: angleBetween(r, [-n[0], -n[1]]), // angles measured from the normal, ∈ [0, π/2]
      lenIn: t, lenOut: L };
  }
  /* trace for the boundary point with parameter t, source F1 */
  function traceToBoundary(a, b, t) {
    const c = props(a, b).c, P = point(a, b, t);
    return traceFromFocus(a, b, Math.atan2(P[1], P[0] + c));
  }
  /* ∇S for S(P)=|PF1|+|PF2|, and its angle to the true surface normal */
  function gradS(a, b, x, y) {
    const c = props(a, b).c, u1 = [x + c, y], u2 = [x - c, y];
    const l1 = Math.hypot(u1[0], u1[1]), l2 = Math.hypot(u2[0], u2[1]);
    const nu1 = [u1[0] / l1, u1[1] / l1], nu2 = [u2[0] / l2, u2[1] / l2];
    const g = [nu1[0] + nu2[0], nu1[1] + nu2[1]], gl = Math.hypot(g[0], g[1]);
    const n = normalAt(a, b, x, y);
    return { u1: nu1, u2: nu2, g, gl, angleToNormal: angleBetween([g[0] / gl, g[1] / gl], n) };
  }

  /* ---------- billiards ---------- */
  /* invariant λ of a chord: the line is tangent to the confocal conic x²/(a²−λ)+y²/(b²−λ)=1 */
  function billiardLambda(a, b, px, py, dx, dy) {
    const L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, p = nx * px + ny * py;
    return a * a * nx * nx + b * b * ny * ny - p * p;
  }
  function causticKind(a, b, lam) {
    if (Math.abs(lam - b * b) < 1e-7 * a * a) return 'foci';
    return lam < b * b ? 'ellipse' : 'hyperbola';
  }
  /* advance a billiard by whole bounces; returns the boundary points and λ before/after each */
  function billiardBounces(a, b, px, py, dx, dy, count) {
    const pts = [], L0 = Math.hypot(dx, dy);
    let x = px, y = py, vx = dx / L0, vy = dy / L0;
    const lams = [billiardLambda(a, b, x, y, vx, vy)];
    for (let i = 0; i < count; i++) {
      const t = rayEllipse(a, b, x, y, vx, vy);
      if (t === null) break;
      x += t * vx; y += t * vy;
      const n = normalAt(a, b, x, y), r = reflect(vx, vy, n[0], n[1]);
      vx = r[0]; vy = r[1];
      pts.push([x, y]);
      lams.push(billiardLambda(a, b, x, y, vx, vy));
    }
    return { pts, lams, end: { x, y, vx, vy } };
  }

  /* ---------- Kepler & harmonic motion ---------- */
  function solveKepler(M, e) {
    const m = ((M % TAU) + TAU) % TAU;
    let E = e < 0.8 ? m : Math.PI, it = 0;
    for (; it < 60; it++) {
      const dE = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-13) { it++; break; } // Newton is quadratic: the step just taken has size ≪ 1e-13 error left
    }
    return { E, iterations: it, residual: Math.abs(E - e * Math.sin(E) - m) };
  }
  /* Sun at the focus (c,0); periapsis at (a,0); counter-clockwise; mean motion n */
  function keplerState(a, b, n, t) {
    const pr = props(a, b), e = pr.e, M = n * t, k = solveKepler(M, e), E = k.E;
    const Ed = n / (1 - e * Math.cos(E));
    const x = a * Math.cos(E), y = b * Math.sin(E);
    const vx = -a * Math.sin(E) * Ed, vy = b * Math.cos(E) * Ed;
    const rx = x - pr.c, r = Math.hypot(rx, y), GM = n * n * a * a * a;
    return { x, y, vx, vy, E, M, r, rx, ry: y, speed: Math.hypot(vx, vy), GM, c: pr.c, e,
      iterations: k.iterations, residual: k.residual, ax: (-GM * rx) / (r * r * r), ay: (-GM * y) / (r * r * r) };
  }
  function harmonicState(a, b, w, t) {
    const x = a * Math.cos(w * t), y = b * Math.sin(w * t);
    return { x, y, vx: -a * w * Math.sin(w * t), vy: b * w * Math.cos(w * t), ax: -w * w * x, ay: -w * w * y,
      speed: w * Math.hypot(a * Math.sin(w * t), b * Math.cos(w * t)) };
  }
  /* area swept from the focus between t0 and t1, computed from positions only: shoelace on sampled
     orbit points plus one Richardson step to cancel the O(h²) chord error */
  function sweptAreaNumeric(a, b, n, t0, t1, samples) {
    const c = props(a, b).c;
    const poly = (m) => {
      let area = 0, px = null, py = null;
      for (let i = 0; i <= m; i++) {
        const s = keplerState(a, b, n, t0 + ((t1 - t0) * i) / m);
        const x = s.x - c, y = s.y;
        if (px !== null) area += px * y - py * x;
        px = x; py = y;
      }
      return area / 2;
    };
    const m = samples || 400, A1 = poly(m), A2 = poly(2 * m);
    return (4 * A2 - A1) / 3;
  }
  function sweptAreaExact(a, b, n, t0, t1) { return (a * b * n * (t1 - t0)) / 2; } // (ab/2)·ΔM

  /* ---------- probability ---------- */
  function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* Box–Muller transform: two independent N(0,1) variables from two uniforms */
  function normalPair(rng) {
    let u = rng();
    while (u <= 1e-300) u = rng();
    const v = rng(), r = Math.sqrt(-2 * Math.log(u));
    return [r * Math.cos(TAU * v), r * Math.sin(TAU * v)];
  }
  /* n points of N(0, diag(sx², sy²)) as a flat Float64Array [x0,y0,x1,y1,…] */
  function sampleGaussian2D(n, seed, sx, sy) {
    const rng = mulberry32(seed), out = new Float64Array(2 * n);
    for (let i = 0; i < n; i++) {
      const z = normalPair(rng);
      out[2 * i] = sx * z[0];
      out[2 * i + 1] = sy * z[1];
    }
    return out;
  }
  function mahal2(x, y, sx, sy) { return (x / sx) * (x / sx) + (y / sy) * (y / sy); }
  const CHI2_95 = -2 * Math.log(0.05); // 5.991464547…, the 0.95 quantile of χ²₂
  function coverage2D(s) { return 1 - Math.exp(-s / 2); } // P(D² ≤ s) for D² ~ χ²₂
  function quantile2D(p) { return -2 * Math.log(1 - p); }
  function countInside(data, n, sx, sy, s) {
    let k = 0;
    for (let i = 0; i < n; i++) if (mahal2(data[2 * i], data[2 * i + 1], sx, sy) <= s) k++;
    return k;
  }

  /* ---------- numerical analysis ---------- */
  function adaptiveSimpson(f, lo, hi, tol) {
    let evals = 0, err = 0;
    const F = (x) => { evals++; return f(x); };
    const simp = (fa, fm, fb, a, b) => ((b - a) / 6) * (fa + 4 * fm + fb);
    function rec(a, b, fa, fm, fb, whole, tl, depth) {
      const m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2;
      const flm = F(lm), frm = F(rm);
      const left = simp(fa, flm, fm, a, m), right = simp(fm, frm, fb, m, b), delta = left + right - whole;
      if (depth <= 0 || Math.abs(delta) <= 15 * tl) { err += Math.abs(delta) / 15; return left + right + delta / 15; }
      return rec(a, m, fa, flm, fm, left, tl / 2, depth - 1) + rec(m, b, fm, frm, fb, right, tl / 2, depth - 1);
    }
    const PARTS = 8, tolerance = tol || 1e-12;
    let total = 0;
    for (let i = 0; i < PARTS; i++) { // start from 8 panels so a coincidental agreement of the coarse rule cannot stop early
      const a = lo + ((hi - lo) * i) / PARTS, b = lo + ((hi - lo) * (i + 1)) / PARTS, m = (a + b) / 2;
      const fa = F(a), fm = F(m), fb = F(b);
      total += rec(a, b, fa, fm, fb, simp(fa, fm, fb, a, b), tolerance / PARTS, 40);
    }
    return { value: total, evals, errorEstimate: err };
  }
  function compositeSimpson(f, lo, hi, n) { // n even
    const h = (hi - lo) / n;
    let s = f(lo) + f(hi);
    for (let i = 1; i < n; i++) s += f(lo + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
  }
  const arcSpeed = (a, b) => (t) => Math.sqrt(a * a * Math.sin(t) ** 2 + b * b * Math.cos(t) ** 2);
  function perimeterIntegral(a, b, tol) { // P = 4∫₀^{π/2} √(a²sin²t+b²cos²t) dt (four congruent quadrants)
    const r = adaptiveSimpson(arcSpeed(a, b), 0, Math.PI / 2, tol || 1e-13);
    return { value: 4 * r.value, evals: r.evals, errorEstimate: 4 * r.errorEstimate };
  }
  function perimeterSeries(a, b) { // Gauss–Kummer series in h = ((a−b)/(a+b))²
    const h = ((a - b) / (a + b)) ** 2;
    let coef = 1, sum = 1;
    for (let n = 0; n < 20000; n++) {
      coef *= (0.5 - n) / (n + 1);
      const term = coef * coef * Math.pow(h, n + 1);
      sum += term;
      if (term < 1e-18 * sum) break;
    }
    return Math.PI * (a + b) * sum;
  }
  function ellipticE(k) { // complete elliptic integral of the second kind, via the AGM
    let a0 = 1, b0 = Math.sqrt(1 - k * k), c0 = k, sum = (c0 * c0) / 2, pow = 1;
    for (let i = 0; i < 40 && Math.abs(c0) > 1e-17; i++) {
      const an = (a0 + b0) / 2, bn = Math.sqrt(a0 * b0);
      c0 = (a0 - b0) / 2; a0 = an; b0 = bn; pow *= 2;
      sum += (pow * c0 * c0) / 2;
    }
    return (Math.PI / (2 * a0)) * (1 - sum);
  }
  function perimeterAGM(a, b) { // 4·a·E(e) with a ≥ b
    const A = Math.max(a, b), B = Math.min(a, b);
    return 4 * A * ellipticE(Math.sqrt(1 - (B * B) / (A * A)));
  }
  function ramanujan1(a, b) { return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); }
  function ramanujan2(a, b) {
    const h = ((a - b) / (a + b)) ** 2;
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  }
  function normalCoverage1D(k) { // P(|Z| ≤ k), integrating the normal density with adaptive Simpson
    return adaptiveSimpson((z) => Math.exp((-z * z) / 2) / Math.sqrt(TAU), -k, k, 1e-14).value;
  }

  return { TAU, REF, props, focalDistances, point, paramFromPoint, samplePath, curvature,
    quadForm, eig2sym, quadValue, refScaled, rotationResidual,
    rayEllipse, normalAt, reflect, angleBetween, traceFromFocus, traceToBoundary, gradS,
    billiardLambda, causticKind, billiardBounces,
    solveKepler, keplerState, harmonicState, sweptAreaNumeric, sweptAreaExact,
    mulberry32, normalPair, sampleGaussian2D, mahal2, CHI2_95, coverage2D, quantile2D, countInside,
    adaptiveSimpson, compositeSimpson, arcSpeed, perimeterIntegral, perimeterSeries, ellipticE, perimeterAGM,
    ramanujan1, ramanujan2, normalCoverage1D };
});
