/* slides-b.js — slides 5–8 */
'use strict';
const lnk = (svg, v, x1, y1, x2, y2, col, w, dash) => S('line', { x1: v.X(x1), y1: v.Y(y1), x2: v.X(x2), y2: v.Y(y2), stroke: col, 'stroke-width': w || 2, 'stroke-linecap': 'round', 'stroke-dasharray': dash || '' }, svg);
const setL = (l, v, x1, y1, x2, y2) => { l.setAttribute('x1', v.X(x1)); l.setAttribute('y1', v.Y(y1)); l.setAttribute('x2', v.X(x2)); l.setAttribute('y2', v.Y(y2)); };

/* ============================ 05 ROTATION & LINEAR ALGEBRA ============================ */
(function () {
  const A = 5, B = 4;
  let st, el, v, n = {};
  function render() {
    const th = rad(st.deg), Q = E.quadForm(A, B, th), ev = E.eig2sym(Q), sc = E.refScaled(th);
    n.path.setAttribute('d', v.d(E.samplePath(A, B, 360, th), true));
    const m = ev.vectors[0], mn = ev.vectors[1], l1 = ev.values[0], l2 = ev.values[1];
    setL(n.v1, v, -5.6 * m[0], -5.6 * m[1], 5.6 * m[0], 5.6 * m[1]); setL(n.v2, v, -4.6 * mn[0], -4.6 * mn[1], 4.6 * mn[0], 4.6 * mn[1]);
    n.v1.style.display = n.v2.style.display = n.t1.style.display = n.t2.style.display = st.eig ? '' : 'none';
    place(n.t1, v.X(5.7 * m[0]), v.Y(5.7 * m[1])); place(n.t2, v.X(4.7 * mn[0]), v.Y(4.7 * mn[1]));
    const p = E.point(A, B, st.t, th); place(n.probe, v.X(p[0]), v.Y(p[1]));
    $(el, '#s5mat').classList.toggle('hidden', !st.mat); $(el, '#s5alg').classList.toggle('hidden', !st.alg);
    $(el, '#s5Q').innerHTML = `<div class="mat" role="img" aria-label="Matrix Q"><span>${fmt(Q.xx, 6)}</span><span>${fmt(Q.xy, 6)}</span><span>${fmt(Q.xy, 6)}</span><span>${fmt(Q.yy, 6)}</span></div>`;
    $(el, '#s5l').innerHTML = `λ₁ = ${fmt(l1, 8)} (= 1/25)<br>λ₂ = ${fmt(l2, 8)} (= 1/16)<br>semi-axes 1/√λ = ${fmt(1 / Math.sqrt(l1), 6)}, ${fmt(1 / Math.sqrt(l2), 6)}`;
    let rec = Math.atan2(m[1], m[0]); if (rec > Math.PI / 2 + 1e-9) rec -= Math.PI; if (rec <= -Math.PI / 2 + 1e-9) rec += Math.PI;
    $(el, '#s5rec').textContent = `${fmt(deg(rec), 3)}°`; $(el, '#s5th').textContent = `${fmt(st.deg, 1)}°`;
    const sg = (x) => (x < 0 ? '−' : '+') + ' ' + fmt(Math.abs(x), 4);
    $(el, '#s5eq1').innerHTML = `${fmt(Q.xx, 5)}<i>x</i>² ${sg(2 * Q.xy)}<i>xy</i> ${sg(Q.yy)}<i>y</i>² = 1`;
    $(el, '#s5eq2').innerHTML = `${fmt(sc.A, 4)}<i>x</i>² ${sg(sc.B)}<i>xy</i> ${sg(sc.C)}<i>y</i>² = 1600`;
    const at30 = Math.abs(st.deg - 30) < 1e-9;
    $(el, '#s5ok').innerHTML = at30 ? `<span class="badge c-phys">✓ 73x² − 18√3·xy + 91y² = 1600 &nbsp;(−18√3 = ${fmt(-18 * Math.sqrt(3), 4)})</span>` : '';
    st.cache = { Q, ev, sc, th };
  }
  defineSlide({
    short: 'Rotation & matrices', title: 'The ellipse hidden inside a matrix', desc: 'xᵀQx = 1, eigenvalues 1/25 and 1/16, rotation slider',
    thumb: thumb('<line x1="40" y1="46" x2="160" y2="14" stroke="#5EE0B2"/>'),
    layout: 'matrix',
    html: `<div class="body"><div class="viz"><svg id="s5svg" role="img" aria-label="Rotated ellipse with eigenvector axes"></svg></div><div class="side">
      <div class="eq big"><i>x</i>ᵀ<i>Q</i><i>x</i> = 1, &nbsp; <i>Q</i> = <i>R</i><sub>θ</sub> diag(${fr('1', '25')}, ${fr('1', '16')}) <i>R</i><sub>θ</sub>ᵀ</div>
      ${rng('s5r', 'θ', -90, 90, 0.5, 0, true)}
      <div class="btns">${btn('s5_30', 'θ = 30° (verify)', 'primary')}${btn('s5rs', 'Reset')}</div>
      <div class="togs res">${tgl('s5e', 'Eigenvectors', true)}${tgl('s5m', 'Matrix', true)}${tgl('s5a', 'Algebraic explanation', true)}</div>
      <div id="s5mat"><h2>Q · eigen-decomposition</h2><div id="s5Q"></div><p class="mono" id="s5l"></p>
        <dl class="rows res"><dt>θ</dt><dd id="s5th"></dd><dt>axis angle recovered from Q</dt><dd id="s5rec"></dd></dl></div>
      <h2>Equation of the rotated ellipse</h2><div class="eq s5eq" id="s5eq1"></div><div class="eq s5eq" id="s5eq2"></div><div id="s5ok"></div>
      <div id="s5alg" class="res"><p class="note"><b>Recovering the ellipse from Q:</b> eigenvectors of Q are the axis directions, semi-axes are 1/√λ. A pure rotation changes the <b>eigenvectors</b> (they rotate with the axes) but <b>not the eigenvalues</b> — 1/25 and 1/16 stay fixed because rotation preserves lengths.</p></div>
    </div></div>`,
    init(root) {
      el = root; st = { deg: 0, tdeg: 0, eig: true, mat: true, alg: true, t: 0.7 };
      const svg = $(el, '#s5svg'); v = new View(svg, 700, 600, 48); baseScene(svg, v, 7, 6, 1);
      n.path = bloomPath(svg, { fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 3.6 });
      n.v1 = S('line', { stroke: COL.phys, 'stroke-width': 2.4, 'stroke-dasharray': '8 5' }, svg); n.v2 = S('line', { stroke: COL.foc, 'stroke-width': 2.4, 'stroke-dasharray': '8 5' }, svg);
      n.t1 = T(svg, 0, 0, 'v₁ (λ=1/25)', { style: 'fill:#5EE0B2;font-size:15px' }); n.t2 = T(svg, 0, 0, 'v₂ (λ=1/16)', { style: 'fill:#FFD278;font-size:15px' });
      n.probe = S('circle', { r: 6, fill: '#F3F7FF' }, svg);
      this._r = bindRange(el, 's5r', (x) => { st.tdeg = x; }, (x) => x.toFixed(1) + '°');
      bindTgl(el, 's5e', (o) => { st.eig = o; render(); }); bindTgl(el, 's5m', (o) => { st.mat = o; render(); }); bindTgl(el, 's5a', (o) => { st.alg = o; render(); });
      $(el, '#s5_30').addEventListener('click', () => { this._r.set(30); st.tdeg = 30; });
      $(el, '#s5rs').addEventListener('click', () => this.reset()); render();
    },
    tick(dt) {
      if (st.deg !== st.tdeg) {                                  // θ glides to its target; every number below is computed from the drawn θ
        st.deg += (st.tdeg - st.deg) * (App.reduced ? 1 : 1 - Math.exp(-11 * dt));
        if (Math.abs(st.tdeg - st.deg) < 1e-4) st.deg = st.tdeg; render();
      }
      st.t += dt * 0.6; const th = rad(st.deg), p = E.point(A, B, st.t, th); place(n.probe, v.X(p[0]), v.Y(p[1]));
    },
    reset() { this._r.set(0); st.tdeg = 0; },
    audit() {
      const c = st.cache; let w = 0; for (let i = 0; i < 360; i++) { const q = E.point(A, B, (E.TAU * i) / 360, c.th); w = Math.max(w, Math.abs(c.sc.A * q[0] * q[0] + c.sc.B * q[0] * q[1] + c.sc.C * q[1] * q[1] - 1600)); }
      return [['max |pᵀQp − 1| (720 pts)', sci(E.rotationResidual(A, B, c.th, 720))], ['max |1600-form − 1600|', sci(w)], ['|λ₁−1/25|, |λ₂−1/16|', sci(Math.abs(c.ev.values[0] - 0.04)) + ', ' + sci(Math.abs(c.ev.values[1] - 0.0625))]];
    },
    notes: { say: 'Move the slider: the equation’s coefficients change, but the eigenvalues in the box never do. Press “θ = 30°”: 73x² − 18√3xy + 91y² = 1600 appears, and the white probe point still satisfies pᵀQp = 1.',
      points: ['Q = R diag(1/25, 1/16) Rᵀ — a similarity transform, so the spectrum is invariant.', 'Eigenvectors of the SMALLER eigenvalue 1/25 point along the major axis (semi-axis 1/√λ = 5).', 'Axis angle is only defined mod 180°.'],
      expected: 'θ=30°: coefficients 73, −31.1769, 91 and right-hand side 1600; audit residuals ~1e-15.', pitfalls: ['Do not say the eigenvalues rotate; the eigenVECTORS do.', 'Sign of xy term is negative for CCW rotation of this ellipse.'],
      q: 'Why does the xy-term appear at all?', a: 'In rotated coordinates the quadratic form is not diagonal; the off-diagonal entry (1/25 − 1/16)·sinθ·cosθ vanishes only when θ is a multiple of 90°.' },
  });
})();

