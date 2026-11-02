/* core.js — helpers, slide registry, navigation, overlays, presenter tools, audit mode, the one animation loop */
'use strict';
const E = Engine;
const NS = 'http://www.w3.org/2000/svg';
const $ = (r, s) => r.querySelector(s);
const $$ = (r, s) => Array.from(r.querySelectorAll(s));
const S = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const fmt = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '—');
const sci = (x) => (Number.isFinite(x) ? (x === 0 ? '0' : x.toExponential(2)) : '—');
const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;
const pad2 = (n) => String(n).padStart(2, '0');
const fr = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
const COL = { circle: '#6FE4F0', ell: '#48B8FF', foc: '#FFD278', phys: '#5EE0B2', rose: '#FF9EC4', warn: '#FF8A9B', ink: '#F3F7FF', dim: '#91A6BE' };

/* ---- markup helpers used by slide templates ---- */
const rng = (id, label, min, max, step, val, wide) =>
  `<div class="ctl${wide ? ' wide' : ''}"><label for="${id}">${label}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output for="${id}">${val}</output></div>`;
const tgl = (id, label, on) => `<label class="tgl"><input type="checkbox" id="${id}"${on ? ' checked' : ''}>${label}</label>`;
const btn = (id, label, cls) => `<button class="btn${cls ? ' ' + cls : ''}" id="${id}" type="button">${label}</button>`;

/* ---- SVG view: math coordinates <-> viewBox pixels ---- */
class View {
  constructor(svg, w, h, k, ox, oy) {
    this.svg = svg; this.w = w; this.h = h; this.k = k;
    this.ox = ox === undefined ? w / 2 : ox; this.oy = oy === undefined ? h / 2 : oy;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  X(x) { return this.ox + x * this.k; }
  Y(y) { return this.oy - y * this.k; }
  d(pts, close) { return 'M' + pts.map((p) => this.X(p[0]).toFixed(2) + ' ' + this.Y(p[1]).toFixed(2)).join('L') + (close ? 'Z' : ''); }
  fromEvent(e) {
    const m = this.svg.getScreenCTM();
    if (!m) return [0, 0];
    const pt = this.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(m.inverse());
    return [(p.x - this.ox) / this.k, (this.oy - p.y) / this.k];
  }
  defs() { return $(this.svg, 'defs') || this.svg.insertBefore(document.createElementNS(NS, 'defs'), this.svg.firstChild); }
  grid(g, xmax, ymax, step) {
    g.setAttribute('class', 'grid');
    g.textContent = '';
    const id = 'gf' + (View.n = (View.n || 0) + 1), rg = S('radialGradient', { id, gradientUnits: 'userSpaceOnUse', cx: this.ox, cy: this.oy, r: Math.hypot(xmax * this.k, ymax * this.k) * 0.62 }, this.defs());
    S('stop', { offset: 0.3, 'stop-color': '#A9DCFF', 'stop-opacity': 0.15 }, rg); S('stop', { offset: 1, 'stop-color': '#A9DCFF', 'stop-opacity': 0 }, rg);
    const st = 'url(#' + id + ')';
    for (let x = -Math.floor(xmax / step) * step; x <= xmax + 1e-9; x += step) S('line', { x1: this.X(x), x2: this.X(x), y1: this.Y(-ymax), y2: this.Y(ymax), stroke: st }, g);
    for (let y = -Math.floor(ymax / step) * step; y <= ymax + 1e-9; y += step) S('line', { x1: this.X(-xmax), x2: this.X(xmax), y1: this.Y(y), y2: this.Y(y), stroke: st }, g);
  }
  axes(g, xmax, ymax) {
    g.setAttribute('class', 'axis');
    S('line', { x1: this.X(-xmax), x2: this.X(xmax), y1: this.Y(0), y2: this.Y(0) }, g);
    S('line', { x1: this.X(0), x2: this.X(0), y1: this.Y(-ymax), y2: this.Y(ymax) }, g);
  }
}
/* draggable handle: a group with a big transparent hit area; onMove receives math coordinates */
function makeDrag(el, view, onMove, onStart) {
  el.classList.add('handle');
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    if (onStart) onStart();
    const mv = (ev) => { const p = view.fromEvent(ev); onMove(p[0], p[1], ev); };
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    mv(e);
  });
}
function handleDot(parent, color, r) {
  const g = S('g', null, parent);
  S('circle', { class: 'hit', r: (r || 7) + 14 }, g);
  S('circle', { class: 'halo', r: (r || 7) + 15, fill: color, opacity: 0.1 }, g);
  S('circle', { class: 'halo', r: (r || 7) + 8, fill: color, opacity: 0.2 }, g);
  S('circle', { r: r || 7, fill: color, stroke: '#050B14', 'stroke-width': 2.5 }, g);
  return g;
}
/* Bloom WITHOUT filters: the same outline drawn three times — two wide, faint underlays and the crisp line.
   A CSS drop-shadow on a stage-sized path re-blurs the whole stage every frame; stacked strokes cost a few thousand pixels.
   Returns the crisp path; setting its 'd' also moves the underlays; `.bloom` (its parent group) is what to show/hide. */
