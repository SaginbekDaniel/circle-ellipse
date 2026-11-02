/* slides-c.js — slides 9–12 */
'use strict';

/* ============================ 09 KEPLER'S SECOND LAW ============================ */
(function () {
  const A = 5, B = 4, C = 3, PER = 10, W = E.TAU / PER;
  let st, el, v, n = {};
  const sector = (t0, t1, m) => { const pts = [[C, 0]]; for (let i = 0; i <= m; i++) { const s = E.keplerState(A, B, W, t0 + ((t1 - t0) * i) / m); pts.push([s.x, s.y]); } return pts; };
  function build() {
    n.sg.textContent = ''; st.areas = []; st.paths = [];
    for (let k = 0; k < st.N; k++) {
      const t0 = (PER * k) / st.N, t1 = (PER * (k + 1)) / st.N, p = S('path', { d: v.d(sector(t0, t1, 40), true), fill: k % 2 ? COL.circle : COL.ell, opacity: 0.34, stroke: 'rgba(5,11,20,.9)', 'stroke-width': 1 }, n.sg);
      st.paths.push(p); st.areas.push(E.sweptAreaNumeric(A, B, W, t0, t1));
      const mid = E.keplerState(A, B, W, (t0 + t1) / 2), lx = C + (mid.x - C) * 0.62, ly = mid.y * 0.62;
      const tx = T(n.sg, v.X(lx), v.Y(ly), fmt(st.areas[k], 3), { 'text-anchor': 'middle', style: 'font-size:11px;font-family:ui-monospace,Menlo,monospace;fill:#F3F7FF' }); tx.classList.add('alab');
    }
    const mn = Math.min(...st.areas), mx = Math.max(...st.areas);
    $(el, '#s9tab').innerHTML = `<tr><td>each of ${st.N} sectors (Δt = T/${st.N})</td><td>${fmt(mn, 6)} … ${fmt(mx, 6)}</td></tr><tr><td>spread max − min</td><td>${sci(mx - mn)}</td></tr><tr><td>(ab/2)·ΔM = πab/${st.N}</td><td>${fmt((A * B * Math.PI) / st.N, 6)}</td></tr><tr><td>sum of sectors vs 20π</td><td>${sci(st.areas.reduce((a, b) => a + b, 0) - 20 * Math.PI)}</td></tr>`;
    $$(n.sg, '.alab').forEach((x) => (x.style.display = st.lab ? '' : 'none'));
    update();
  }
  function update() {
    const t = st.t, s = E.keplerState(A, B, W, t), dt = PER / st.N, k = Math.min(st.N - 1, Math.floor(t / dt + 1e-12)), t0 = k * dt;
    st.paths.forEach((p, i) => (p.style.display = i < k ? '' : 'none'));
    $$(n.sg, '.alab').forEach((x, i) => (x.style.display = st.lab && i < k ? '' : 'none')); // a label appears only once its wedge is complete
    n.cur.setAttribute('d', v.d(sector(t0, Math.max(t, t0 + 1e-9), 30), true));
    place(n.body, v.X(s.x), v.Y(s.y));
    n.vel.set(v.X(s.x), v.Y(s.y), v.X(s.x) + s.vx * 11, v.Y(s.y) - s.vy * 11); n.vel.style.display = st.vel ? '' : 'none';
    n.rl.setAttribute('x2', v.X(s.x)); n.rl.setAttribute('y2', v.Y(s.y));
    const live = t > t0 + 1e-6 ? E.sweptAreaNumeric(A, B, W, t0, t, 80) : 0;
    $(el, '#s9r').textContent = fmt(s.r, 4); $(el, '#s9spd').textContent = fmt(s.speed, 4); $(el, '#s9live').textContent = `${fmt(live, 4)} of ${fmt(st.areas[k], 4)}`; $(el, '#s9k').textContent = `${k + 1} / ${st.N}`;
    st.s = s;
  }
  defineSlide({
    short: 'Kepler’s second law', title: 'The geometry of time', desc: 'Equal areas in equal times, measured numerically',
    thumb: thumb(dot(130, '#FFD278', 5) + '<path d="M130 30L162 22L158 34Z" fill="#48B8FF" opacity=".5"/>'),
    layout: 'immersive',
    html: `<div class="body"><div class="viz"><svg id="s9svg" role="img" aria-label="Orbit with equal-time sectors of equal area"></svg></div>
      <div class="hud glass" role="group" aria-label="Orbit measurements">
        <div class="hm"><span class="k">radius r</span><b id="s9r"></b></div>
        <div class="hm"><span class="k">speed</span><b id="s9spd" class="c-phys"></b></div>
        <div class="hm"><span class="k">sector</span><b id="s9k"></b></div>
        <div class="hm"><span class="k">area so far in this Δt</span><b id="s9live" class="hm-txt"></b></div>
      </div>
      <div class="drawer glass" role="group" aria-label="Orbit controls">
        <div class="btns">${btn('s9p', 'Pause', 'primary')}${btn('s9st', 'Step +Δt')}${btn('s9rs', 'Reset')}</div>
        <div class="ctl wide"><label for="s9N">interval</label><select id="s9N" class="field"><option value="6">T/6</option><option value="8">T/8</option><option value="12" selected>T/12</option><option value="16">T/16</option><option value="24">T/24</option></select><span></span></div>
        <details class="xd"><summary>Measured sector areas</summary><div class="xd-body">
          <table class="t"><tbody id="s9tab"></tbody></table>
          <dl class="rows"><dt>r<sub>min</sub> = a(1−e)</dt><dd>${fmt(A * (1 - 0.6), 3)}</dd><dt>r<sub>max</sub> = a(1+e)</dt><dd>${fmt(A * 1.6, 3)}</dd><dt>v<sub>p</sub> / v<sub>a</sub> = (1+e)/(1−e)</dt><dd>4</dd></dl>
          <div class="togs">${tgl('s9v', 'Velocity', true)}${tgl('s9l', 'Swept-area measurements', true)}</div>
          <p class="note">Each area is computed from the orbit’s positions (polygon rule + Richardson step), not read from a formula, and compared with (ab/2)ΔM. Near the Sun r is small, so to sweep the same area the planet must move faster: ½r²·dθ/dt = const.</p></div></details>
      </div></div>`,
    init(root) {
      el = root; st = { t: 0, play: App.autoplay, N: 12, vel: true, lab: true };
      const svg = $(el, '#s9svg'); v = new View(svg, 700, 560, 56); baseScene(svg, v, 6, 4.9, 1);
      n.sg = S('g', null, svg); n.cur = S('path', { fill: COL.foc, opacity: 0.6 }, svg);
      S('path', { d: v.d(E.samplePath(A, B, 360), true), fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 1, opacity: 0.5 }, svg);
      /* the orbit drawn as 180 short arcs, each styled by the TRUE speed there (equal time steps): bright and thick near the Sun, dim and thin far away */
      { const M = 180, lo = [34, 110, 176], hi = [214, 240, 255], sp = []; for (let i = 0; i <= M; i++) sp.push(E.keplerState(A, B, W, (PER * i) / M).speed);
        const smin = Math.min(...sp), smax = Math.max(...sp), g = S('g', { fill: 'none', 'stroke-linecap': 'round' }, svg);
        for (let i = 0; i < M; i++) { const u = ((sp[i] + sp[i + 1]) / 2 - smin) / (smax - smin), c = lo.map((x, k) => Math.round(x + (hi[k] - x) * u)), q0 = E.keplerState(A, B, W, (PER * i) / M), q1 = E.keplerState(A, B, W, (PER * (i + 1)) / M);
          S('path', { d: v.d([[q0.x, q0.y], [q1.x, q1.y]]), stroke: `rgb(${c})`, 'stroke-width': (2 + 3.6 * u).toFixed(2) }, g); } }
      n.rl = S('line', { x1: v.X(C), y1: v.Y(0), stroke: COL.foc, 'stroke-width': 1.8, opacity: 0.85 }, svg);
      const sg = S('radialGradient', { id: 'sunG9', cx: 0.5, cy: 0.5, r: 0.5 }, v.defs()); S('stop', { offset: 0, 'stop-color': '#FFD278', 'stop-opacity': 0.6 }, sg); S('stop', { offset: 1, 'stop-color': '#FFD278', 'stop-opacity': 0 }, sg);
      S('circle', { cx: v.X(C), cy: v.Y(0), r: 52, fill: 'url(#sunG9)' }, svg); S('circle', { cx: v.X(C), cy: v.Y(0), r: 10, fill: COL.foc, class: 'glow-g' }, svg); T(svg, v.X(C) - 6, v.Y(0) + 30, 'Sun', { style: 'fill:#FFD278' });
      n.vel = arrow(svg, COL.circle, 3); n.body = S('circle', { r: 8.5, fill: '#D9FFF0', stroke: COL.phys, 'stroke-width': 2.5, class: 'glow-m' }, svg);
      this._p = () => { $(el, '#s9p').textContent = st.play ? 'Pause' : 'Play'; };
      $(el, '#s9p').addEventListener('click', () => this.toggle()); $(el, '#s9rs').addEventListener('click', () => this.reset());
      $(el, '#s9st').addEventListener('click', () => { st.play = false; this._p(); const dt = PER / st.N; st.t = ((Math.floor(st.t / dt + 1e-9) + 1) * dt) % PER; update(); });
      $(el, '#s9N').addEventListener('change', (e) => { st.N = +e.target.value; st.t = 0; build(); });
      bindTgl(el, 's9v', (o) => { st.vel = o; update(); }); bindTgl(el, 's9l', (o) => { st.lab = o; update(); });
      build(); this._p();
    },
    tick(dt) { if (!st.play) return; st.t = (st.t + dt) % PER; update(); },
    toggle() { st.play = !st.play; this._p(); },
    reset() { st.t = 0; st.play = App.autoplay; this._p(); update(); },
    audit() { const a = st.areas; return [['max−min of sector areas', sci(Math.max(...a) - Math.min(...a))], ['sector 0: numeric − (ab/2)ΔM', sci(a[0] - E.sweptAreaExact(A, B, W, 0, PER / st.N))], ['Kepler residual here', sci(st.s.residual)], ['angular momentum x·vy − y·vx about Sun', fmt((st.s.x - C) * st.s.vy - st.s.y * st.s.vx, 9) + ' (const = nab)']]; },
    notes: { say: 'Same physics as slide 8, now with time sliced into equal pieces. Each coloured wedge takes the same time; the table shows the measured area of every wedge — equal to six digits and better.',
      points: ['Areas come from positions only, then cross-checked against (ab/2)ΔM from Kepler’s equation.', 'Periapsis r = 2, apoapsis r = 8: speed ratio 4.', 'Equal areas ⇔ angular momentum conservation (any central force, not only 1/r²).'],
      expected: 'All wedge areas ≈ 5.2360 for T/12 (= 20π/12) with spread ~1e-9 or smaller.', pitfalls: ['Wedges are slim near the far side of the orbit because the planet moves slowly there but r is large.', 'The law holds for any central force.'],
      q: 'Does equal-area-in-equal-time prove the force is 1/r²?', a: 'No. It holds for any central force (angular momentum conservation). The 1/r² law is what makes the orbit a conic with the Sun at a focus (first law).' },
  });
})();

