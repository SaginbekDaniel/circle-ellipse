/* fx.js — presentation layer: atmosphere, liquid indicators, pointer light, idle dock, refraction,
   title reveals, presentation/research modes. No mathematics lives here; it only reads App state. */
'use strict';
const FX = (function () {
  const reduced = () => App.reduced;
  const ease = (cur, target, dt, rate) => cur + (target - cur) * (1 - Math.exp(-rate * dt)); // frame-rate independent smoothing
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);

  /* ---------- titles: every word in a clipping mask so it can rise into view ---------- */
  function words(title) {
    return title.split(' ').map((w, i) => `<span class="w"><span style="--wi:${i}">${w}</span></span>`).join(' ');
  }

  /* ---------- per-slide scaffolding: glass side panel with an inner scroller, reveal stagger ---------- */
  function prepare(s) {
    $$(s, '.side').forEach((side) => {
      side.classList.add('glass');
      const inner = document.createElement('div'); inner.className = 'side-in';
      while (side.firstChild) inner.appendChild(side.firstChild);
      side.appendChild(inner);
    });
    $$(s, '.viz').forEach((v) => { v.classList.add('rv'); v.style.setProperty('--rv', 1); });
    $$(s, '.side,.hud,.drawer,.cdock').forEach((p, i) => { p.classList.add('rv'); p.style.setProperty('--rv', 2 + i); });
  }

  /* ---------- liquid indicator: the leading edge moves first, the trailing edge follows ---------- */
  function liquid(container, ind, target, snap) {
    if (!target) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    const L = target.offsetLeft, R = container.clientWidth - (target.offsetLeft + target.offsetWidth);
    const curL = parseFloat(ind.style.left) || 0;
    ind.classList.toggle('snap', !!snap || reduced());
    ind.classList.toggle('to-r', L > curL); ind.classList.toggle('to-l', L < curL);
    ind.style.left = L + 'px'; ind.style.right = R + 'px';
  }
  function seg(container) {
    if (container._seg) return container._seg;
    const ind = document.createElement('i'); ind.className = 'liq snap'; container.prepend(ind);
    const pressed = () => container.querySelector('[aria-pressed=true]');
    const sync = (snap) => liquid(container, ind, pressed(), snap);
    new MutationObserver(() => sync(false)).observe(container, { attributes: true, attributeFilter: ['aria-pressed'], subtree: true });
    if (window.ResizeObserver) new ResizeObserver(() => sync(true)).observe(container);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => sync(true));
    sync(true); container._seg = { sync };
    return container._seg;
  }

  /* ---------- atmosphere: three soft light fields that glide to where the slide's subject is ---------- */
  const ORB_COL = ['rgba(72,184,255,.36)', 'rgba(111,228,240,.20)', 'rgba(120,150,255,.22)'];
  const WARM = { 8: 1, 9: 1, 6: 0.5 };            // physics / optics slides get a faint warm focus
  function atmosphere(i) {
    const a = $(document, '#atmos'); if (!a) return;
    const d = Slides[i], lay = d.layout || 'stage';
    const focusX = { hero: 68, immersive: 50, duo: 50, proof: 30, lab: 40, stage: 36, finale: 38 }[lay] || 40;
    const pos = [[focusX, 46, 108, 0.55], [(18 + i * 23) % 90 + 5, 92 - ((i * 17) % 40), 74, 0.28], [(88 - i * 19 + 100) % 100, 6 + ((i * 29) % 30), 66, 0.30]]; // vmin: the layers are sized by the short side, ~45 % less compositing area
    $$(a, '.orb').forEach((o, k) => {
      o.style.setProperty('--x', pos[k][0] + 'vw'); o.style.setProperty('--y', pos[k][1] + 'vh');
      o.style.setProperty('--s', pos[k][2] + 'vmin'); o.style.setProperty('--o', pos[k][3]);
      o.style.setProperty('--c', k === 2 && WARM[i + 1] ? 'rgba(255,210,120,' + (0.16 * WARM[i + 1]) + ')' : ORB_COL[k]);
    });
  }

  /* ---------- dock ---------- */
  function dock(i, first) {
    const track = $(document, '#dkTrack'); if (!track) return;
    const btns = $$(track, '.dk-n');
    btns.forEach((b, k) => { b.classList.toggle('done', k < i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    liquid(track, $(track, '.liq'), btns[i], first);
    $(document, '#dkProg').style.setProperty('--p', (i + 1) / Slides.length);
  }
  function initDock() {
    const track = $(document, '#dkTrack');
    const ind = document.createElement('i'); ind.className = 'liq snap'; track.prepend(ind);
    Slides.forEach((d, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dk-n'; b.textContent = i + 1;
      b.title = `${i + 1}. ${d.short}`; b.setAttribute('aria-label', `Go to slide ${i + 1}: ${d.short}`);
      b.addEventListener('click', () => go(i)); track.appendChild(b);
    });
    if (window.ResizeObserver) new ResizeObserver(() => dock(App.cur, true)).observe(track);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => dock(App.cur, true));
  }

  /* ---------- pointer light: the specular highlight of glass and buttons follows the cursor ---------- */
  function pointerLight() {
    let raf = 0, ev = null;
    const apply = () => {
      raf = 0; if (!ev) return;
      const t = ev.target.closest && ev.target.closest('.glass,.btn,.dk-btn');
      if (t) { const r = t.getBoundingClientRect(); t.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%'); t.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%'); }
    };
    document.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; ev = e; if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
  }

  /* ---------- idle: the dock recedes while the presenter talks, returns on any interaction ---------- */
  function idle() {
    let timer = 0;
    const wake = () => {
      document.body.classList.remove('idle'); clearTimeout(timer);
      timer = setTimeout(() => { if (!overlayOpen() && $(document, '#more').hidden) document.body.classList.add('idle'); }, 3400);
    };
    ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'focusin', 'wheel'].forEach((t) => document.addEventListener(t, wake, { passive: true }));
    wake();
  }

  /* ---------- refraction (Chromium: backdrop-filter:url()) — scoped to the dock, edges only, never touches text ---------- */
  function refraction() {
    const dock = $(document, '#dock'), img = $(document, '#lgMap'), flt = $(document, '#lg-refract');
    const chromium = /Chrome\//.test(navigator.userAgent) && !/Edg\/|OPR\//.test(navigator.userAgent) && !!window.chrome;
    if (!dock || !img || !chromium || reduced()) return;
    let w = 0, h = 0, t = 0;
    const build = () => {
      const r = dock.getBoundingClientRect(); const W = Math.round(r.width), H = Math.round(r.height);
      if (W < 20 || (W === w && H === h)) return; w = W; h = H;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H);
      const rad = H / 2, bez = Math.min(16, H * 0.34);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const cx = Math.min(Math.max(x, rad), W - rad), cy = H / 2, dx = x - cx, dy = y - cy, dist = rad - Math.hypot(dx, dy); // distance inside the pill edge
        let ox = 0, oy = 0;
        if (dist >= 0 && dist < bez) { const k = Math.pow(1 - dist / bez, 2), L = Math.hypot(dx, dy) || 1; ox = (-dx / L) * k; oy = (-dy / L) * k; } // bend light inward at the rim
        const p = (y * W + x) * 4; id.data[p] = 128 + ox * 127; id.data[p + 1] = 128 + oy * 127; id.data[p + 2] = 128; id.data[p + 3] = 255;
      }
      g.putImageData(id, 0, 0);
      img.setAttribute('href', c.toDataURL()); img.setAttribute('width', W); img.setAttribute('height', H);
      flt.setAttribute('width', W); flt.setAttribute('height', H); dock.classList.add('refract');
    };
    const sched = () => { clearTimeout(t); t = setTimeout(build, 120); };
    if (window.ResizeObserver) new ResizeObserver(sched).observe(dock);
    build();
  }

  /* ---------- presentation / research ---------- */
  function setMode(m, silent) {
    App.mode = m; document.body.dataset.mode = m;
    const b = $(document, '#bMode'); b.setAttribute('aria-pressed', m === 'research');
    $$(document, 'details.xd').forEach((d) => {
      if (m === 'research' && !d.open) { d.open = true; d.dataset.auto = 1; }
      else if (m === 'present' && d.dataset.auto) { d.open = false; delete d.dataset.auto; }
    });
    try { localStorage.setItem('ce-mode', m); } catch (e) { /* private mode */ }
    if (!silent) toast(m === 'research' ? 'Research mode — full controls, measurements and proofs' : 'Presentation mode — one visual focus');
    $$(document, '.seg').forEach((s) => s._seg && s._seg.sync(true));
  }
  function initMode() {
    let m = 'present'; try { m = localStorage.getItem('ce-mode') === 'research' ? 'research' : 'present'; } catch (e) { /* ignore */ }
    setMode(m, true);
  }

  /* ---------- tools popover ---------- */
  function initMore() {
    const btn = $(document, '#bMore'), menu = $(document, '#more');
    const set = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('#more')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
    menu.addEventListener('click', (e) => { if (e.target.closest('button')) set(false); });
  }

  function init() {
    initDock(); pointerLight(); idle(); initMore(); refraction(); initMode();
    $$(document, '.seg').forEach(seg);
    document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
  }
  return { ease, clamp01, smooth, easeOut, words, prepare, seg, liquid, atmosphere, dock, setMode, init };
})();
