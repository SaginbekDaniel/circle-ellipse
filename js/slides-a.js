/* slides-a.js — slides 1–4 */
'use strict';
const thumb = (extra) => `<svg viewBox="0 0 200 60" aria-hidden="true"><ellipse cx="100" cy="30" rx="62" ry="24" fill="none" stroke="#48B8FF" stroke-width="2"/>${extra || ''}</svg>`;
const dot = (x, c, r) => `<circle cx="${x}" cy="30" r="${r || 3}" fill="${c || '#FFD278'}"/>`;
const T = (parent, x, y, str, attrs) => { const t = S('text', Object.assign({ x, y }, attrs || {}), parent); t.textContent = str; return t; };
function baseScene(svg, view, xmax, ymax, step) {
  const gg = S('g', null, svg), ga = S('g', null, svg);
  view.grid(gg, xmax, ymax, step || 1); view.axes(ga, xmax, ymax);
  return { gg, ga };
}

/* =============================== 01 THE MYSTERY =============================== */
(function () {
  const A = 5, B = 4, C = 3, PERIOD = 9, N = E.TAU / PERIOD;
  let st, v, el, nodes = {}, pts;
  const MODES = [
    { name: '1 · Geometry', law: 'Two distances from two fixed points always add up to the same number.', eq: '<i>d</i><sub>1</sub> + <i>d</i><sub>2</sub> = 2<i>a</i> = 10' },
    { name: '2 · Physics', law: 'A planet pulled by an inverse-square force runs on the same curve — the Sun sits at a focus.', eq: '<i>F</i> = −<i>GMm</i> <b>r</b> / <i>r</i>³' },
    { name: '3 · Statistics', law: 'The one-σ contour of a Gaussian cloud with covariance Σ = diag(25, 16).', eq: '(<i>x</i>,<i>y</i>) Σ⁻¹ (<i>x</i>,<i>y</i>)ᵀ = 1' },
  ];
  const MORPH = 1.9; // seconds for the whole cloud to condense out of the contour
  function stepMorph() {
    const u0 = st.morph;
    st.cloud.forEach((p) => {
      const e = FX.easeOut((u0 - p.d) / 0.95), x = p.cx + (p.x - p.cx) * e, y = p.cy + (p.y - p.cy) * e;
      p.el.setAttribute('cx', v.X(x).toFixed(1)); p.el.setAttribute('cy', v.Y(y).toFixed(1)); p.el.style.opacity = (e * (p.ins ? 0.95 : 0.5)).toFixed(2);
    });
  }
  function setMode(m) {
    if (m === 2 && st.mode !== 2 && !App.reduced) { st.morph = 0; stepMorph(); }                 // Geometry → Probability: the points leave the contour
    if (m === 1 && st.mode !== 1 && !App.reduced) { nodes.orb.classList.remove('mk-in'); void nodes.orb.getBoundingClientRect(); nodes.orb.classList.add('mk-in'); } // Ellipse → Orbit: equal-time marks appear in order
    st.mode = m; st.modeT = 0;
    $$(el, '#s1modes .btn').forEach((b, i) => b.setAttribute('aria-pressed', i === m));
    $(el, '#s1law').textContent = MODES[m].law; $(el, '#s1eq').innerHTML = MODES[m].eq;
    applyOpacity();
  }
  function applyOpacity() {
    ['geo', 'orb', 'stat'].forEach((k, i) => { nodes[k].style.opacity = st.revealed ? (i === 2 ? 0.55 : 1) : i === st.mode ? 1 : 0; });
  }
  function update() {
    const phase = N * st.t, P = E.point(A, B, phase), f = E.focalDistances(A, B, P[0], P[1]);
    place(nodes.geoP, v.X(P[0]), v.Y(P[1]));
    const set = (l, x1, y1, x2, y2) => { l.setAttribute('x1', v.X(x1)); l.setAttribute('y1', v.Y(y1)); l.setAttribute('x2', v.X(x2)); l.setAttribute('y2', v.Y(y2)); };
    set(nodes.l1, -C, 0, P[0], P[1]); set(nodes.l2, C, 0, P[0], P[1]);
    nodes.sum.textContent = `d₁ + d₂ = ${fmt(f.sum, 6)}`;
    const k = E.keplerState(A, B, N, st.t);
    place(nodes.planet, v.X(k.x), v.Y(k.y)); set(nodes.ray, C, 0, k.x, k.y);
    st.last = { f, k };
  }
  defineSlide({
    short: 'The mystery',
    title: 'One curve. Different laws of the universe.',
    wide: true,
    desc: 'One ellipse as a construction, an orbit and a statistical contour',
    thumb: thumb(dot(70) + dot(130)),
    layout: 'hero',
    html: `<div class="body"><div class="viz"><svg id="s1svg" role="img" aria-label="The ellipse x squared over 25 plus y squared over 16 equals 1, drawn as a geometric construction, a planetary orbit and a Gaussian contour"></svg></div>
    <div class="side">
      <div class="seg" id="s1modes" role="group" aria-label="Interpretation of the ellipse"><button class="btn" data-m="0" aria-pressed="false">${MODES[0].name}</button><button class="btn" data-m="1" aria-pressed="false">${MODES[1].name}</button><button class="btn" data-m="2" aria-pressed="false">${MODES[2].name}</button></div>
      <p class="lead" id="s1law"></p><div class="eq" id="s1eq"></div>
      <div class="btns">${btn('s1reveal', 'Reveal the Question', 'primary')}${btn('s1play', 'Pause')}</div>
    </div>
    <div id="s1q" class="fade glass pad question" aria-live="polite">
      <p class="q-lead">“Can the same shape describe completely different mathematical systems?”</p>
      <dl class="rows"><dt class="c-foc">Geometry</dt><dd><i>d</i>₁ + <i>d</i>₂ = 10</dd><dt class="c-phys">Physics</dt><dd><i>r̈</i> = −<i>GM</i> <b>r</b>/<i>r</i>³</dd><dt class="c-ell">Statistics</dt><dd><i>P</i>(<i>D</i>² ≤ 1) = 1 − e<sup>−½</sup></dd></dl>
      <p class="note res">All three were switched on at once: one set of points, three different reasons for it to exist. Today we take that apart — and test it numerically.</p></div></div>`,
    init(root) {
      el = root;
      st = { t: 0, mode: 0, modeT: 0, playing: App.autoplay, revealed: false, morph: 9 };
      const svg = $(el, '#s1svg'); v = new View(svg, 900, 700, 52);
      baseScene(svg, v, 8.6, 6.6, 1);
      bloomPath(svg, { d: v.d(E.samplePath(A, B, 360), true), fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 3.4, 'stroke-linejoin': 'round' });
      const geo = (nodes.geo = S('g', null, svg)), orb = (nodes.orb = S('g', null, svg)), stat = (nodes.stat = S('g', null, svg));
      [geo, orb, stat].forEach((g) => (g.style.transition = 'opacity .9s ease'));
      // geometry: two strings
      nodes.l1 = S('line', { stroke: COL.foc, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, geo);
      nodes.l2 = S('line', { stroke: COL.rose, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, geo);
      [-C, C].forEach((x, i) => { S('circle', { cx: v.X(x), cy: v.Y(0), r: 6, fill: COL.foc }, geo); T(geo, v.X(x), v.Y(0) + 24, i ? 'F₂' : 'F₁', { 'text-anchor': 'middle', fill: COL.foc, style: 'fill:#FFD278' }); });
      nodes.geoP = S('circle', { r: 7, fill: COL.ink, stroke: '#050B14', 'stroke-width': 2 }, geo);
      nodes.sum = T(geo, v.X(0), v.Y(-2.1), '', { 'text-anchor': 'middle', style: 'font-size:22px;fill:#F3F7FF;font-family:ui-monospace,Menlo,monospace' });
      // physics: Sun at F2, planet from Kepler's equation, 12 equal-time markers
      nodes.ray = S('line', { stroke: COL.phys, 'stroke-width': 1.6, 'stroke-dasharray': '4 4' }, orb);
      for (let k = 0; k < 12; k++) { const s = E.keplerState(A, B, N, (PERIOD * k) / 12); S('circle', { cx: v.X(s.x), cy: v.Y(s.y), r: 4, fill: COL.phys, opacity: 0.7, class: 'mk', style: `--mi:${k}` }, orb); }
      S('circle', { cx: v.X(C), cy: v.Y(0), r: 30, fill: COL.foc, opacity: 0.08 }, orb); S('circle', { cx: v.X(C), cy: v.Y(0), r: 11, fill: COL.foc, class: 'glow-g' }, orb); S('circle', { cx: v.X(C), cy: v.Y(0), r: 19, fill: 'none', stroke: COL.foc, opacity: 0.4 }, orb);
      T(orb, v.X(C) + 18, v.Y(0) + 34, 'Sun at F₂', { style: 'fill:#FFD278;font-family:Inter,system-ui,sans-serif;font-size:13px' });
      nodes.planet = S('circle', { r: 8, fill: COL.phys, stroke: '#050B14', 'stroke-width': 2 }, orb);
      T(orb, v.X(-5.2), v.Y(5.2), 'dots: equal time steps — unequal spacing', { style: 'fill:#5EE0B2;font-family:Inter,system-ui,sans-serif;font-size:13px' });
      // statistics: seeded Gaussian cloud
      pts = E.sampleGaussian2D(500, 2026, 5, 4); st.cloud = [];
      for (let i = 0; i < 500; i++) {
        const x = pts[2 * i], y = pts[2 * i + 1];
        if (Math.abs(x) > 8.5 || Math.abs(y) > 6.6) continue;
        const ins = E.mahal2(x, y, 5, 4) <= 1, c = E.point(A, B, E.paramFromPoint(A, B, x, y)); // the contour point in the same direction (parameter angle)
        st.cloud.push({ el: S('circle', { cx: v.X(x), cy: v.Y(y), r: ins ? 3 : 2.5, fill: ins ? '#A9DCFF' : COL.ell, opacity: ins ? 0.95 : 0.5 }, stat), x, y, cx: c[0], cy: c[1], ins, d: (st.cloud.length / 500) * 0.9 });
      }
      T(stat, v.X(-8.2), v.Y(6.1), `${st.cloud.length} of 500 seeded samples in frame · bright = inside D² ≤ 1`, { style: 'font-family:Inter,system-ui,sans-serif;font-size:13px' });
      $$(el, '#s1modes .btn').forEach((b) => b.addEventListener('click', () => { st.playing = false; syncPlay(); setMode(+b.dataset.m); }));
      const syncPlay = () => { $(el, '#s1play').textContent = st.playing ? 'Pause' : 'Play'; };
      $(el, '#s1play').addEventListener('click', () => { st.playing = !st.playing; syncPlay(); });
      $(el, '#s1reveal').addEventListener('click', () => {
        st.revealed = !st.revealed; $(el, '#s1q').classList.toggle('on', st.revealed);
        $(el, '#s1reveal').textContent = st.revealed ? 'Hide the Question' : 'Reveal the Question'; applyOpacity();
      });
      this._sync = syncPlay;
      setMode(0); update();
    },
    enter() { this._sync(); update(); },
    tick(dt) {
      if (st.morph < MORPH) { st.morph = Math.min(MORPH, st.morph + dt); stepMorph(); }
      if (!st.playing) return;
      st.t += dt; st.modeT += dt;
      if (!st.revealed && st.modeT > 7) setMode((st.mode + 1) % 3);
      update();
    },
    toggle() { st.playing = !st.playing; this._sync(); },
    reset() { st.t = 0; st.revealed = false; $(el, '#s1q').classList.remove('on'); $(el, '#s1reveal').textContent = 'Reveal the Question'; st.playing = App.autoplay; this._sync(); st.morph = 9; stepMorph(); setMode(0); update(); },
    audit() {
      const l = st.last; let k = 0;
      for (let i = 0; i < 500; i++) if (E.mahal2(pts[2 * i], pts[2 * i + 1], 5, 4) <= 1) k++;
      return [['|d₁+d₂−10|', sci(Math.abs(l.f.sum - 10))], ['Kepler |E−e·sinE−M|', sci(l.k.residual)],
        ['seeded cloud inside D²≤1', `${k}/500 = ${fmt((100 * k) / 500, 1)}%  (theory ${fmt(100 * E.coverage2D(1), 2)}%)`]];
    },
    notes: {
      say: 'Start with the image, not the formula. Let the three modes cycle once. Ask the question, then press “Reveal the Question”: all three interpretations lie on the same curve at the same time.',
      points: ['Reference ellipse <span class="m">x²/25 + y²/16 = 1</span>: a = 5, b = 4, c = 3, e = 0.6, area 20π, perimeter ≈ 28.3617.', 'Geometry: <i>d</i>₁ + <i>d</i>₂ = 10. Physics: the Sun at the focus (3,0). Statistics: the contour of Σ = diag(25,16).', 'The dots on the orbit are equal time steps — they are NOT equally spaced. That is the seed of slides 8 and 9.'],
      expected: 'Panel switches every 7 s; after “Reveal” all three layers are visible together, the statistical layer slightly dimmed.',
      pitfalls: ['Do not say “the planet orbits the centre”. The Sun is at a focus, not at (0,0).', 'The cloud is only 500 points here — the 10 000-point experiment is on slide 10.'],
      q: 'Is it surprising that the same curve appears? Is it a coincidence?',
      a: 'Partly structural: ellipses are images of circles under linear maps (statistics, harmonic motion) and conics with a focal property (geometry, inverse-square gravity). Different structures can give the same level set; that is exactly why shape alone cannot identify the law (slide 12).',
    },
  });
})();

/* ===================== 02 ONE DISTANCE VS TWO DISTANCES ===================== */
(function () {
  const A = 5, B = 4, SPEED = 0.45;
  let st, el, vc, ve, n = {};
  function render() {
    const cx = st.pc[0], cy = st.pc[1], r = Math.hypot(cx, cy);
    place(n.hc, vc.X(cx), vc.Y(cy));
    n.lo.setAttribute('x2', vc.X(cx)); n.lo.setAttribute('y2', vc.Y(cy));
    const ex = st.pe[0], ey = st.pe[1], f = E.focalDistances(A, B, ex, ey);
    place(n.he, ve.X(ex), ve.Y(ey));
    n.l1.setAttribute('x2', ve.X(ex)); n.l1.setAttribute('y2', ve.Y(ey)); n.l2.setAttribute('x2', ve.X(ex)); n.l2.setAttribute('y2', ve.Y(ey));
    const res = Math.abs(f.sum - 10), onCurve = res < 1e-9;
    st.count++; if (onCurve) st.maxRes = Math.max(st.maxRes, res);
    $(el, '#s2r').textContent = fmt(r, 6); $(el, '#s2d1').textContent = fmt(f.d1, 6); $(el, '#s2d2').textContent = fmt(f.d2, 6);
    $(el, '#s2sum').textContent = fmt(f.sum, 9); $(el, '#s2res').textContent = sci(res);
    $(el, '#s2max').textContent = onCurve ? sci(st.maxRes) : '—'; $(el, '#s2cnt').textContent = st.count;
    const inv = $(el, '#s2inv'); inv.classList.toggle('bad', !onCurve);
    $(el, '#s2verdict').textContent = onCurve ? 'On the ellipse: the sum is constant' : (f.sum > 10 ? 'Outside the ellipse: sum > 10' : 'Inside the ellipse: sum < 10');
    $(el, '#s2b1').style.width = (100 * f.d1 / f.sum) + '%'; $(el, '#s2b2').style.width = (100 * f.d2 / f.sum) + '%';
    st.last = { f, r, res };
  }
  function lockToCurve() {
    st.tc = Math.atan2(st.pc[1], st.pc[0]); st.pc = [5 * Math.cos(st.tc), 5 * Math.sin(st.tc)];
    st.te = E.paramFromPoint(A, B, st.pe[0], st.pe[1]); st.pe = E.point(A, B, st.te);
  }
  defineSlide({
    short: 'One distance vs two',
    title: 'What really defines a circle and an ellipse?',
    desc: 'Drag a point: |PO| = 5 versus |PF₁| + |PF₂| = 10',
    thumb: thumb(dot(70) + dot(130) + '<line x1="70" y1="30" x2="138" y2="12" stroke="#FFD278"/><line x1="130" y1="30" x2="138" y2="12" stroke="#FF9EC4"/>'),
    layout: 'duo',
    html: `<div class="body"><div class="viz duo">
      <div class="pane"><svg id="s2c" role="img" aria-label="Circle of radius 5 with a draggable point"></svg></div>
      <div class="pane"><svg id="s2e" role="img" aria-label="Ellipse with foci and a draggable point"></svg></div></div>
    <div class="side strip"><div class="sc-row">
      <div class="sc"><span class="k c-circle">circle · r = |PO|</span><b id="s2r" class="c-circle"></b></div>
      <div class="sc"><span class="k k-d1">d₁ = |PF₁|</span><b id="s2d1" class="c-foc"></b></div>
      <div class="sc"><span class="k k-d2">d₂ = |PF₂|</span><b id="s2d2" class="c-rose"></b></div>
      <div class="inv sc-inv" id="s2inv"><div><span class="big" id="s2sum"></span><small>d₁ + d₂ &nbsp;·&nbsp; <span id="s2verdict"></span></small></div></div>
      <div class="togs">${tgl('s2lock', 'Keep points on the curves', true)}${tgl('s2play', 'Auto-move (Space)', true)}</div></div>
      <details class="xd"><summary>More measurements</summary><div class="xd-body">
        <div class="bar" aria-hidden="true"><div id="s2b1" style="background:var(--focus)"></div><div id="s2b2" style="background:var(--rose)"></div></div>
        <dl class="rows"><dt>residual |d₁+d₂−10|</dt><dd id="s2res"></dd><dt>worst residual on curve</dt><dd id="s2max"></dd><dt>evaluations</dt><dd id="s2cnt"></dd></dl>
        <p class="note">Switch off “keep on curves” and drag a point away: the constant sum is what <b>makes</b> the ellipse — leave the curve and the sum changes.</p></div></details>
    </div></div>`,
    init(root) {
      el = root;
      st = { tc: 0.9, te: 0.9, count: 0, maxRes: 0, playing: App.autoplay, lock: true };
      st.pc = [5 * Math.cos(st.tc), 5 * Math.sin(st.tc)]; st.pe = E.point(A, B, st.te);
      vc = new View($(el, '#s2c'), 360, 360, 30); ve = new View($(el, '#s2e'), 360, 360, 30);
      [[vc, '#s2c'], [ve, '#s2e']].forEach(([vw, id]) => baseScene($(el, id), vw, 6, 6, 1));
      const sc = $(el, '#s2c'), se = $(el, '#s2e');
      bloomPath(sc, { d: vc.d(E.samplePath(5, 5, 240), true), fill: ellFill(sc, COL.circle), stroke: COL.circle, 'stroke-width': 3.2 });
      bloomPath(se, { d: ve.d(E.samplePath(A, B, 240), true), fill: ellFill(se), stroke: COL.ell, 'stroke-width': 3.2 });
      S('circle', { cx: vc.X(0), cy: vc.Y(0), r: 5, fill: COL.ink }, sc); T(sc, vc.X(0) + 9, vc.Y(0) + 20, 'O');
      n.lo = S('line', { x1: vc.X(0), y1: vc.Y(0), stroke: COL.circle, 'stroke-width': 3, 'stroke-linecap': 'round', class: 'glow-c' }, sc);
      n.l1 = S('line', { x1: ve.X(-3), y1: ve.Y(0), stroke: COL.foc, 'stroke-width': 3, 'stroke-linecap': 'round', class: 'glow-g' }, se);
      n.l2 = S('line', { x1: ve.X(3), y1: ve.Y(0), stroke: COL.rose, 'stroke-width': 3, 'stroke-linecap': 'round' }, se);
      [-3, 3].forEach((x, i) => { S('circle', { cx: ve.X(x), cy: ve.Y(0), r: 6, fill: COL.foc, class: 'glow-g' }, se); T(se, ve.X(x) - 8, ve.Y(0) + 24, i ? 'F₂' : 'F₁', { style: 'fill:#FFD278' }); });
      T(sc, 12, 24, 'circle: |PO| = r', { class: 'lab' }); T(se, 12, 24, 'ellipse: |PF₁| + |PF₂| = 2a', { class: 'lab' });
      n.hc = handleDot(sc, COL.circle, 9); n.he = handleDot(se, COL.ell, 9);
      const clampV = (x, y) => [Math.max(-5.8, Math.min(5.8, x)), Math.max(-5.8, Math.min(5.8, y))];
      makeDrag(n.hc, vc, (x, y) => {
        st.playing = false; syncPlay();
        if (st.lock) { st.tc = Math.atan2(y, x); st.pc = [5 * Math.cos(st.tc), 5 * Math.sin(st.tc)]; } else st.pc = clampV(x, y);
        render();
      });
      makeDrag(n.he, ve, (x, y) => {
        st.playing = false; syncPlay();
        if (st.lock) { st.te = E.paramFromPoint(A, B, x, y); st.pe = E.point(A, B, st.te); } else st.pe = clampV(x, y);
        render();
      });
      const syncPlay = () => { $(el, '#s2play').checked = st.playing; };
      bindTgl(el, 's2lock', (on) => { st.lock = on; if (on) lockToCurve(); render(); });
      bindTgl(el, 's2play', (on) => { st.playing = on; });
      this._sync = syncPlay; syncPlay(); render();
    },
    enter() { this._sync(); },
    tick(dt) { if (!st.playing || !st.lock) return; st.tc += SPEED * dt; st.te += SPEED * dt; st.pc = [5 * Math.cos(st.tc), 5 * Math.sin(st.tc)]; st.pe = E.point(A, B, st.te); render(); },
    toggle() { st.playing = !st.playing; this._sync(); },
    reset() { st.tc = st.te = 0.9; st.lock = true; $(el, '#s2lock').checked = true; st.pc = [5 * Math.cos(0.9), 5 * Math.sin(0.9)]; st.pe = E.point(A, B, 0.9); st.count = 0; st.maxRes = 0; st.playing = App.autoplay; this._sync(); render(); },
    audit() {
      const { f, r } = st.last; let worst = 0;
      for (let i = 0; i < 720; i++) { const p = E.point(A, B, (E.TAU * i) / 720); worst = Math.max(worst, Math.abs(E.focalDistances(A, B, p[0], p[1]).sum - 10)); }
      return [['this point: d₁+d₂ − 10', sci(f.sum - 10)], ['circle point: r − 5', st.lock ? sci(r - 5) : 'free point (not on curve)'], ['720-point sweep, max |d₁+d₂−10|', sci(worst)]];
    },
    notes: {
      say: 'A circle is “all points at one distance from one point”. An ellipse changes one word: two points, and the SUM of distances. Drag the points; watch the sum stay 10. Then untick “keep on curves” and drag off the ellipse: the sum changes. The invariant is the definition.',
      points: ['d₁ + d₂ = 2a = 10 for every boundary point; circle r = 5 constant.', 'A circle is the special case where the two foci coincide (c = 0).', 'The readout is computed from coordinates each frame: d = √((x∓3)² + y²). Nothing is hard-coded.'],
      expected: 'Sum shows 10.000000000 with residual of order 1e-15 on the curve; inside the ellipse the sum is below 10 and the indicator turns red, outside it is above 10.',
      pitfalls: ['The constant is 2a, the major-axis length, not a.', 'On the circle, d₁ = d₂ only at the vertices of the minor axis for the ellipse; do not claim d₁ = d₂ in general.'],
      q: 'Why must 2a > 2c for the construction to work?',
      a: 'If 2a < 2c = |F₁F₂| no point can have distance sum smaller than the distance between the foci (triangle inequality): empty set. If 2a = 2c the set is the segment F₁F₂. Only 2a > 2c gives a genuine ellipse.',
    },
  });
})();

/* ============================ 03 DERIVE THE EQUATION ============================ */
(function () {
  const A = 5, B = 4, C = 3;
  const D1 = '<span class="k-d1">d₁</span>', D2 = '<span class="k-d2">d₂</span>', KA = '<i class="k-a">a</i>', KC = '<i class="k-c">c</i>', KB = '<i class="k-b">b</i>';
  const STEPS = [
    { h: 'Definition', m: `${D1} + ${D2} = 2${KA}`, t: `Foci F₁(−${KC},0), F₂(${KC},0); P = (x, y); ${D1} = |PF₁|, ${D2} = |PF₂|; ${KA} &gt; ${KC} &gt; 0.` },
    { h: 'Difference of squares of distances', m: `${D1}² − ${D2}² = (x+${KC})² − (x−${KC})² = 4${KC}x`, t: `Each ${D1}², ${D2}² is a sum of squares; the y² terms cancel.` },
    { h: 'Factor', m: `(${D1} − ${D2})(${D1} + ${D2}) = 4${KC}x &nbsp;⟹&nbsp; ${D1} − ${D2} = ${fr(`2${KC}x`, KA)}`, t: `Substitute ${D1} + ${D2} = 2${KA} and divide by 2${KA}.` },
    { h: 'Solve the linear system', m: `${D1} = ${KA} + ${fr(`${KC}x`, KA)}, &nbsp; ${D2} = ${KA} − ${fr(`${KC}x`, KA)}`, t: 'Add and subtract the two linear equations. These are the focal-radius formulas — check them with the live point →' },
    { h: 'Square it, two ways', m: `${D1}² = (${KA} + ${fr(`${KC}x`, KA)})² = ${KA}² + 2${KC}x + ${fr(`${KC}²x²`, `${KA}²`)}<br>${D1}² = (x+${KC})² + y² = x² + 2${KC}x + ${KC}² + y²`, t: 'Same quantity, once from the formula and once from Pythagoras.' },
    { h: 'Equate and cancel 2cx', m: `${KA}² + ${fr(`${KC}²x²`, `${KA}²`)} = x² + ${KC}² + y² &nbsp;⟹&nbsp; x²(1 − ${fr(`${KC}²`, `${KA}²`)}) + y² = ${KA}² − ${KC}²`, t: 'Collect the x² terms.' },
    { h: 'Divide by a² − c²', m: `${fr('x²', `${KA}²`)} + ${fr('y²', `${KA}² − ${KC}²`)} = 1`, t: `Since x²(${KA}²−${KC}²)/${KA}² divided by (${KA}²−${KC}²) is x²/${KA}².` },
    { h: 'Name the new constant', m: `${KB}² = ${KA}² − ${KC}² &nbsp;⟹&nbsp; ${fr('x²', `${KA}²`)} + ${fr('y²', `${KB}²`)} = 1`, t: `Here ${KA}=5, ${KC}=3 ⟹ ${KB}²=16, ${KB}=4. Geometrically ${KB} is the leg of a right triangle with hypotenuse ${KA} and other leg ${KC} (dashed).` },
  ];
  let st, el, v, n = {};
  function show() {
    $$(el, '.step').forEach((s, i) => { s.classList.toggle('shown', i <= st.i); s.classList.toggle('cur', i === st.i); s.classList.toggle('prev', i === st.i - 1); });
    $(el, '#s3steps').classList.toggle('all', st.all); $(el, '#s3all').textContent = st.all ? 'Focus' : 'Show all'; $(el, '#s3all').setAttribute('aria-pressed', st.all);
    $(el, '#s3count').textContent = `step ${st.i + 1} / ${STEPS.length}`;
    n.b.style.display = n.tri.style.display = n.bt.style.display = st.i >= 7 ? '' : 'none';
    n.chk.classList.toggle('hidden', st.i < 3);
    const cur = $(el, '.step.cur'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', behavior: App.reduced ? 'auto' : 'smooth' });
  }
  function render() {
    const P = st.P, f = E.focalDistances(A, B, P[0], P[1]);
    place(n.h, v.X(P[0]), v.Y(P[1]));
    n.l1.setAttribute('x2', v.X(P[0])); n.l1.setAttribute('y2', v.Y(P[1])); n.l2.setAttribute('x2', v.X(P[0])); n.l2.setAttribute('y2', v.Y(P[1]));
    const f1 = A + (C * P[0]) / A, eqv = (P[0] * P[0]) / (A * A) + (P[1] * P[1]) / (B * B);
    $(el, '#s3xy').textContent = `(${fmt(P[0], 3)}, ${fmt(P[1], 3)})`;
    $(el, '#s3d1').textContent = fmt(f.d1, 9); $(el, '#s3d1f').textContent = fmt(f1, 9); $(el, '#s3diff').textContent = sci(f.d1 - f1);
    $(el, '#s3eq').textContent = fmt(eqv, 12);
    st.last = { f, f1, eqv };
  }
  defineSlide({
    short: 'Derive the equation',
    title: 'Don’t memorise it. Derive it.',
    desc: 'From d₁ + d₂ = 2a to x²/a² + y²/b² = 1, step by step',
    thumb: thumb('<text x="62" y="36" fill="#91A6BE" font-size="14" font-family="serif">d₁+d₂=2a</text>'),
    layout: 'proof',
    html: `<div class="body"><div class="viz"><svg id="s3svg" role="img" aria-label="Ellipse with focal distances d1 and d2, semi-axes a, b and focal distance c"></svg></div>
      <div class="side"><div class="btns">${btn('s3prev', '↑ Back')}${btn('s3next', '↓ Next step', 'primary')}${btn('s3all', 'Show all')}<span class="mono dim s3count" id="s3count"></span></div>
      <div id="s3chk" class="callout hidden"><h2>Live check at the dragged point P</h2>
        <dl class="rows"><dt>P</dt><dd id="s3xy"></dd><dt><span class="k-d1">d₁</span> measured √((x+3)²+y²)</dt><dd id="s3d1"></dd><dt><span class="k-d1">d₁</span> from a + cx/a</dt><dd id="s3d1f"></dd><dt>difference</dt><dd id="s3diff"></dd><dt>x²/25 + y²/16</dt><dd id="s3eq"></dd></dl></div>
      <div id="s3steps">${STEPS.map((s, i) => `<div class="step"><div class="sh">${i + 1}. ${s.h}</div><div class="eq">${s.m}</div><div class="st">${s.t}</div></div>`).join('')}</div></div></div>`,
    init(root) {
      el = root; st = { i: 0, all: false, P: E.point(A, B, 0.85) };
      const svg = $(el, '#s3svg'); v = new View(svg, 560, 440, 46); baseScene(svg, v, 6, 4.7, 1);
      bloomPath(svg, { d: v.d(E.samplePath(A, B, 360), true), fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 3.2 });
      const seg = (x1, y1, x2, y2, col, w, dash) => S('line', { x1: v.X(x1), y1: v.Y(y1), x2: v.X(x2), y2: v.Y(y2), stroke: col, 'stroke-width': w || 3, 'stroke-linecap': 'round', 'stroke-dasharray': dash || '' }, svg);
      n.l1 = seg(-C, 0, 0, 0, COL.foc, 3); n.l2 = seg(C, 0, 0, 0, COL.rose, 3);
      seg(0, -0.001, A, -0.001, COL.circle, 4); seg(0, 0.08, C, 0.08, COL.phys, 4);
      T(svg, v.X(A / 2 + 1.1), v.Y(0) + 22, 'a', { style: 'fill:#6FE4F0;font-style:italic;font-size:20px' }); T(svg, v.X(C / 2) - 4, v.Y(0) - 12, 'c', { style: 'fill:#5EE0B2;font-style:italic;font-size:20px' });
      n.b = seg(0, 0, 0, B, COL.ell, 4); n.tri = seg(C, 0, 0, B, COL.circle, 2, '6 5');
      n.bt = T(svg, v.X(0) + 8, v.Y(B / 2), 'b', { style: 'fill:#48B8FF;font-style:italic;font-size:20px' });
      [-C, C].forEach((x, i) => { S('circle', { cx: v.X(x), cy: v.Y(0), r: 6, fill: COL.foc }, svg); T(svg, v.X(x) - 8, v.Y(0) + 26, i ? 'F₂' : 'F₁', { style: 'fill:#FFD278' }); });
      T(svg, 14, 28, 'drag P along the ellipse', { class: 'lab' });
      n.h = handleDot(svg, COL.ink, 8);
      makeDrag(n.h, v, (x, y) => { st.P = E.point(A, B, E.paramFromPoint(A, B, x, y)); render(); });
      n.chk = $(el, '#s3chk');
      const go = (d) => { if (d < 0) st.all = false; st.i = Math.max(0, Math.min(STEPS.length - 1, st.i + d)); show(); };
      $(el, '#s3prev').addEventListener('click', () => go(-1)); $(el, '#s3next').addEventListener('click', () => go(1));
      $(el, '#s3all').addEventListener('click', () => { st.all = !st.all; if (st.all) st.i = STEPS.length - 1; show(); });
      this._step = go; show(); render();
    },
    step(d) { this._step(d); },
    toggle() { this._step(1); },
    reset() { st.i = 0; st.all = false; st.P = E.point(A, B, 0.85); show(); render(); },
    audit() {
      const { f, f1, eqv } = st.last;
      return [['|d₁ − (a + cx/a)|', sci(Math.abs(f.d1 - f1))], ['|d₁² − d₂² − 4cx|', sci(Math.abs(f.d1 * f.d1 - f.d2 * f.d2 - 4 * C * st.P[0]))], ['|x²/25 + y²/16 − 1|', sci(Math.abs(eqv - 1))]];
    },
    notes: {
      say: 'Take one step at a time with ↓. Each step is something the audience can verify by hand. After step 4, drag P: the measured d₁ equals a + cx/a to rounding error — the algebra is describing the geometry.',
      points: ['The only geometric input is the definition d₁ + d₂ = 2a and Pythagoras.', 'Squaring is where an extraneous solution could sneak in; here it does not (see proof).', 'b² = a² − c² is not a definition, it is the right triangle with hypotenuse a: the dashed segment from (0,b) to the focus has length a.'],
      expected: 'Eight steps ending with x²/25 + y²/16 = 1; the live check shows difference ~1e-15.',
      pitfalls: ['Do not skip “divide by a² − c²”: it requires a² − c² ≠ 0, i.e. a > c.', 'Remember c² = a² − b² for the ellipse (minus), unlike the hyperbola (plus).'],
      q: 'You squared an equation. Did you prove the converse — that every point of x²/a²+y²/b²=1 satisfies d₁ + d₂ = 2a?',
      a: 'Yes: from the final equation y² = b²(1 − x²/a²), so d₁² = (x+c)² + y² = (a + cx/a)² (compute), and |x| ≤ a, c < a imply a + cx/a > 0, hence d₁ = a + cx/a; likewise d₂ = a − cx/a; the sum is 2a.',
      proof: '<p><b>Forward.</b> d₁² − d₂² = (x+c)² − (x−c)² = 4cx. With d₁ + d₂ = 2a get d₁ − d₂ = 2cx/a, so d₁ = a + cx/a. Equate d₁² = a² + 2cx + c²x²/a² with (x+c)² + y²: x²(1 − c²/a²) + y² = a² − c², i.e. x²/a² + y²/(a²−c²) = 1.</p><p><b>Converse.</b> Given x²/a² + y²/b² = 1 with b² = a² − c²: y² = b² − b²x²/a². Then (x+c)² + y² = x² + 2cx + c² + a² − c² − (a²−c²)x²/a² = a² + 2cx + c²x²/a² = (a + cx/a)². Since |x| ≤ a and 0 ≤ c < a, a + cx/a ≥ a − c|x|/a ≥ a − c > 0, so d₁ = a + cx/a, d₂ = a − cx/a, sum 2a. ∎</p>',
    },
  });
})();

/* ============================ 04 LIVE ELLIPSE LABORATORY ============================ */
(function () {
  const BMIN = 0.1;
  let st, el, v, n = {};
  function eqText(a, b) {
    const sq = (x) => fmt(x * x, 2);
    if (a - b < 0.005) return `<i>x</i>² + <i>y</i>² = ${fmt(a * a, 2)} &nbsp;<span class="badge c-circle">circle</span>`;
    return `${fr('<i>x</i>²', sq(a))} + ${fr('<i>y</i>²', sq(b))} = 1`;
  }
  const zoomFor = (a) => Math.min(1.9, 9.6 / Math.max(a, 1)); // auto-fit: the ellipse fills the stage, whatever a is (a = b = 9 still fits)
  function render() {
    n.zoom.setAttribute('transform', `translate(500 310) scale(${st.z.toFixed(4)}) translate(-500 -310)`);
    const { a, b } = st, p = E.props(a, b), circle = a - b < 0.005;
    n.path.setAttribute('d', v.d(E.samplePath(a, b, 360), true));
    n.aux.setAttribute('r', a * v.k); n.auxb.setAttribute('r', b * v.k);
    n.aux.style.display = n.auxb.style.display = st.ecc ? '' : 'none'; n.conn.style.display = st.ecc ? '' : 'none';
    n.conn.setAttribute('d', Array.from({ length: 14 }, (_, i) => { const t = (E.TAU * (i + 0.5)) / 14, c = Math.cos(t), s = Math.sin(t); return `M${v.X(a * c)} ${v.Y(a * s)}L${v.X(a * c)} ${v.Y(b * s)}`; }).join(''));
    n.gridG.style.display = st.grid ? '' : 'none'; n.axG.style.display = st.axes ? '' : 'none';
    [n.f1, n.f2].forEach((f) => (f.style.display = st.foci ? '' : 'none'));
    n.f1.setAttribute('transform', `translate(${v.X(-p.c)} ${v.Y(0)})`); n.f2.setAttribute('transform', `translate(${v.X(p.c)} ${v.Y(0)})`);
    n.maj.style.display = n.min.style.display = st.axes ? '' : 'none';
    n.maj.setAttribute('x1', v.X(-a)); n.maj.setAttribute('x2', v.X(a)); n.min.setAttribute('y1', v.Y(-b)); n.min.setAttribute('y2', v.Y(b));
    n.cseg.style.display = st.ecc ? '' : 'none'; n.cseg.setAttribute('x2', v.X(p.c));
    $(el, '#s4a').textContent = fmt(a, 2); $(el, '#s4b').textContent = fmt(b, 2);
    $(el, '#s4c').textContent = fmt(p.c, 4); $(el, '#s4e').textContent = fmt(p.e, 4); $(el, '#s4A').textContent = fmt(p.area, 4);
    $(el, '#s4P').textContent = fmt(E.perimeterAGM(a, b), 4);
    $(el, '#s4eq').innerHTML = eqText(a, b);
    $(el, '#s4emeter').style.width = (100 * p.e) + '%';
    $(el, '#s4state').innerHTML = circle ? '<span class="badge c-circle">e = 0 · circle · foci merge at the centre</span>' : p.e > 0.9 ? '<span class="badge c-foc">very eccentric</span>' : '<span class="badge c-ell">ellipse</span>';
    st.p = p;
  }
  defineSlide({
    short: 'Ellipse laboratory',
    title: 'What happens when we change the geometry?',
    desc: 'Sliders for a and b: c, e and area update live',
    thumb: thumb(dot(70) + dot(130) + '<circle cx="100" cy="30" r="24" fill="none" stroke="#6FE4F0" stroke-dasharray="3 3"/>'),
    layout: 'lab',
    html: `<div class="body"><div class="viz"><svg id="s4svg" role="img" aria-label="Adjustable ellipse"></svg></div>
    <div class="side">
      <div class="eq big" id="s4eq"></div><div id="s4state" class="s4state"></div>
      <dl class="rows"><dt class="hidden">a</dt><dd id="s4a" class="hidden"></dd><dt class="hidden">b</dt><dd id="s4b" class="hidden"></dd><dt>c = √(a² − b²)</dt><dd id="s4c" class="c-phys"></dd><dt>e = c / a</dt><dd id="s4e" class="c-foc"></dd><dt>area πab</dt><dd id="s4A"></dd><dt>perimeter 4aE(e)</dt><dd id="s4P"></dd></dl>
      <div class="bar" aria-label="eccentricity from 0 to 1"><div id="s4emeter" style="background:linear-gradient(90deg,var(--blue),var(--focus))"></div></div>
      <div class="mono dim ecc-scale"><span>e = 0 circle</span><span>e → 1 flat</span></div>
      <p class="note res"><b>Eccentricity view:</b> dashed circles have radii a and b. Each ellipse point is a circle point squeezed vertically by the factor b/a. e = 0 ⇔ a = b ⇔ circle.</p>
    </div>
    <div class="cdock glass" role="group" aria-label="Ellipse parameters">
      <div class="cd-sl">${rng('s4ra', 'a', 1, 9, 0.01, 5)}${rng('s4rb', 'b', BMIN, 9, 0.01, 4)}</div>
      <div class="togs">${tgl('s4foci', 'Foci', true)}${tgl('s4ecc', 'Eccentricity view', true)}<span class="res">${tgl('s4axes', 'Axes', true)}${tgl('s4grid', 'Grid', true)}</span></div>
      <div class="btns">${btn('s4reset', 'Reset a = 5, b = 4')}${btn('s4circ', 'Make it a circle')}</div>
    </div></div>`,
    init(root) {
      el = root; st = { a: 5, b: 4, ta: 5, tb: 4, z: zoomFor(5), foci: true, axes: true, grid: true, ecc: true };
      const svg = $(el, '#s4svg'); v = new View(svg, 1000, 620, 30); const zg = n.zoom = S('g', { class: 'zoomg' }, svg);
      n.gridG = S('g', null, zg); v.grid(n.gridG, 16.5, 9.9, 1);
      n.axG = S('g', null, zg); v.axes(n.axG, 16.5, 9.9);
      n.aux = S('circle', { cx: v.X(0), cy: v.Y(0), fill: 'none', stroke: COL.circle, 'stroke-width': 1.6, 'stroke-dasharray': '6 6', opacity: 0.8 }, zg);
      n.auxb = S('circle', { cx: v.X(0), cy: v.Y(0), fill: 'none', stroke: COL.circle, 'stroke-width': 1, 'stroke-dasharray': '2 6', opacity: 0.5 }, zg);
      n.conn = S('path', { stroke: COL.circle, 'stroke-width': 1, opacity: 0.55, fill: 'none' }, zg);
      n.path = bloomPath(zg, { fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 3.6, 'stroke-linejoin': 'round' });
      n.maj = S('line', { y1: v.Y(0), y2: v.Y(0), stroke: COL.ell, 'stroke-width': 1.5, opacity: 0.8 }, zg);
      n.min = S('line', { x1: v.X(0), x2: v.X(0), stroke: COL.ell, 'stroke-width': 1.5, opacity: 0.8 }, zg);
      n.cseg = S('line', { x1: v.X(0), y1: v.Y(0), y2: v.Y(0), stroke: COL.phys, 'stroke-width': 4, 'stroke-linecap': 'round' }, zg);
      [n.f1, n.f2] = ['F₁', 'F₂'].map((l) => { const g = S('g', null, zg); S('circle', { r: 6.5, fill: COL.foc }, g); T(g, -8, 24, l, { style: 'fill:#FFD278' }); return g; });
      /* sliders set TARGETS; tick() glides the drawn a, b toward them, so the curve morphs continuously (readouts always describe the drawn curve) */
      const ra = bindRange(el, 's4ra', (x) => { st.ta = x; if (st.tb > x) { st.tb = x; rb.set(x); } rb.el.max = x; rb.sync(); }, (x) => x.toFixed(2));
      const rb = bindRange(el, 's4rb', (x) => { st.tb = Math.min(x, st.ta); }, (x) => x.toFixed(2));
      rb.el.max = 5; rb.sync(); this._r = { ra, rb };
      bindTgl(el, 's4foci', (on) => { st.foci = on; render(); }); bindTgl(el, 's4axes', (on) => { st.axes = on; render(); });
      bindTgl(el, 's4grid', (on) => { st.grid = on; render(); }); bindTgl(el, 's4ecc', (on) => { st.ecc = on; render(); });
      $(el, '#s4reset').addEventListener('click', () => this.reset());
      $(el, '#s4circ').addEventListener('click', () => { st.tb = st.ta; rb.el.max = st.ta; rb.set(st.ta); });
      render();
    },
    tick(dt) {
      const zt = zoomFor(st.ta);
      if (st.a === st.ta && st.b === st.tb && Math.abs(st.z - zt) < 1e-4) return;
      const r = App.reduced ? 1 : 1 - Math.exp(-16 * dt), rz = App.reduced ? 1 : 1 - Math.exp(-7 * dt);   // frame-rate independent
      st.a += (st.ta - st.a) * r; st.b += (st.tb - st.b) * r; st.z += (zt - st.z) * rz;
      if (Math.abs(st.ta - st.a) < 1e-4) st.a = st.ta; if (Math.abs(st.tb - st.b) < 1e-4) st.b = st.tb; if (Math.abs(zt - st.z) < 1e-4) st.z = zt;
      render();
    },
    reset() {
      st.ta = 5; st.tb = 4; const { ra, rb } = this._r; ra.set(5); rb.el.max = 5; rb.set(4); rb.sync();
    },
    audit() {
      const { a, b } = st; let worst = 0;
      for (let i = 0; i < 360; i++) { const p = E.point(a, b, (E.TAU * i) / 360), f = E.focalDistances(a, b, p[0], p[1]); worst = Math.max(worst, Math.abs(f.sum - 2 * a)); }
      return [['max |d₁+d₂−2a| over 360 pts', sci(worst)], ['c² + b² − a²', sci(st.p.c * st.p.c + b * b - a * a)], ['perimeter: adaptive Simpson − 4aE(e)', sci(E.perimeterIntegral(a, b, 1e-12).value - E.perimeterAGM(a, b))]];
    },
    notes: {
      say: 'Drag b up to a: the foci slide towards the centre and the ellipse becomes a circle exactly when b = a (e = 0). Drag b down: eccentricity rises, the foci move to the vertices.',
      points: ['c = √(a² − b²), e = c/a, area = πab — all recomputed every input event.', 'b is constrained to 0.1 ≤ b ≤ a, so c is real and no division by zero occurs (b is never 0, a ≥ 1).', 'Eccentricity view: the ellipse is the circle of radius a scaled vertically by b/a — why the area is πab.'],
      expected: 'At a = 5, b = 4: c = 3, e = 0.6, area 62.8319 (= 20π), perimeter 28.3617. At b = a the equation becomes x² + y² = a² and the CIRCLE badge appears.',
      pitfalls: ['e is not a measure of “size”: a = b = 9 and a = b = 1 are both e = 0.', 'As e → 1 the ellipse degenerates to a segment, not to a parabola (a parabola needs a fixed focus-vertex distance while a → ∞).'],
      q: 'The perimeter changes smoothly with b but there is no elementary formula. Why can I still show 4 decimals?',
      a: 'Because the perimeter is a definite integral that we evaluate numerically (here via the arithmetic–geometric mean for 4aE(e)); “no elementary closed form” is a statement about formulas, not about computability — see slide 11.',
    },
  });
})();