/* ============================ 10 THE GAUSSIAN ELLIPSE ============================ */
(function () {
  const N = 10000, SX = 5, SY = 4, XR = 14, YR = 11, RATE = 6000; // RATE = samples per second: the experiment takes ≈1.7 s at ANY display refresh rate
  let st, el, cv, cx, cv2, c2, data;
  const sc = () => Math.min(st.w / (2 * XR), st.h / (2 * YR)); // one scale for x and y: the 25:16 ellipse must not be distorted
  const px = (x) => st.w / 2 + x * sc(), py = (y) => st.h / 2 - y * sc();
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); st.w = Math.max(10, r.width); st.h = Math.max(10, r.height);
    [[cv, cx], [cv2, c2]].forEach(([c, g]) => { c.width = st.w * dpr; c.height = st.h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }); redraw();
  }
  function frameDraw() {
    cx.globalCompositeOperation = 'source-over'; cx.clearRect(0, 0, st.w, st.h); cx.strokeStyle = 'rgba(169,220,255,.09)'; cx.lineWidth = 1; cx.beginPath();
    for (let x = -12; x <= 12; x += 2) { cx.moveTo(px(x), 0); cx.lineTo(px(x), st.h); } for (let y = -10; y <= 10; y += 2) { cx.moveTo(0, py(y)); cx.lineTo(st.w, py(y)); } cx.stroke();
    cx.strokeStyle = 'rgba(169,220,255,.3)'; cx.beginPath(); cx.moveTo(px(-XR), py(0)); cx.lineTo(px(XR), py(0)); cx.moveTo(px(0), py(-YR)); cx.lineTo(px(0), py(YR)); cx.stroke();
  }
  function pts(from, to) { // additive light: where samples pile up, the cloud glows — density is visible, not just plotted
    const s = st.s95 ? E.CHI2_95 : 1; cx.globalCompositeOperation = 'lighter';
    for (let i = from; i < to; i++) { const x = data[2 * i], y = data[2 * i + 1], ins = E.mahal2(x, y, SX, SY) <= s; cx.fillStyle = ins ? 'rgba(150,210,255,.42)' : 'rgba(40,120,235,.30)'; cx.fillRect(px(x) - 1.4, py(y) - 1.4, 2.8, 2.8); }
    cx.globalCompositeOperation = 'source-over';
  }
  function ring(s, col, w, dash, fillA, label) { // covariance contour: a glowing level set of the Mahalanobis distance; k = √s stretches both semi-axes
    const k = Math.sqrt(s); c2.beginPath();
    for (let i = 0; i <= 200; i++) { const q = E.point(SX * k, SY * k, (E.TAU * i) / 200); i ? c2.lineTo(px(q[0]), py(q[1])) : c2.moveTo(px(q[0]), py(q[1])); }
    c2.closePath(); if (fillA > 0.002) { c2.fillStyle = `rgba(111,228,240,${fillA.toFixed(3)})`; c2.fill(); }
    c2.strokeStyle = col; c2.lineWidth = w; c2.setLineDash(dash); c2.shadowColor = col; c2.shadowBlur = 6 + w * 3; c2.stroke(); c2.shadowBlur = 0; c2.setLineDash([]);
    const q = E.point(SX * k, SY * k, 0.62); c2.fillStyle = col; c2.font = '600 ' + Math.max(11, st.w / 95).toFixed(0) + 'px ui-monospace,Menlo,Consolas,monospace'; c2.fillText(label, px(q[0]) + 10, py(q[1]) - 8);
  }
  function contours() { // st.k95 glides 0→1 when the 95 % region is switched on: the active contour thickens and its interior lights up
    c2.clearRect(0, 0, st.w, st.h); const k = st.k95;
    ring(E.CHI2_95, '#6FE4F0', 1.4 + 2 * k, k > 0.5 ? [] : [6, 5], 0.075 * k, 'D² ≤ 5.99 · 95 %');
    ring(1, '#A9DCFF', 1.4 + 2 * (1 - k), 1 - k > 0.5 ? [] : [6, 5], 0, 'D² ≤ 1 · 39.35 %');
  }
  function redraw() { if (!cx) return; frameDraw(); if (data) pts(0, st.shown); contours(); }
  function stats() {
    const k = st.shown, c1 = E.countInside(data || [], k, SX, SY, 1), c95 = E.countInside(data || [], k, SX, SY, E.CHI2_95); let m = 0;
    for (let i = 0; i < k; i++) if (Math.abs(data[2 * i]) <= SX) m++;
    st.c = { k, c1, c95, m };
    const row = (lab, th, c) => `<tr><td>${lab}</td><td>${fmt(100 * th, 2)}%</td><td>${k ? fmt((100 * c) / k, 2) + '%' : '—'}</td><td>${k ? (c / k - th >= 0 ? '+' : '') + fmt((100 * (c / k - th)), 2) + ' pp' : '—'}</td></tr>`;
    $(el, '#s10t').innerHTML = row('ellipse D² ≤ 1', E.coverage2D(1), c1) + row('ellipse D² ≤ 5.99146', 0.95, c95) + row('strip |X| ≤ 5 (1-D, “68 %”)', E.normalCoverage1D(1), m);
    $(el, '#s10n').textContent = `${k.toLocaleString()} / ${N.toLocaleString()}`;
    const th = st.s95 ? 0.95 : E.coverage2D(1), emp = k ? (st.s95 ? c95 : c1) / k : 0;
    $(el, '#s10bt').style.width = (100 * th) + '%'; $(el, '#s10be').style.width = (100 * emp) + '%';
    $(el, '#s10lab').textContent = `theory ${fmt(100 * th, 2)}% · empirical ${k ? fmt(100 * emp, 2) : '—'}%`;
  }
  function run() {
    data = E.sampleGaussian2D(N, st.seed, SX, SY); st.shown = 0; st.acc = 0; st.run = true; frameDraw(); contours(); stats();
    if (App.reduced) { st.shown = N; st.run = false; redraw(); stats(); } // no progressive animation when motion is reduced
  }
  defineSlide({
    short: 'The Gaussian ellipse', title: 'What does an ellipse have to do with machine learning?', wide: true, desc: 'Seeded 10 000-sample experiment, 39.35 % and 95 %',
    thumb: thumb('<g fill="#5EE0B2">' + [60, 80, 100, 120, 140].map((x, i) => `<circle cx="${x}" cy="${24 + (i * 7) % 14}" r="2"/>`).join('') + '</g>'),
    layout: 'stage',
    html: `<div class="body"><div class="viz"><canvas id="s10cv" role="img" aria-label="Scatter of Gaussian samples with the one-sigma and 95 percent ellipses"></canvas><canvas id="s10cv2" aria-hidden="true"></canvas></div><div class="side">
      <div class="eq">μ = (0,0), &nbsp;Σ = diag(25, 16), &nbsp;${fr('x²', '25')} + ${fr('y²', '16')} = <i>D</i>²</div>
      <div class="btns">${btn('s10run', 'RUN 10,000 SAMPLES', 'primary')}${btn('s10new', 'New seed')}</div>
      <div class="ctl wide res"><label for="s10seed">seed</label><input id="s10seed" class="field" type="number" value="42" min="0" step="1"><span></span></div>
      <div class="togs">${tgl('s10m', 'Show 95 % region (D² ≤ 5.99146)', false)}</div>
      <dl class="rows"><dt>samples drawn</dt><dd id="s10n"></dd><dt class="res">95 % semi-axes ×√5.99146</dt><dd class="res">${fmt(5 * Math.sqrt(E.CHI2_95), 3)}, ${fmt(4 * Math.sqrt(E.CHI2_95), 3)}</dd></dl>
      <div class="bar bar-dual"><div id="s10bt" style="background:var(--focus);opacity:.5;position:absolute;left:0;top:0;height:100%"></div><div id="s10be" style="background:var(--phys);position:absolute;left:0;top:50%;height:50%"></div></div><div class="mono dim s10lab" id="s10lab"></div>
      <table class="t s10tab"><thead><tr><th>region</th><th>theory</th><th>empirical</th><th>Δ</th></tr></thead><tbody id="s10t"></tbody></table>
      <p class="note res"><b>Why not 68 %?</b> 68 % is the 1-D rule for |X| ≤ σ. In 2-D, D² = Z₁² + Z₂² ~ χ²₂ with CDF 1 − e<sup>−s/2</sup>, so P(D² ≤ 1) = 1 − e<sup>−1/2</sup> = 39.35 %. For 95 % you need D² ≤ −2 ln 0.05 = 5.99146, i.e. stretch every semi-axis by √5.99146 ≈ 2.448.</p></div></div>`,
    init(root) {
      el = root; cv = $(el, '#s10cv'); cv2 = $(el, '#s10cv2'); cx = cv.getContext('2d'); c2 = cv2.getContext('2d'); st = { seed: 42, shown: 0, acc: 0, run: false, s95: false, k95: 0, k95t: 0, w: 10, h: 10, auto: false };
      const ro = new ResizeObserver(size); ro.observe(cv.parentElement);
      $(el, '#s10run').addEventListener('click', () => { st.seed = Math.max(0, Math.floor(+$(el, '#s10seed').value || 0)); run(); });
      $(el, '#s10new').addEventListener('click', () => { $(el, '#s10seed').value = (+$(el, '#s10seed').value || 0) + 1; $(el, '#s10run').click(); });
      bindTgl(el, 's10m', (o) => { st.s95 = o; st.k95t = o ? 1 : 0; if (App.reduced) st.k95 = st.k95t; redraw(); stats(); }); size(); stats();
    },
    enter() { if (!st.auto) { st.auto = true; $(el, '#s10run').click(); } }, // the experiment starts by itself the first time the scene is shown; RUN repeats it
    tick(dt) {
      if (Math.abs(st.k95 - st.k95t) > 1e-3) { st.k95 += (st.k95t - st.k95) * (1 - Math.exp(-9 * dt)); if (Math.abs(st.k95 - st.k95t) < 1e-3) st.k95 = st.k95t; contours(); }
      if (!st.run) return;
      st.acc += RATE * dt; const to = Math.min(N, Math.floor(st.acc));
      if (to > st.shown) { pts(st.shown, to); st.shown = to; stats(); }
      if (st.shown >= N) st.run = false;
    },
    toggle() { $(el, '#s10run').click(); },
    reset() { st.run = false; st.shown = 0; data = null; $(el, '#s10seed').value = 42; redraw(); stats(); },
    audit() { const c = st.c, th = st.s95 ? 0.95 : E.coverage2D(1), emp = c.k ? (st.s95 ? c.c95 : c.c1) / c.k : NaN; return [['n generated', c.k], ['empirical − theoretical coverage', c.k ? ((emp - th) * 100).toFixed(3) + ' pp' : '—'], ['binomial standard error √(p(1−p)/n)', c.k ? (100 * Math.sqrt(th * (1 - th) / c.k)).toFixed(3) + ' pp' : '—'], ['PRNG', 'mulberry32 seed ' + st.seed + ' + Box–Muller']]; },
    notes: { say: 'Run the experiment. Every dot is computed by Box–Muller from a seeded generator, then counted. 39 percent, not 68 percent — because in 2-D the one-sigma ellipse is a different object than the one-sigma interval. Switch on the 95 percent region.',
      points: ['The same seed always gives the same points (deterministic), a new seed gives a new sample.', 'Observed ≈ 39.35 % ± 0.49 pp (standard error at n = 10 000).', 'The ellipse is a level set of the Mahalanobis distance; its shape is Σ, its probability is χ²₂.'],
      expected: 'Seed 42: inside D²≤1 about 39 % and inside D²≤5.99146 about 95 %; the table’s Δ stays within about ±1 pp.', pitfalls: ['Empirical ≠ theoretical exactly: sampling noise ~0.5 pp.', 'The “68 %” row is the 1-D strip, not the ellipse.'],
      q: 'Why Box–Muller and not summing uniforms?', a: 'Box–Muller transforms two independent uniforms exactly to two independent standard normals; summing uniforms only approximates a normal (central limit theorem) and has light tails.' },
  });
})();