function bloomPath(parent, attrs, color) {
  const g = S('g', { class: 'bloom' }, parent), c = color || attrs.stroke, w = +attrs['stroke-width'] || 3;
  const under = (k, o) => S('path', Object.assign({}, attrs, { fill: 'none', stroke: c, 'stroke-width': w * k, 'stroke-opacity': o }), g);
  const u1 = under(4.6, 0.07), u2 = under(2.3, 0.15), main = S('path', attrs, g), set = main.setAttribute.bind(main);
  main.setAttribute = (k, v) => { set(k, v); if (k === 'd') { u1.setAttribute('d', v); u2.setAttribute('d', v); } };
  return main;
}
/* interior bloom for an ellipse: transparent at the centre, lit along the rim (bounding-box gradient, so it follows any ellipse) */
function ellFill(svg, rgb) {
  const defs = $(svg, 'defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild), col = rgb || '#48B8FF';
  const id = 'ef' + (ellFill.n = (ellFill.n || 0) + 1), rg = S('radialGradient', { id, cx: 0.5, cy: 0.5, r: 0.5 }, defs);
  S('stop', { offset: 0, 'stop-color': col, 'stop-opacity': 0.01 }, rg); S('stop', { offset: 0.72, 'stop-color': col, 'stop-opacity': 0.06 }, rg); S('stop', { offset: 1, 'stop-color': col, 'stop-opacity': 0.24 }, rg);
  return 'url(#' + id + ')';
}
function place(el, x, y) { el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`); }
function arrow(parent, color, w) {
  const g = S('g', null, parent), l = S('line', { stroke: color, 'stroke-width': w || 2.5, 'stroke-linecap': 'round' }, g);
  const h = S('path', { fill: color }, g);
  g.set = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (!(L > 1.5)) { g.style.display = 'none'; return; }
    g.style.display = '';
    const ux = dx / L, uy = dy / L, hl = Math.min(11, L * 0.5), hw = hl * 0.5;
    l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2 - ux * hl * 0.6); l.setAttribute('y2', y2 - uy * hl * 0.6);
    h.setAttribute('d', `M${x2} ${y2}L${x2 - ux * hl - uy * hw} ${y2 - uy * hl + ux * hw}L${x2 - ux * hl + uy * hw} ${y2 - uy * hl - ux * hw}Z`);
  };
  return g;
}
/* binders */
function bindRange(root, id, cb, fmtFn) {
  const i = $(root, '#' + id), o = $(root, `output[for=${id}]`);
  const upd = () => {
    if (o) o.textContent = fmtFn ? fmtFn(+i.value) : i.value;
    const lo = +i.min || 0, hi = +i.max || 100; i.style.setProperty('--p', (100 * (+i.value - lo) / (hi - lo || 1)).toFixed(2) + '%');
  };
  i.addEventListener('input', () => { upd(); cb(+i.value); });
  upd();
  return { el: i, set(v) { i.value = v; upd(); }, get: () => +i.value, sync: upd };
}
function bindTgl(root, id, cb) {
  const i = $(root, '#' + id);
  i.addEventListener('change', () => cb(i.checked));
  return i;
}

/* ---- registry & app state ---- */
const Slides = [];
const defineSlide = (d) => Slides.push(d);
const App = {
  cur: -1, audit: false, notes: false, clean: false, pw: null, mode: 'present',
  reduced: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};
App.autoplay = !App.reduced;
const overlayOpen = () => $$(document, '.overlay.on').length > 0;
let toastTimer = 0;
function toast(msg) {
  const t = $(document, '#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
}

function mount() {
  const stage = $(document, '#stage');
  Slides.forEach((d, i) => {
    const s = document.createElement('section');
    s.className = 'slide'; s.id = 's' + (i + 1); s.dataset.layout = d.layout || 'stage'; s.setAttribute('inert', '');
    s.setAttribute('aria-label', `Slide ${i + 1}: ${d.short}`);
    s.innerHTML = `<div class="head"><div class="kicker"><b>${pad2(i + 1)}</b> · ${d.short}</div><h1${d.wide ? ' class="wide"' : ''} aria-label="${d.title.replace(/"/g, '&quot;')}">${FX.words(d.title)}</h1></div>${d.html}`;
    FX.prepare(s);
    stage.appendChild(s); d.el = s;
  });
}
function go(i) {
  i = Math.max(0, Math.min(Slides.length - 1, i));
  if (i === App.cur) return;
  const first = App.cur < 0, prev = Slides[App.cur]; Gov.grace = 1.2;
  if (prev && prev.leave) prev.leave();
  App.cur = i;
  Slides.forEach((d, k) => {
    d.el.classList.toggle('active', k === i);
    d.el.classList.toggle('before', k < i);
    if (k === i) d.el.removeAttribute('inert'); else d.el.setAttribute('inert', '');
  });
  const d = Slides[i];
  if (!d.ready) {
    d.ready = true;
    try { d.init && d.init(d.el); } catch (err) { console.error('init failed on slide ' + (i + 1), err); toast('Slide ' + (i + 1) + ' failed to initialise: ' + err.message); }
  }
  try { d.enter && d.enter(); } catch (err) { console.error('enter failed', err); }
  FX.dock(i, first); FX.atmosphere(i); document.body.dataset.slide = i + 1;
  $(document, '#pos').textContent = `${pad2(i + 1)} / ${Slides.length} · ${d.short}`;
  try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { /* file:// sandboxes */ }
  renderNotes();
  updateAudit(true);
}
const next = () => go(App.cur + 1), prevSlide = () => go(App.cur - 1);