/* ============================ 06 REFLECTION THEOREM ============================ */
(function () {
  const A = 5, B = 4, C = 3;
  let st, el, v, n = {}, dots = [];
  function buildFan() {
    let di = '', dr = ''; st.fan = [];
    for (let i = 0; i < st.N; i++) {
      const tr = E.traceFromFocus(A, B, (E.TAU * (i + 0.5)) / st.N); st.fan.push(tr);
      di += `M${v.X(-C)} ${v.Y(0)}L${v.X(tr.P[0])} ${v.Y(tr.P[1])}`; dr += `M${v.X(tr.P[0])} ${v.Y(tr.P[1])}L${v.X(tr.P[0] + tr.r[0] * tr.lenOut)} ${v.Y(tr.P[1] + tr.r[1] * tr.lenOut)}`;
    }
    n.fi.setAttribute('d', di); n.fr.setAttribute('d', dr);
    dots.forEach((d) => d.remove()); dots = st.fan.map(() => S('circle', { r: 3, fill: '#fff', opacity: 0.85 }, n.dg));
  }
  function render() {
    const tr = E.traceToBoundary(A, B, st.tp), P = tr.P;
    place(n.h, v.X(P[0]), v.Y(P[1]));
    setL(n.i1, v, -C, 0, P[0], P[1]); setL(n.r1, v, P[0], P[1], P[0] + tr.r[0] * tr.lenOut, P[1] + tr.r[1] * tr.lenOut); setL(n.i1g, v, -C, 0, P[0], P[1]); setL(n.r1g, v, P[0], P[1], P[0] + tr.r[0] * tr.lenOut, P[1] + tr.r[1] * tr.lenOut);
    const nl = 1.6, tg = [-tr.n[1], tr.n[0]];
    setL(n.nl, v, P[0] - tr.n[0] * nl, P[1] - tr.n[1] * nl, P[0] + tr.n[0] * 0.9, P[1] + tr.n[1] * 0.9);
    setL(n.tl, v, P[0] - tg[0] * 1.8, P[1] - tg[1] * 1.8, P[0] + tg[0] * 1.8, P[1] + tg[1] * 1.8);
    n.nl.style.display = n.tl.style.display = st.nt ? '' : 'none';
    const g = E.gradS(A, B, P[0], P[1]), s = 1.3;
    setL(n.u1, v, P[0], P[1], P[0] + g.u1[0] * s, P[1] + g.u1[1] * s); setL(n.u2, v, P[0], P[1], P[0] + g.u2[0] * s, P[1] + g.u2[1] * s); setL(n.ug, v, P[0], P[1], P[0] + g.g[0] * s, P[1] + g.g[1] * s);
    const pp = [-tr.d[1], tr.d[0]], rp = [-tr.r[1], tr.r[0]], at = (lab, x, y) => { lab.setAttribute('x', v.X(x).toFixed(1)); lab.setAttribute('y', v.Y(y).toFixed(1)); };
    at(n.lab[0], -C + tr.d[0] * tr.lenIn * 0.5 + pp[0] * 0.32, tr.d[1] * tr.lenIn * 0.5 + pp[1] * 0.32);
    // labels sit outside the wall; the text anchor follows the normal so a label never lands on its own point
    const out = (lab, dist) => { const nx = tr.n[0], ny = tr.n[1]; at(lab, P[0] + nx * dist, P[1] + ny * dist);
      lab.setAttribute('text-anchor', nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle'); lab.setAttribute('dy', ny > 0.35 ? '-.2em' : ny < -0.35 ? '.95em' : '.35em'); };
    out(n.lab[1], 0.5); out(n.lab[2], 1.5); n.lab[2].style.display = st.nt ? '' : 'none';
    at(n.lab[3], P[0] + tr.r[0] * tr.lenOut * 0.5 - rp[0] * 0.32, P[1] + tr.r[1] * tr.lenOut * 0.5 - rp[1] * 0.32);
    [n.u1, n.u2, n.ug].forEach((l) => (l.style.display = st.proof ? '' : 'none')); $(el, '#s6proof').classList.toggle('hidden', !st.proof);
    $(el, '#s6inc').textContent = fmt(deg(tr.inc), 6) + '°'; $(el, '#s6ref').textContent = fmt(deg(tr.refl), 6) + '°';
    $(el, '#s6miss').textContent = sci(deg(tr.miss)) + '°'; $(el, '#s6len').textContent = fmt(tr.lenIn + tr.lenOut, 9);
    $(el, '#s6gn').textContent = sci(deg(g.angleToNormal)) + '°';
    st.tr = tr; st.g = g;
  }
  defineSlide({
    short: 'Reflection theorem', title: 'Why does an ellipse focus light?', desc: 'Rays from F₁ reflect through F₂',
    thumb: thumb(dot(70) + dot(130) + '<path d="M70 30L150 20L130 30" stroke="#5EE0B2" fill="none"/>'),
    layout: 'optics',
    html: `<div class="body"><div class="viz"><svg id="s6svg" role="img" aria-label="Rays from one focus reflecting off the ellipse through the other focus"></svg></div><div class="side">
      <p class="lead s6lead">Drag the white point along the wall.</p>
      <dl class="rows"><dt>incidence angle θᵢ</dt><dd id="s6inc"></dd><dt>reflection angle θᵣ</dt><dd id="s6ref"></dd><dt>angle(reflected dir, dir to F₂)</dt><dd id="s6miss" class="c-phys"></dd><dt>path |F₁P| + |PF₂|</dt><dd id="s6len"></dd></dl>
      <div class="btns">${btn('s6pp', 'Pause')}${btn('s6rs', 'Reset')}</div>
      ${rng('s6n', 'rays', 3, 60, 1, 15, true)}
      <div class="togs">${tgl('s6nt', 'Tangent & normal', true)}${tgl('s6pf', 'Proof overlay (∇S)', false)}</div>
      <p class="note res">Everything here is computed for that ray: intersection from a quadratic, normal from ∇(x²/a²+y²/b²), reflection d − 2(d·n)n.</p>
      <div id="s6proof" class="callout res hidden"><div class="eq">∇<i>S</i>(<i>P</i>) = ${fr('<span class="k-d1">P − F₁</span>', '|P − F₁|')} + ${fr('<span class="k-d2">P − F₂</span>', '|P − F₂|')}</div>
        <p style="font-size:.95rem">S = d₁ + d₂ is constant on the ellipse ⇒ ∇S ⟂ the curve ⇒ ∇S ∥ n. The sum of the two unit vectors (mint) bisects the angle F₁PF₂, so the normal bisects it: θᵢ = θᵣ. Measured angle(∇S, n): <b class="mono" id="s6gn"></b></p></div>
    </div></div>`,
    init(root) {
      el = root; st = { N: 15, tp: 1.0, nt: true, proof: false, play: App.autoplay, s: 0 };
      const svg = $(el, '#s6svg'); v = new View(svg, 700, 560, 56); baseScene(svg, v, 6, 4.9, 1);
      bloomPath(svg, { d: v.d(E.samplePath(A, B, 360), true), fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 3.6 });
      n.fi = S('path', { fill: 'none', stroke: COL.foc, 'stroke-width': 1.1, opacity: 0.55 }, svg); n.fr = S('path', { fill: 'none', stroke: COL.phys, 'stroke-width': 1.1, opacity: 0.55 }, svg);
      n.dg = S('g', null, svg);
      n.tl = S('line', { stroke: COL.dim, 'stroke-width': 1.8 }, svg); n.nl = S('line', { stroke: COL.circle, 'stroke-width': 1.8, 'stroke-dasharray': '6 4' }, svg);
      n.i1g = S('line', { stroke: COL.foc, 'stroke-width': 9, 'stroke-opacity': 0.14, 'stroke-linecap': 'round' }, svg); n.r1g = S('line', { stroke: COL.phys, 'stroke-width': 9, 'stroke-opacity': 0.14, 'stroke-linecap': 'round' }, svg);
      n.i1 = S('line', { stroke: COL.foc, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, svg); n.r1 = S('line', { stroke: COL.phys, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, svg);
      n.u1 = S('line', { stroke: COL.foc, 'stroke-width': 3 }, svg); n.u2 = S('line', { stroke: COL.rose, 'stroke-width': 3 }, svg); n.ug = S('line', { stroke: COL.phys, 'stroke-width': 4.5 }, svg);
      [-C, C].forEach((x, i) => { S('circle', { cx: v.X(x), cy: v.Y(0), r: 7, fill: COL.foc }, svg); T(svg, v.X(x) - 8, v.Y(0) + 26, i ? 'F₂' : 'F₁', { style: 'fill:#FFD278' }); });
      n.pulse = S('circle', { r: 7, fill: '#fff', class: 'glow-b' }, svg);
      n.lab = [['incoming ray', COL.foc], ['reflection point P', '#fff'], ['normal', COL.circle], ['reflected ray', COL.phys]].map(([t, c]) => T(svg, 0, 0, t, { class: 'lab ray-lab', 'text-anchor': 'middle', style: 'fill:' + c }));
      n.h = handleDot(svg, COL.ink, 8);
      makeDrag(n.h, v, (x, y) => { st.tp = E.paramFromPoint(A, B, x, y); render(); });
      this._pp = () => { $(el, '#s6pp').textContent = st.play ? 'Pause' : 'Resume'; };
      bindRange(el, 's6n', (x) => { st.N = x; buildFan(); }); bindTgl(el, 's6nt', (o) => { st.nt = o; render(); }); bindTgl(el, 's6pf', (o) => { st.proof = o; render(); });
      $(el, '#s6pp').addEventListener('click', () => { st.play = !st.play; this._pp(); }); $(el, '#s6rs').addEventListener('click', () => this.reset());
      buildFan(); render(); this._pp();
    },
    tick(dt) {
      if (!st.play) return; st.s = (st.s + dt / 3.2) % 1;
      const d = st.s * 10, at = (tr) => (d < tr.lenIn ? [-C + tr.d[0] * d, tr.d[1] * d] : [tr.P[0] + tr.r[0] * (d - tr.lenIn), tr.P[1] + tr.r[1] * (d - tr.lenIn)]);
      st.fan.forEach((tr, i) => { const p = at(tr); dots[i].setAttribute('cx', v.X(p[0])); dots[i].setAttribute('cy', v.Y(p[1])); });
      const p = at(st.tr); place(n.pulse, v.X(p[0]), v.Y(p[1]));
    },
    toggle() { st.play = !st.play; this._pp(); },
    reset() { st.N = 15; st.tp = 1.0; st.nt = true; st.proof = false; st.s = 0; $(el, '#s6n').value = 15; $(el, '#s6n').dispatchEvent(new Event('input')); $(el, '#s6nt').checked = true; $(el, '#s6pf').checked = false; render(); },
    audit() { let w = 0; st.fan.forEach((t) => (w = Math.max(w, t.miss))); return [['this ray: angle(reflected, →F₂)', sci(deg(st.tr.miss)) + '°'], [`max over ${st.N} rays`, sci(deg(w)) + '°'], ['|θᵢ − θᵣ|', sci(deg(Math.abs(st.tr.inc - st.tr.refl))) + '°'], ['all paths = 10? max |len−10|', sci(Math.max(...st.fan.map((t) => Math.abs(t.lenIn + t.lenOut - 10))))]]; },
    notes: { say: 'Ask: if I put a light at one focus, where does it go? Drag the point and read the miss angle — about 1e-14 degrees. Then switch on the proof overlay: the two unit vectors add to a vector along the normal.',
      points: ['Reflection law is applied with the true normal n = ∇(x²/a²+y²/b²)/|·|; we never use “goes to F₂” in the computation.', 'Every path F₁→P→F₂ has length 10, so the pulses arrive at F₂ simultaneously.', 'Ideal mirror, point source, 2D — a physical idealisation.'],
      expected: 'Miss angle ≈ 0 (rounding only); θᵢ = θᵣ; all pulses reach F₂ together.', pitfalls: ['Angles are from the normal, not from the tangent.', 'Rays from F₂ also focus at F₁ (time reversal).'],
      q: 'Does a circle focus light the same way?', a: 'A circle is the case F₁ = F₂ = centre: rays from the centre return to the centre. Rays from other points do not converge to one point.' },
  });
})();

/* ============================ 07 ELLIPTIC BILLIARDS ============================ */
(function () {
  const A = 5, B = 4;
  const PRE = { gen: [1.0, 0.5, 0.55], ell: [-4.5, 0.3, 0.45], hyp: [0, 0.5, 1.2], foc: [-3, 0, 0.7], min: [0, 0, Math.PI / 2] };
  let st, el, v, n = {};
  const TAIL = 10;
  function aim() { const d = [Math.cos(st.ang), Math.sin(st.ang)]; st.d = d; const t = E.rayEllipse(A, B, st.x0, st.y0, d[0], d[1]); st.L = t; st.hit = [st.x0 + d[0] * t, st.y0 + d[1] * t]; }
  function restart() {
    st.hist = [[st.sx, st.sy]]; st.x0 = st.sx; st.y0 = st.sy; st.ang = st.sa; st.s = 0; st.bounces = 0; st.lam0 = E.billiardLambda(A, B, st.sx, st.sy, Math.cos(st.sa), Math.sin(st.sa)); st.drift = 0; st.lam = st.lam0;
    aim(); drawStatic(); draw();
  }
  function bounce() {
    const h = st.hit, nn = E.normalAt(A, B, h[0], h[1]), r = E.reflect(st.d[0], st.d[1], nn[0], nn[1]);
    st.x0 = h[0]; st.y0 = h[1]; st.ang = Math.atan2(r[1], r[0]); st.hist.push([h[0], h[1]]); if (st.hist.length > 600) st.hist.shift();
    st.bounces++; st.lam = E.billiardLambda(A, B, h[0], h[1], r[0], r[1]); st.drift = Math.max(st.drift, Math.abs(st.lam - st.lam0)); aim();
  }
  function drawStatic() {
    const kind = E.causticKind(A, B, st.lam0), p2 = A * A - st.lam0; let d = '';
    if (kind === 'ellipse') d = v.d(E.samplePath(Math.sqrt(p2), Math.sqrt(B * B - st.lam0), 200), true);
    else if (kind === 'hyperbola' && p2 > 1e-6) {
      const p = Math.sqrt(p2), q = Math.sqrt(st.lam0 - B * B);
      [1, -1].forEach((sg) => { let seg = []; for (let u = -3; u <= 3.001; u += 0.02) { const x = sg * p * Math.cosh(u), y = q * Math.sinh(u); if ((x / A) ** 2 + (y / B) ** 2 <= 1.0001) seg.push([x, y]); } if (seg.length > 1) d += v.d(seg); });
    } else if (kind === 'foci') d = `M${v.X(-3)} ${v.Y(0)}L${v.X(3)} ${v.Y(0)}`;
    n.cau.setAttribute('d', d); n.cauG.style.display = st.cau ? '' : 'none';
    $(el, '#s7kind').textContent = kind === 'hyperbola' && p2 <= 1e-6 ? 'degenerate: the minor axis (period 2)' : { ellipse: 'confocal ellipse', hyperbola: 'confocal hyperbola', foci: 'passes through the foci' }[kind];
    $(el, '#s7warn').classList.toggle('hidden', !st.warn);
  }
  function draw() {
    const pos = [st.x0 + st.d[0] * st.s, st.y0 + st.d[1] * st.s];
    const H = st.hist.concat([pos]), i2 = Math.max(0, H.length - 9), i1 = Math.max(0, H.length - 33);
    n.hA.setAttribute('d', v.d(H.slice(0, i1 + 1))); n.hB.setAttribute('d', v.d(H.slice(i1, i2 + 1))); n.hC.setAttribute('d', v.d(H.slice(i2)));
    n.hist.style.display = st.showH ? '' : 'none';
    const tail = comet(H, 2.4, TAIL); n.tail.forEach((t, k) => t.setAttribute('d', tail[k] ? v.d(tail[k]) : ''));
    place(n.ball, v.X(pos[0]), v.Y(pos[1]));
    n.pts.setAttribute('d', st.hist.slice(1).map((p) => `M${v.X(p[0])} ${v.Y(p[1])}h.01`).join('')); n.pts.style.display = st.showR ? '' : 'none';
    place(n.hs, v.X(st.sx), v.Y(st.sy)); place(n.hd, v.X(st.sx + 1.8 * Math.cos(st.sa)), v.Y(st.sy + 1.8 * Math.sin(st.sa)));
    setL(n.dl, v, st.sx, st.sy, st.sx + 1.8 * Math.cos(st.sa), st.sy + 1.8 * Math.sin(st.sa));
    $(el, '#s7b').textContent = st.bounces; $(el, '#s7l').textContent = fmt(st.lam0, 8); $(el, '#s7d').textContent = sci(st.drift);
  }
  function markPre() { $$(el, '#s7pre .btn').forEach((b) => b.setAttribute('aria-pressed', st.pre !== null && b.id === 's7_' + st.pre)); }
  function setPre(k) { const p = PRE[k]; st.pre = k; markPre(); st.sx = p[0]; st.sy = p[1]; st.sa = p[2]; st.warn = k === 'foc'; restart(); }
  /* the last stretch of the true path, measured along its length, cut into pieces that fade out = a comet tail */
  function comet(H, total, pieces) {
    const out = [], step = total / pieces; let acc = 0, cur = [H[H.length - 1]];
    for (let i = H.length - 1; i > 0 && out.length < pieces; i--) {
      const x1 = H[i][0], y1 = H[i][1], x0 = H[i - 1][0], y0 = H[i - 1][1], seg = Math.hypot(x1 - x0, y1 - y0); let done = 0;
      while (done < seg - 1e-12 && out.length < pieces) {
        const take = Math.min(step - acc, seg - done); done += take; acc += take;
        const f = done / seg; cur.push([x1 + (x0 - x1) * f, y1 + (y0 - y1) * f]);
        if (acc >= step - 1e-9) { out.push(cur); cur = [cur[cur.length - 1]]; acc = 0; }
      }
    }
    if (cur.length > 1 && out.length < pieces) out.push(cur);
    return out;
  }
  defineSlide({
    short: 'Elliptic billiards', title: 'Hidden order inside a bouncing ball', desc: 'Specular reflection, confocal caustics',
    thumb: thumb('<path d="M50 30L90 10L120 48L150 22" stroke="#5EE0B2" fill="none"/>'),
    layout: 'immersive',
    html: `<div class="body"><div class="viz"><svg id="s7svg" role="img" aria-label="Billiard trajectory inside an ellipse"></svg></div>
      <div class="hud glass" role="group" aria-label="Billiard metrics">
        <div class="hm"><span class="k">bounces</span><b id="s7b"></b></div>
        <div class="hm"><span class="k">invariant λ</span><b id="s7l"></b></div>
        <div class="hm"><span class="k">max drift of λ</span><b id="s7d" class="c-phys"></b></div>
        <div class="hm"><span class="k">caustic</span><b id="s7kind" class="hm-txt"></b></div>
      </div>
      <div class="drawer glass" role="group" aria-label="Billiard controls">
        <div class="btns">${btn('s7go', 'Start', 'primary')}${btn('s7ff', '+100 bounces')}${btn('s7rs', 'Reset')}</div>
        <div class="seg sm" id="s7pre" role="group" aria-label="Trajectory presets">${btn('s7_gen', 'Generic')}${btn('s7_ell', 'Ellipse caustic')}${btn('s7_hyp', 'Hyperbola caustic')}${btn('s7_min', 'Minor axis')}${btn('s7_foc', 'Through F₁')}</div>
        <p class="note" id="s7warn"><b>Numerical, not a theorem:</b> the orbit through a focus converges to the major axis, but that orbit is a saddle; after ~20 bounces rounding error is amplified ~4× per bounce and the path leaves it.</p>
        <details class="xd"><summary>Advanced</summary><div class="xd-body">
          ${rng('s7sp', 'speed', 1, 30, 0.5, 8, true)}
          <div class="togs">${tgl('s7h', 'History', true)}${tgl('s7r', 'Reflection points', true)}${tgl('s7c', 'Caustic', true)}</div>
          <p class="note">Drag the start point and the direction handle (white). λ = a²n<sub>x</sub>²+b²n<sub>y</sub>²−p² for the chord’s unit normal n and offset p: each chord is tangent to the conic x²/(a²−λ)+y²/(b²−λ)=1, and λ is conserved by every bounce.</p>
          <p class="note"><b>Theorem (Poncelet’s porism, with conditions):</b> if one billiard trajectory tangent to a given caustic closes after n bounces, then <i>every</i> trajectory tangent to that caustic closes after n bounces. A generic trajectory is <b>not</b> periodic; it only fills the region between the ellipse and its caustic. See Tabachnikov, <i>Geometry and Billiards</i> (AMS, 2005).</p>
        </div></details>
      </div></div>`,
    init(root) {
      el = root; st = { run: false, speed: 8, showH: true, showR: true, cau: true, warn: false, pre: null };
      const svg = $(el, '#s7svg'); v = new View(svg, 700, 560, 56); baseScene(svg, v, 6, 4.9, 1);
      bloomPath(svg, { d: v.d(E.samplePath(A, B, 360), true), fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 3.6 });
      n.cau = bloomPath(svg, { fill: 'none', stroke: COL.circle, 'stroke-width': 2.2, 'stroke-dasharray': '7 5' }); n.cauG = n.cau.parentNode;
      n.hist = S('g', { fill: 'none', stroke: COL.phys, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);   // history fades with age: old · mid · recent
      n.hA = S('path', { 'stroke-width': 1, opacity: 0.2 }, n.hist); n.hB = S('path', { 'stroke-width': 1.4, opacity: 0.45 }, n.hist); n.hC = S('path', { 'stroke-width': 1.8, opacity: 0.8 }, n.hist);
      n.pts = S('path', { fill: 'none', stroke: COL.foc, 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
      const tg = S('g', { fill: 'none', stroke: '#D9FFF0', 'stroke-linecap': 'round', class: 'glow-m' }, svg);
      n.tail = Array.from({ length: TAIL }, (_, k) => S('path', { 'stroke-width': 4.2 * (1 - k / (TAIL * 1.15)), opacity: Math.pow(1 - k / TAIL, 1.6).toFixed(3) }, tg));
      [-3, 3].forEach((x) => S('circle', { cx: v.X(x), cy: v.Y(0), r: 5, fill: COL.foc, class: 'glow-g' }, svg));
      n.dl = S('line', { stroke: COL.dim, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, svg);
      n.ball = S('circle', { r: 7.5, fill: '#E8FFF6', stroke: COL.phys, 'stroke-width': 2.5, class: 'glow-m' }, svg);
      n.hs = handleDot(svg, COL.ink, 7); n.hd = handleDot(svg, COL.foc, 6);
      makeDrag(n.hs, v, (x, y) => { const q = (x / A) ** 2 + (y / B) ** 2, k = q > 0.9 ? Math.sqrt(0.9 / q) : 1; st.sx = x * k; st.sy = y * k; st.warn = false; st.pre = null; markPre(); restart(); });
      makeDrag(n.hd, v, (x, y) => { st.sa = Math.atan2(y - st.sy, x - st.sx); st.warn = false; st.pre = null; markPre(); restart(); });
      this._b = () => { $(el, '#s7go').textContent = st.run ? 'Pause' : 'Start'; };
      $(el, '#s7go').addEventListener('click', () => this.toggle()); $(el, '#s7rs').addEventListener('click', () => this.reset());
      $(el, '#s7ff').addEventListener('click', () => { for (let i = 0; i < 100; i++) bounce(); draw(); });
      bindRange(el, 's7sp', (x) => (st.speed = x)); bindTgl(el, 's7h', (o) => { st.showH = o; draw(); }); bindTgl(el, 's7r', (o) => { st.showR = o; draw(); }); bindTgl(el, 's7c', (o) => { st.cau = o; n.cauG.style.display = o ? '' : 'none'; });
      Object.keys(PRE).forEach((k) => $(el, '#s7_' + k).addEventListener('click', () => setPre(k)));
      st.run = App.autoplay; setPre('gen'); this._b();
    },
    tick(dt) { if (!st.run) return; st.s += st.speed * dt; let g = 0; while (st.s >= st.L && g++ < 60) { st.s -= st.L; bounce(); } draw(); },
    toggle() { st.run = !st.run; this._b(); },
    reset() { st.run = false; this._b(); setPre('gen'); },
    audit() { const h = st.hist[st.hist.length - 1]; return [['max |λ − λ₀| over all bounces', sci(st.drift)], ['bounces', st.bounces], ['last hit: |x²/a²+y²/b² − 1|', st.bounces ? sci(Math.abs((h[0] / A) ** 2 + (h[1] / B) ** 2 - 1)) : '— (no bounce yet)']]; },
    notes: { say: 'Press Start. Straight lines, equal angles at the wall. Press +100 bounces: the dashed curve is not drawn by hand — it is computed from the first chord, and the trajectory stays tangent to it forever.',
      points: ['λ is conserved (drift ~1e-14) — that is the numerical evidence for the confocal caustic.', 'Chords crossing between the foci have a hyperbola caustic; others an ellipse caustic; through a focus the orbit hits both foci.', 'Poncelet closure is a theorem about special trajectories; we do not claim every orbit is periodic.'],
      expected: 'Generic: the path fills a ring bounded by the ellipse and its caustic. Minor axis: period-2 bouncing. Through F₁: converges to the major axis, then numerical instability.', pitfalls: ['“Looks periodic” ≠ periodic.', 'Do not call the saddle behaviour physics: it is floating-point amplification.'],
      q: 'How do you know the caustic is correct?', a: 'λ = a²nₓ²+b²nᵧ²−p² is computed from every post-bounce chord; the audit shows its drift is ~1e-14, i.e. every chord is tangent to the same confocal conic.' },
  });
})();

/* ============================ 08 TWO FORCE LAWS, ONE ELLIPSE ============================ */
(function () {
  const A = 5, B = 4, C = 3, PER = 10, W = E.TAU / PER, VS = 11, FS = 70;
  let st, el, vh, vk, n = {};
  const arcLen = (fn, t0, t1) => { let L = 0, p = fn(t0); for (let i = 1; i <= 60; i++) { const q = fn(t0 + ((t1 - t0) * i) / 60); L += Math.hypot(q.x - p.x, q.y - p.y); p = q; } return L; };
  function panel(svg, sun) {
    const vw = new View(svg, 560, 340, 40); baseScene(svg, vw, 6.9, 4.2, 1);
    bloomPath(svg, { d: vw.d(E.samplePath(A, B, 300), true), fill: ellFill(svg, sun ? '#5EE0B2' : '#48B8FF'), stroke: sun ? COL.phys : COL.ell, 'stroke-width': 3.2 });
    const o = { v: vw, win: S('path', { fill: 'none', stroke: sun ? '#D9FFF0' : '#DCF1FF', 'stroke-width': 6, opacity: 0.8, 'stroke-linecap': 'round', class: sun ? 'glow-m' : 'glow-b' }, svg), mk: S('g', null, svg) };
    if (sun) { const rg = S('radialGradient', { id: 'sunG', cx: 0.5, cy: 0.5, r: 0.5 }, vw.defs()); S('stop', { offset: 0, 'stop-color': '#FFD278', 'stop-opacity': 0.6 }, rg); S('stop', { offset: 1, 'stop-color': '#FFD278', 'stop-opacity': 0 }, rg);
      S('circle', { cx: vw.X(C), cy: vw.Y(0), r: 46, fill: 'url(#sunG)' }, svg); S('circle', { cx: vw.X(C), cy: vw.Y(0), r: 9, fill: COL.foc, class: 'glow-g' }, svg); T(svg, vw.X(C) - 16, vw.Y(0) + 26, 'Sun F₂', { style: 'fill:#FFD278;font-size:13px' }); } else { S('circle', { cx: vw.X(0), cy: vw.Y(0), r: 8, fill: COL.foc }, svg); T(svg, vw.X(0) + 10, vw.Y(0) + 24, 'centre', { style: 'fill:#FFD278;font-size:13px' }); }
    o.body = S('circle', { r: 8.5, fill: sun ? '#D9FFF0' : '#DCF1FF', stroke: sun ? COL.phys : COL.ell, 'stroke-width': 2.5, class: sun ? 'glow-m' : 'glow-b' }, svg); o.F = arrow(svg, COL.rose, 3); o.V = arrow(svg, COL.circle, 2.5);
    return o;
  }
  function frame() {
    const t = st.t, h = E.harmonicState(A, B, W, t), k = E.keplerState(A, B, W, t), dt = PER / 12;
    [[n.h, h, 0], [n.k, k, C]].forEach(([o, s, fx], i) => {
      const vw = o.v, X = vw.X(s.x), Y = vw.Y(s.y); place(o.body, X, Y);
      const fm = i ? Math.hypot(k.ax, k.ay) : Math.hypot(h.ax, h.ay), r = i ? k.r : Math.hypot(h.x, h.y);
      const len = i ? FS * (2 / r) ** 2 : (FS * r) / 5;
      const fu = i ? [-(s.x - C) / r, -s.y / r] : [-s.x / r, -s.y / r];
      o.F.set(X, Y, X + fu[0] * len, Y - fu[1] * len); o.F.style.display = st.F ? '' : 'none';
      o.V.set(X, Y, X + s.vx * VS, Y - s.vy * VS); o.V.style.display = st.V ? '' : 'none'; o.mk.style.display = st.M ? '' : 'none'; o.win.style.display = st.M ? '' : 'none';
      o.fm = fm; o.r = r;
    });
    const w0 = t - dt, pts = (fn) => { const a = []; for (let i = 0; i <= 40; i++) a.push(fn(w0 + (dt * i) / 40)); return a; };
    n.h.win.setAttribute('d', n.h.v.d(pts((u) => E.harmonicState(A, B, W, u)).map((p) => [p.x, p.y]))); n.k.win.setAttribute('d', n.k.v.d(pts((u) => E.keplerState(A, B, W, u)).map((p) => [p.x, p.y])));
    const lh = arcLen((u) => E.harmonicState(A, B, W, u), w0, t), lk = arcLen((u) => E.keplerState(A, B, W, u), w0, t);
    const ph = (((W * t) % E.TAU) + E.TAU) % E.TAU;
    $(el, '#s8hs').textContent = fmt(h.speed, 3); $(el, '#s8ks').textContent = fmt(k.speed, 3); $(el, '#s8hf').textContent = fmt(Math.hypot(h.ax, h.ay), 3); $(el, '#s8kf').textContent = fmt(Math.hypot(k.ax, k.ay), 3);
    $(el, '#s8hl').textContent = fmt(lh, 3); $(el, '#s8kl').textContent = fmt(lk, 3); $(el, '#s8E').textContent = `${fmt(ph, 3)} vs ${fmt(k.E, 3)}`;
    const cx = (t % PER) / PER * 900; n.cur.setAttribute('x1', cx); n.cur.setAttribute('x2', cx);
    st.cache = { h, k };
  }
  defineSlide({
    short: 'Two force laws', title: 'Same trajectory. Different physics.', desc: 'Harmonic oscillator vs Kepler orbit on one ellipse',
    thumb: thumb(dot(100, '#FFD278', 4) + dot(130, '#5EE0B2', 4)),
    layout: 'duo',
    html: `<div class="body"><div class="viz duo duo8">
        <div class="pane pane-h"><div class="pane-k"><b>Harmonic oscillator</b><span>F = −kr → centre</span></div><svg id="s8h" role="img" aria-label="Harmonic oscillator on the ellipse, force toward the centre"></svg></div>
        <div class="pane pane-kep"><div class="pane-k"><b>Kepler orbit</b><span>F = −GMm r/r³ → focus</span></div><svg id="s8k" role="img" aria-label="Kepler orbit on the same ellipse, force toward the focus"></svg></div>
        <div class="pane chart"><div class="pane-k"><b>Speed along the path</b><span>one period</span></div><svg id="s8c" viewBox="0 0 900 100" preserveAspectRatio="none" role="img" aria-label="Speed against time for both motions"></svg></div></div>
      <div class="side strip"><div class="sc-row">
        <div class="btns">${btn('s8p', 'Pause', 'primary')}${btn('s8rs', 'Reset')}</div>
        ${rng('s8sp', 'speed', 0.1, 3, 0.1, 1, true)}
        <div class="sc"><span class="k">speed · harm | Kepler</span><b><span id="s8hs" class="c-ell"></span> <i class="sep">|</i> <span id="s8ks" class="c-phys"></span></b></div>
        <div class="sc"><span class="k">|F|/m · harm | Kepler</span><b><span id="s8hf" class="c-ell"></span> <i class="sep">|</i> <span id="s8kf" class="c-phys"></span></b></div></div>
        <details class="xd"><summary>Details</summary><div class="xd-body">
          <div class="togs">${tgl('s8f', 'Force', true)}${tgl('s8v', 'Velocity', true)}${tgl('s8m', 'Equal-Δt markers & window', true)}</div>
          <dl class="rows"><dt>arc in last T/12 (harm | Kepler)</dt><dd><span id="s8hl"></span> | <span id="s8kl"></span></dd><dt>ωt vs Kepler E</dt><dd id="s8E"></dd></dl>
          <p class="note"><b>Why the paths coincide.</b> Both are r(t) = (5cos E(t), 4sin E(t)). Harmonic: E = ωt (uniform clock) with force toward the <b>centre</b>. Kepler: E − e·sinE = nt (Kepler’s equation) with force toward the <b>focus</b>. Same set of points, different clock and different force centre. Markers: equal time steps are equally spaced in the left parameter, but bunch up near apoapsis on the right.</p>
          <p class="note">Bertrand’s theorem: only F ∝ r and F ∝ 1/r² give closed orbits for all bound motions.</p></div></details></div></div>`,
    init(root) {
      el = root; st = { t: 0, play: App.autoplay, sp: 1, F: true, V: true, M: true };
      n.h = panel($(el, '#s8h'), false); n.k = panel($(el, '#s8k'), true);
      for (let i = 0; i < 12; i++) { const tt = (PER * i) / 12, a = E.harmonicState(A, B, W, tt), b = E.keplerState(A, B, W, tt); S('circle', { cx: n.h.v.X(a.x), cy: n.h.v.Y(a.y), r: 3.6, fill: COL.dim }, n.h.mk); S('circle', { cx: n.k.v.X(b.x), cy: n.k.v.Y(b.y), r: 3.6, fill: COL.dim }, n.k.mk); }
      const c = $(el, '#s8c'); let d1 = '', d2 = '';
      for (let i = 0; i <= 200; i++) { const tt = (PER * i) / 200, x = (i / 200) * 900; d1 += (i ? 'L' : 'M') + x + ' ' + (95 - E.harmonicState(A, B, W, tt).speed * 11); d2 += (i ? 'L' : 'M') + x + ' ' + (95 - E.keplerState(A, B, W, tt).speed * 11); }
      S('path', { d: d1, fill: 'none', stroke: COL.ell, 'stroke-width': 2.5, 'vector-effect': 'non-scaling-stroke' }, c); S('path', { d: d2, fill: 'none', stroke: COL.phys, 'stroke-width': 2.5, 'vector-effect': 'non-scaling-stroke' }, c);
      n.cur = S('line', { y1: 0, y2: 100, stroke: '#fff', opacity: 0.7, 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }, c);
      this._p = () => { $(el, '#s8p').textContent = st.play ? 'Pause' : 'Play'; };
      $(el, '#s8p').addEventListener('click', () => this.toggle()); $(el, '#s8rs').addEventListener('click', () => this.reset());
      bindRange(el, 's8sp', (x) => (st.sp = x), (x) => x.toFixed(1) + '×'); bindTgl(el, 's8f', (o) => { st.F = o; frame(); }); bindTgl(el, 's8v', (o) => { st.V = o; frame(); }); bindTgl(el, 's8m', (o) => { st.M = o; frame(); });
      this._p(); frame();
    },
    tick(dt) { if (!st.play) return; st.t += dt * st.sp; frame(); },
    toggle() { st.play = !st.play; this._p(); },
    reset() { st.t = 0; st.play = App.autoplay; this._p(); frame(); },
    audit() {
      const { h, k } = st.cache, e0 = -k.GM / (2 * A), hw = W * W;
      return [['Kepler |v²/2 − GM/r + GM/2a|', sci(Math.abs(k.speed ** 2 / 2 - k.GM / k.r - e0))], ['Kepler |E − e sinE − M| (Newton)', sci(k.residual) + ` (${k.iterations} it.)`],
        ['harmonic |energy − ½ω²(a²+b²)|', sci(Math.abs((h.vx ** 2 + h.vy ** 2) / 2 + (hw * (h.x ** 2 + h.y ** 2)) / 2 - (hw * (A * A + B * B)) / 2))], ['both on ellipse', sci(Math.max(Math.abs((h.x / A) ** 2 + (h.y / B) ** 2 - 1), Math.abs((k.x / A) ** 2 + (k.y / B) ** 2 - 1)))]];
    },
    notes: { say: 'Same blue path, two physics. Left: spring force to the centre. Right: gravity to the focus. Watch the speed chart — they differ. Turn on markers: equal time steps are not equal arcs on the right.',
      points: ['x = 5cos E, y = 4sin E for both; only E(t) differs.', 'Kepler speed obeys vis-viva v² = GM(2/r − 1/a); never constant angular speed about the centre.', 'Equal Δt: the highlighted window has different arc lengths in the two systems.'],
      expected: 'Harmonic speed is lowest at the major-axis vertices; Kepler is fastest at periapsis (5, 0), 4× faster than at apoapsis.', pitfalls: ['Same period was chosen only to compare; it is not required.', 'The force is toward the centre on the left and the focus (3,0) on the right.'],
      q: 'Can both be tuned to give the same time-parametrisation?', a: 'No: E(t)=ωt would require E − e sinE = nt, impossible for e ≠ 0. They agree only at t = 0 and T/2.' },
  });
})();