/* ============================ 11 THE PERIMETER CHALLENGE ============================ */
(function () {
  let st, el, v, n = {};
  function calc() {
    const { a, b } = st, ref = E.perimeterIntegral(a, b, 1e-13), agm = E.perimeterAGM(a, b), ser = E.perimeterSeries(a, b), r1 = E.ramanujan1(a, b), r2 = E.ramanujan2(a, b), P = ref.value;
    const row = (lab, val, ref0) => `<tr><td>${lab}</td><td>${fmt(val, 9)}</td>${st.err ? `<td>${ref0 ? sci(Math.abs(val - P)) : '—'}</td><td>${ref0 ? sci(Math.abs(val - P) / P) : '—'}</td>` : ''}</tr>`;
    $(el, '#s11t').innerHTML = `<tr><th>method</th><th>P</th>${st.err ? '<th>abs err</th><th>rel err</th>' : ''}</tr>` +
      row('Adaptive Simpson (reference)', P, false) + row('4aE(e) via AGM', agm, true) + row('Gauss–Kummer series', ser, true) + row('Ramanujan I', r1, true) + row('Ramanujan II', r2, true);
    $(el, '#s11info').textContent = `adaptive Simpson: ${ref.evals} integrand evaluations, internal error estimate ${sci(ref.errorEstimate)}`;
    $(el, '#s11eq').innerHTML = `<i>a</i> = ${fmt(a, 2)}, <i>b</i> = ${fmt(b, 2)}, <i>e</i> = ${fmt(E.props(a, b).e, 4)}`;
    st.res = { P, agm, ser, r1, r2, ref };
    morph();
  }
  function morph() {
    const s = st.s, ma = 1 + s * (st.a - 1), mb = 1 + s * (st.b - 1), k = 28 / Math.max(1, st.a / 5 * 1.0);
    v.k = Math.min(250 / Math.max(st.a, 1), 50); n.path.setAttribute('d', v.d(E.samplePath(ma, mb, 240), true));
    n.circ.setAttribute('r', v.k); $(el, '#s11det').textContent = `det diag(${fmt(ma, 2)}, ${fmt(mb, 2)}) = ${fmt(ma * mb, 3)} ⇒ area π·det = ${fmt(Math.PI * ma * mb, 4)}`;
    n.circ.setAttribute('r', v.k);
  }
  defineSlide({
    short: 'The perimeter challenge', title: 'Why can we calculate the area easily, but not the perimeter?', wide: true, desc: 'Adaptive Simpson, 4aE(e), Ramanujan approximations',
    thumb: thumb('<text x="48" y="36" fill="#91A6BE" font-size="13" font-family="serif">P = 4aE(e)</text>'),
    layout: 'editorial',
    html: `<div class="body"><div class="ed-col">
      <div class="ed-eq"><span class="k">area · elementary</span><div class="eq big">A = det diag(<i>a</i>,<i>b</i>)·π = π<i>ab</i></div></div>
      <div class="ed-eq ed-hard"><span class="k">perimeter · an elliptic integral</span><div class="eq big">P = ∫<sub>0</sub><sup>2π</sup> √(<i>a</i>²sin²<i>t</i> + <i>b</i>²cos²<i>t</i>) d<i>t</i> = 4<i>aE</i>(<i>e</i>)</div></div>
      <div class="side"><div class="mono dim" id="s11eq"></div><div class="mono dim res" id="s11det"></div>
        <table class="t" id="s11t"></table><div class="mono dim res" id="s11info"></div>
        <p class="note res">A linear map scales area by |det|: easy. Arc length integrates a square root that does not simplify; the result is a complete elliptic integral of the second kind, which is not an elementary function. An approximation can be astonishingly good (Ramanujan II is within ~2e-13 here) and still be an approximation, not an exact elementary formula.</p></div></div>
      <div class="ed-viz"><div class="viz"><svg id="s11svg" role="img" aria-label="Unit circle stretched into an ellipse"></svg></div>
        <div class="cdock glass" role="group" aria-label="Stretch parameters"><div class="cd-sl">${rng('s11a', 'a', 1, 10, 0.05, 5, true)}${rng('s11b', 'b', 0.5, 10, 0.05, 4, true)}${rng('s11s', 'circle → ellipse', 0, 1, 0.01, 1, true)}</div>
          <div class="btns">${btn('s11calc', 'Recalculate', 'primary')}${btn('s11x', 'Extreme (10, 0.5)', 'sm')}${btn('s11rs', 'Reset')}</div><div class="togs">${tgl('s11e', 'Show approximation error', true)}</div></div></div></div>`,
    init(root) {
      el = root; st = { a: 5, b: 4, s: 1, err: true, play: App.autoplay, dir: 1 };
      const svg = $(el, '#s11svg'); v = new View(svg, 760, 520, 40); baseScene(svg, v, 9.2, 6.2, 1);
      n.circ = S('circle', { cx: v.X(0), cy: v.Y(0), fill: 'none', stroke: COL.circle, 'stroke-width': 1.8, 'stroke-dasharray': '6 5' }, svg);
      n.path = bloomPath(svg, { fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 3.6 });
      const ra = bindRange(el, 's11a', (x) => { st.a = x; if (st.b > x) { st.b = x; rb.set(x); } calc(); }, (x) => x.toFixed(2));
      const rb = bindRange(el, 's11b', (x) => { st.b = Math.min(x, st.a); calc(); }, (x) => x.toFixed(2)), rs = bindRange(el, 's11s', (x) => { st.s = x; st.play = false; morph(); }, (x) => x.toFixed(2));
      this._r = { ra, rb, rs };
      $(el, '#s11calc').addEventListener('click', calc); $(el, '#s11rs').addEventListener('click', () => this.reset());
      $(el, '#s11x').addEventListener('click', () => { st.a = 10; st.b = 0.5; ra.set(10); rb.set(0.5); calc(); });
      bindTgl(el, 's11e', (o) => { st.err = o; calc(); }); calc();
    },
    tick(dt) { if (!st.play) return; st.s = Math.max(0, Math.min(1, st.s + st.dir * dt * 0.35)); if (st.s >= 1 || st.s <= 0) st.dir *= -1; this._r.rs.set(st.s.toFixed(2)); morph(); },
    toggle() { st.play = !st.play; },
    reset() { st.a = 5; st.b = 4; st.s = 1; st.play = false; const { ra, rb, rs } = this._r; ra.set(5); rb.set(4); rs.set(1); calc(); },
    audit() { const r = st.res; return [['Simpson − AGM', sci(r.P - r.agm)], ['Simpson − series', sci(r.P - r.ser)], ['Simpson internal error estimate', sci(r.ref.errorEstimate)], ['Ramanujan II − AGM', sci(r.r2 - r.agm)]]; },
    notes: { say: 'The area follows from a determinant: stretch a unit circle by a and b, area multiplies by ab. Perimeter has no such shortcut. Press Extreme: Ramanujan II visibly degrades when the ellipse is very flat.',
      points: ['Reference P ≈ 28.361667889 for (5,4), confirmed by three independent methods.', 'Ramanujan I error ~1e-7 absolute; Ramanujan II ~1e-13 at e = 0.6.', 'On this smooth periodic integrand even plain Simpson reaches machine precision by n = 16 panels (Euler–Maclaurin).'],
      expected: '(5,4): Simpson 28.361667889, R-I 28.361667784, R-II 28.361667889 (err ~2e-13).', pitfalls: ['“No elementary formula” ≠ “cannot compute”.', 'The Ramanujan errors are not small for extremely flat ellipses.'],
      q: 'Is E(e) the integral of the same function as the perimeter?', a: 'Yes: P = 4a∫₀^{π/2}√(1−e²sin²t) dt = 4aE(e), by factoring a out of √(a²sin²+b²cos²) after t → π/2 − t.' },
  });
})();