/* ---- notes & presenter window ---- */
function notesHTML(d, i) {
  const n = d.notes || {};
  const li = (a) => (a || []).map((x) => `<li>${x}</li>`).join('');
  return `<h4>Slide ${i + 1} of ${Slides.length} — ${d.short}</h4><p class="q">${n.say || ''}</p>
  <h4>Key talking points</h4><ul>${li(n.points)}</ul>
  <h4>Expected result of the experiment</h4><p>${n.expected || ''}</p>
  <h4>Common pitfalls</h4><ul>${li(n.pitfalls)}</ul>
  <h4>Teacher question</h4><p class="q">${n.q || ''}</p><p><b>Suggested answer.</b> ${n.a || ''}</p>
  ${n.proof ? `<h4>Full derivation / rigorous note</h4>${n.proof}` : ''}`;
}
function renderNotes() {
  const d = Slides[App.cur]; if (!d) return;
  const html = notesHTML(d, App.cur);
  $(document, '#notes').innerHTML = `<div class="sw"><button class="btn sm" data-n="-1">‹ Prev</button><button class="btn sm" data-n="1">Next ›</button><span class="dim">Hidden while projecting: H</span></div>` + html;
  if (App.pw && !App.pw.closed) {
    const c = App.pw.document.getElementById('c');
    if (c) c.innerHTML = `<div class="sw"><button data-n="-1">‹ Prev</button><button data-n="1">Next ›</button></div>` + html + `<h4>Next slide</h4><p>${(Slides[App.cur + 1] || { title: '— end —' }).title}</p>`;
  }
}
function setNotes(on) {
  App.notes = on; $(document, '#notes').classList.toggle('on', on);
  $(document, '#bNotes').setAttribute('aria-pressed', on);
}
function setAudit(on) {
  App.audit = on; $(document, '#audit').classList.toggle('hidden', !on);
  $(document, '#bAudit').setAttribute('aria-pressed', on);
  if (on) updateAudit(true);
  toast(on ? 'Mathematical Audit Mode on — diagnostics are computed live' : 'Audit mode off');
}
function openPresenter() {
  const w = window.open('', 'ce_presenter', 'width=860,height=900');
  if (!w) { toast('Pop-up blocked — use the docked notes (N) instead'); return; }
  w.document.open();
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Presenter — Circle &amp; Ellipse</title><style>body{background:#050B14;color:#F3F7FF;font:16px/1.5 -apple-system,system-ui,sans-serif;margin:0;padding:1.4rem 1.8rem}h4{font:700 12px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#A9DCFF;margin:1.2rem 0 .3rem}p,li{color:#b6c0d4;margin:.3rem 0}p.q{color:#F3F7FF;font-size:1.05rem}.sw{display:flex;gap:.5rem;margin-bottom:1rem}button{background:none;border:1px solid #44506a;color:#F3F7FF;border-radius:6px;padding:.4rem .9rem;font-size:14px;cursor:pointer}</style><div id="c"></div>`);
  w.document.close();
  App.pw = w;
  w.document.addEventListener('keydown', onKey);
  w.document.addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) go(App.cur + +b.dataset.n); });
  renderNotes();
  toast('Presenter window opened — drag it to the second screen');
}