/* ============================ 12 THE FINALE ============================ */
(function () {
  const NODES = [
    { n: 'Geometry', s: 3, x: -6.4, y: 3.4, t: 'Two distances add to 2a ⇒ x²/25 + y²/16 = 1. The curve is defined by an invariant.' },
    { n: 'Linear algebra', s: 5, x: 0, y: 5.2, t: 'The ellipse is xᵀQx = 1: eigenvectors give the axes, eigenvalues 1/25 and 1/16 give the semi-axes; rotation moves the vectors, not the eigenvalues.' },
    { n: 'Optics', s: 6, x: 6.4, y: 3.4, t: 'The normal bisects F₁PF₂, so every ray from F₁ reflects through F₂. All paths have the same length 2a.' },
    { n: 'Dynamics', s: 8, x: 6.4, y: -3.4, t: 'Spring force to the centre and inverse-square force to a focus give the same path with different clocks.' },
    { n: 'Probability', s: 10, x: 0, y: -5.2, t: 'The Gaussian level set is this ellipse; its probability is 1 − e^(−½) = 39.35 % in 2-D, not 68 %.' },
    { n: 'Numerical analysis', s: 11, x: -6.4, y: -3.4, t: 'Area is exact (πab), perimeter is an elliptic integral — computed and approximated, never an elementary closed form.' },
  ];
  let st, el, v, n = {};
  function pick(i) {
    st.sel = i; $$(el, '.node').forEach((g, k) => g.classList.toggle('sel', k === i));
    const d = NODES[i]; $(el, '#s12card').innerHTML = `<h2>${d.n}</h2><p class="lead">${d.t}</p>${btn('s12go', 'Go to slide ' + d.s + ' →', 'primary')}`;
    $(el, '#s12go').addEventListener('click', () => go(d.s - 1)); st.lines.forEach((l, k) => (l.style.opacity = k === i ? 1 : 0.25));
  }
  defineSlide({
    short: 'The finale', title: 'The equation was never the whole story.', desc: 'Six connections around one ellipse',
    thumb: thumb(dot(30, '#6FE4F0') + dot(170, '#5EE0B2') + dot(100, '#FF9EC4')),
    layout: 'finale',
    html: `<div class="body"><div class="viz"><svg id="s12svg" role="img" aria-label="The reference ellipse surrounded by six connections"></svg></div><div class="side">
      <div id="s12card" class="callout"></div>
      <p class="lead insight" id="s12st">“The same curve can be governed by different structures. Understanding mathematics means discovering what remains invariant — and what changes.”</p>
      <div class="btns">${btn('s12q', 'Final question', 'primary')}</div>
      <div id="s12qa" class="fade"><p class="lead">Can we identify a physical system from its trajectory alone?</p>
        <p><b>Usually not from the geometric shape alone.</b> The same ellipse is produced by F = −kr (centre) and F = −GMm r/r³ (focus). Additional dynamical information — the time parametrisation (speed along the path) and the force law/centre — is needed. With time-resolved data one can tell them apart immediately: compare the speed curves on slide 8.</p></div></div></div>`,
    init(root) {
      el = root; st = { sel: 0, lines: [] };
      const svg = $(el, '#s12svg'); v = new View(svg, 760, 600, 42);
      v.defs(); baseScene(svg, v, 8.6, 6.3, 1);
      bloomPath(svg, { d: v.d(E.samplePath(5, 4, 300), true), fill: ellFill(svg), stroke: COL.ell, 'stroke-width': 4.2, class: 'core' });
      T(svg, v.X(0), v.Y(0) + 9, 'x²/25 + y²/16 = 1', { 'text-anchor': 'middle', class: 'core-eq', style: 'font-size:27px;fill:#F3F7FF' });
      [-3, 3].forEach((x) => S('circle', { cx: v.X(x), cy: v.Y(0), r: 5.5, fill: COL.foc, class: 'glow-g' }, svg));
      st.ends = []; st.pulses = [];
      NODES.forEach((d, i) => {
        const t = Math.atan2(d.y / 4.2, d.x / 5.4), p = E.point(5, 4, t), ang = Math.atan2(d.y, d.x);
        const g = S('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': d.n, style: `--ni:${i}` }, svg), ln = S('line', { class: 'cn', style: `--ni:${i}`, x1: v.X(p[0]), y1: v.Y(p[1]), x2: v.X(d.x * 0.88), y2: v.Y(d.y * 0.85), stroke: COL.foc, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg); st.lines.push(ln); st.ends.push([v.X(p[0]), v.Y(p[1]), v.X(d.x * 0.88), v.Y(d.y * 0.85)]);
        S('circle', { cx: v.X(p[0]), cy: v.Y(p[1]), r: 6, fill: COL.foc }, svg);
        S('rect', { x: v.X(d.x) - 78, y: v.Y(d.y) - 24, width: 156, height: 48, rx: 8 }, g); T(g, v.X(d.x), v.Y(d.y) - 5, '0' + (i + 1) + ' · SLIDE ' + d.s, { 'text-anchor': 'middle', class: 'num' }); T(g, v.X(d.x), v.Y(d.y) + 14, d.n, { 'text-anchor': 'middle' });
        g.addEventListener('click', () => pick(i)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); pick(i); } });
      });
      st.pulses = NODES.map(() => S('circle', { r: 3.6, fill: COL.foc, opacity: 0, class: 'glow-g' }, svg));
      $(el, '#s12q').addEventListener('click', () => $(el, '#s12qa').classList.toggle('on')); pick(0);
    },
    tick(dt, t) { // light travels from the ellipse to each connection, out of phase: the six links breathe around the curve
      if (App.reduced) return;
      st.pulses.forEach((c, i) => { const u = (t * 0.2 + i / 6) % 1, e = st.ends[i]; c.setAttribute('cx', (e[0] + (e[2] - e[0]) * u).toFixed(1)); c.setAttribute('cy', (e[1] + (e[3] - e[1]) * u).toFixed(1)); c.setAttribute('opacity', (Math.sin(Math.PI * u) * 0.9).toFixed(2)); });
    },
    step(d) { if (d > 0) $(el, '#s12qa').classList.add('on'); else $(el, '#s12qa').classList.remove('on'); },
    toggle() { pick((st.sel + 1) % 6); },
    reset() { $(el, '#s12qa').classList.remove('on'); pick(0); },
    audit() { return [['reference ellipse', 'a=5, b=4, c=' + E.props(5, 4).c + ', e=' + E.props(5, 4).e.toFixed(2)], ['perimeter (AGM)', fmt(E.perimeterAGM(5, 4), 9)], ['area/π', fmt(E.props(5, 4).area / Math.PI, 9)]]; },
    notes: { say: 'Click each connection; each one links back to the slide that proved it. Finish with the statement, then ask the final question and reveal the answer (↓).',
      points: ['Invariant: the point set. What changes: the law, the clock, the force centre, the probability.', 'Shape alone underdetermines the physics.'], expected: 'Six clickable nodes; the card shows the insight and a button to jump to the slide; ↓ reveals the discussion.',
      pitfalls: ['Do not overclaim: “usually not” — time information can resolve it.'], q: 'Give a case where the trajectory DOES identify the system.', a: 'If the speed along the orbit is also known (a clock), the force follows from the acceleration r̈(t) = F(r)/m: the centre of force is where the acceleration vectors point.' },
  });
})();