/* ---- audit mode ---- */
let lastAudit = 0;
function updateAudit(force) {
  if (!App.audit) return;
  const now = performance.now();
  if (!force && now - lastAudit < 180) return;
  lastAudit = now;
  const d = Slides[App.cur]; let rows = [];
  try { rows = (d && d.audit && d.audit()) || []; } catch (err) { rows = [['audit error', String(err.message)]]; }
  $(document, '#audit').innerHTML = `<div class="hd">Mathematical audit · slide ${App.cur + 1}</div>` +
    (rows.length ? rows.map((r) => `<div><b>${r[0]}</b> ${r[1]}</div>`).join('') : '<div><b>no live quantity on this slide</b></div>');
}

/* ---- overlays ---- */
function openOverlay(id) { closeOverlays(); $(document, '#' + id).classList.add('on'); }
function closeOverlays() { $$(document, '.overlay.on').forEach((o) => o.classList.remove('on')); }
function buildOverview() {
  const g = $(document, '#ovGrid');
  g.innerHTML = Slides.map((d, i) => `<button data-go="${i}" aria-label="Go to slide ${i + 1}"><span class="n">${pad2(i + 1)}</span>${d.thumb || ''}<span class="t">${d.short}</span><span class="d">${d.desc || ''}</span></button>`).join('');
  g.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { closeOverlays(); go(+b.dataset.go); } });
}
function openOverview() { $$(document, '#ovGrid button').forEach((b, i) => b.classList.toggle('cur', i === App.cur)); openOverlay('overview'); }
function openAppendix() {
  const b = $(document, '#appBody');
  if (!b.dataset.built && window.buildAppendix) { window.buildAppendix(b); b.dataset.built = '1'; }
  openOverlay('appendix');
}
function setClean(on) {
  App.clean = on; document.body.classList.toggle('clean', on);
  if (on) { toast('Projection mode: notes, audit and tools hidden — press H to bring them back'); }
}
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => toast('Fullscreen is not available here'));
  else toast('Fullscreen is not supported by this browser');
}
document.addEventListener('fullscreenchange', () => { setClean(!!document.fullscreenElement); $(document, '#bFull').setAttribute('aria-pressed', !!document.fullscreenElement); });

/* ---- keyboard ---- */
const isTyping = (el) => el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.type !== 'checkbox' && el.type !== 'button';
function onKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const el = document.activeElement, k = e.key;
  const sliderFocus = el && el.tagName === 'INPUT' && el.type === 'range';
  if (k === 'Escape') { if (overlayOpen()) closeOverlays(); else if (App.notes) setNotes(false); return; }
  if (isTyping(el) && !sliderFocus) return;
  if (overlayOpen()) { if (k === 'o' || k === 'O') closeOverlays(); return; }
  const d = Slides[App.cur];
  switch (k) {
    case 'ArrowRight': case 'PageDown': if (sliderFocus && k === 'ArrowRight') return; e.preventDefault(); next(); break;
    case 'ArrowLeft': case 'PageUp': if (sliderFocus && k === 'ArrowLeft') return; e.preventDefault(); prevSlide(); break;
    case 'ArrowDown': if (sliderFocus) return; if (d.step) { e.preventDefault(); d.step(1); } break;
    case 'ArrowUp': if (sliderFocus) return; if (d.step) { e.preventDefault(); d.step(-1); } break;
    case ' ': case 'Spacebar':
      if (el && /^(BUTTON|INPUT|SELECT|A|SUMMARY)$/.test(el.tagName)) return; // a focused control keeps its own Space behaviour
      e.preventDefault(); if (d.toggle) d.toggle(); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'r': case 'R': if (d.reset) { d.reset(); toast('Experiment reset'); } break;
    case 'n': case 'N': setNotes(!App.notes); break;
    case 'p': case 'P': openPresenter(); break;
    case 'm': case 'M': setAudit(!App.audit); break;
    case 'h': case 'H': setClean(!App.clean); break;
    case 'd': case 'D': FX.setMode(App.mode === 'research' ? 'present' : 'research'); break;
    case 'o': case 'O': openOverview(); break;
    case 'a': case 'A': openAppendix(); break;
    case '?': case '/': openOverlay('help'); break;
    case 'Home': go(0); break;
    case 'End': go(Slides.length - 1); break;
    default: {
      const map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9, '-': 10, '=': 11 };
      if (k in map) go(map[k]);
    }
  }
}

/* ---- boot ---- */
let last = performance.now();
/* Quality governor: if the browser cannot hold frame rate, shed decoration in two steps (never maths, never interaction):
   q1 = freeze the drifting light fields · q2 = no backdrop blur, no filter glows, no grain. Measured, never assumed; one-way within a session. */
const Gov = { acc: 0, n: 0, level: 0, slow: 0, grace: 1.5 };   // grace: seconds still to ignore (page start, slide changes)
function govern(rawDt) {
  if (document.hidden || rawDt > 0.5) return;                 // tab switches / long pauses are not "slow frames"
  if (Gov.grace > 0) { Gov.grace -= rawDt; Gov.acc = 0; Gov.n = 0; return; }
  Gov.acc += rawDt; Gov.n++;
  if (Gov.acc < 1.5) return;                                  // evaluate over 1.5 s windows
  const avg = (Gov.acc / Gov.n) * 1000; Gov.acc = 0; Gov.n = 0;
  Gov.slow = avg > 24 ? Gov.slow + 1 : 0;
  if (Gov.level < 2 && (avg > 40 || Gov.slow >= 2)) { Gov.level++; Gov.slow = 0; document.body.classList.add('q' + Gov.level); window.CE && (CE.quality = Gov.level); }
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); govern((now - last) / 1000); last = now;
  const d = Slides[App.cur];
  if (d && d.tick && !overlayOpen() && !document.hidden) {
    try { d.tick(dt, now / 1000); } catch (err) { if (!d._err) { d._err = 1; console.error('tick failed', err); toast('Animation error on slide ' + (App.cur + 1)); } }
  }
  updateAudit(false);
  requestAnimationFrame(frame);
}
function boot() {
  mount(); FX.init(); buildOverview();
  $(document, '#bMode').addEventListener('click', () => FX.setMode(App.mode === 'research' ? 'present' : 'research'));
  $(document, '#bFull').addEventListener('click', toggleFullscreen);
  document.addEventListener('keydown', onKey);
  $(document, '#prev').addEventListener('click', prevSlide);
  $(document, '#next').addEventListener('click', next);
  $(document, '#bAudit').addEventListener('click', () => setAudit(!App.audit));
  $(document, '#bNotes').addEventListener('click', () => setNotes(!App.notes));
  $(document, '#bPres').addEventListener('click', openPresenter);
  $(document, '#bApp').addEventListener('click', openAppendix);
  $(document, '#bOv').addEventListener('click', openOverview);
  $(document, '#bHelp').addEventListener('click', () => openOverlay('help'));
  $(document, '#notes').addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) go(App.cur + +b.dataset.n); });
  $$(document, '[data-close]').forEach((b) => b.addEventListener('click', closeOverlays));
  // after a mouse interaction, release focus so arrows / Space go back to the presentation
  document.addEventListener('pointerup', (e) => { const t = e.target.closest && e.target.closest('input[type=range]'); if (t) setTimeout(() => t.blur(), 0); });
  document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('button,input[type=checkbox]'); if (t && e.detail > 0 && t.closest('.slide,.dock')) setTimeout(() => t.blur(), 0); });
  // touch swipe
  let sx = 0, sy = 0, sok = false;
  const stage = $(document, '#stage');
  stage.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; sok = !e.target.closest('.handle,input,button,canvas,.side,.dock'); }, { passive: true });
  stage.addEventListener('touchend', (e) => { if (!sok) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dx) > 70 && Math.abs(dy) < 50) (dx < 0 ? next : prevSlide)(); }, { passive: true });
  window.addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n >= 1 && n <= Slides.length) go(n - 1); });
  window.addEventListener('beforeunload', () => { if (App.pw && !App.pw.closed) App.pw.close(); });
  const start = parseInt(location.hash.slice(1), 10);
  go(start >= 1 && start <= Slides.length ? start - 1 : 0);
  if (App.reduced) toast('Reduced motion is on — animations start paused (Space plays)');
  requestAnimationFrame((t) => { last = t; frame(t); });
}
window.CE = { App, Slides, go, E, toast, setAudit, setNotes, setClean, boot, FX: () => FX };
