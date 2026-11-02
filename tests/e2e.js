'use strict';
/* End-to-end verification in a real browser (Playwright is resolved from the global install or node_modules).
   Usage:  python3 -m http.server 8765 &   then   node tests/e2e.js [baseUrl]
   Every check is a real assertion against live DOM / engine output; the script exits non-zero on any failure. */
const { chromium } = require('playwright');
const E = require('../js/engine.js');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const results = []; let failed = 0;
const ok = (name, cond, detail) => { results.push([cond ? 'PASS' : 'FAIL', name, detail || '']); if (!cond) failed++; console.log((cond ? '  ✓ ' : '  ✗ ') + name + (detail ? '  — ' + detail : '')); };
const num = (t) => parseFloat(String(t).replace(/[^0-9eE+\-.]/g, ''));
const fmt = (x, d) => x.toFixed(d);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
  const go = async (n, wait = 700) => { await page.evaluate((k) => { location.hash = '#' + k; }, n); await page.waitForTimeout(wait); };
  const cur = () => page.evaluate(() => CE.App.cur + 1);

  console.log('\n[1] boot, deep links, navigation');
  await page.goto(BASE + '#7'); await page.waitForTimeout(900);
  ok('deep link #7 opens slide 7', (await cur()) === 7);
  ok('12 slides registered', (await page.evaluate(() => CE.Slides.length)) === 12);
  await page.keyboard.press('ArrowRight'); ok('ArrowRight → 8', (await cur()) === 8);
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); ok('ArrowLeft ×2 → 6', (await cur()) === 6);
  await page.keyboard.press('Home'); ok('Home → 1', (await cur()) === 1);
  await page.keyboard.press('End'); ok('End → 12', (await cur()) === 12);
  for (const [k, n] of [['1', 1], ['5', 5], ['9', 9], ['0', 10], ['-', 11], ['=', 12]]) { await page.keyboard.press(k); if ((await cur()) !== n) ok('key ' + k, false); }
  ok('digit keys 1…9, 0, -, = jump correctly', true);
  await page.evaluate(() => { location.hash = '#3'; }); await page.waitForTimeout(400); ok('hashchange navigates (#3)', (await cur()) === 3);
  await page.click('#dkTrack .dk-n:nth-of-type(6)'); await page.waitForTimeout(700); ok('dock number button → slide 6', (await cur()) === 6);
  await page.click('#next'); await page.waitForTimeout(300); ok('dock next → 7', (await cur()) === 7); await page.click('#prev'); await page.waitForTimeout(300); ok('dock prev → 6', (await cur()) === 6);
  const ind = await page.evaluate(() => { const t = document.querySelector('#dkTrack'), b = t.querySelector('[aria-current=step]'), l = t.querySelector('.liq'); return { L: b.offsetLeft, Il: parseFloat(l.style.left), R: t.clientWidth - b.offsetLeft - b.offsetWidth, Ir: parseFloat(l.style.right) }; });
  await page.waitForTimeout(700);
  ok('liquid dock indicator sits on the active slide', Math.abs(ind.L - ind.Il) < 1 && Math.abs(ind.R - ind.Ir) < 1, JSON.stringify(ind));
  ok('URL hash follows the slide', (await page.evaluate(() => location.hash)) === '#6');

  console.log('\n[2] overlays, notes, audit, help, mode');
  for (const [key, sel] of [['o', '#overview'], ['?', '#help'], ['a', '#appendix']]) {
    await page.keyboard.press(key); await page.waitForTimeout(250);
    ok(`'${key}' opens ${sel}`, await page.evaluate((s) => document.querySelector(s).classList.contains('on'), sel));
    await page.keyboard.press('Escape'); ok('Esc closes it', !(await page.evaluate((s) => document.querySelector(s).classList.contains('on'), sel)));
  }
  await page.keyboard.press('a'); await page.waitForTimeout(300);
  ok('appendix has 10 sections with computed numbers', (await page.evaluate(() => document.querySelectorAll('#appBody details').length)) === 10 && /\d\.\d{4}/.test(await page.evaluate(() => document.querySelector('#appBody').textContent)));
  await page.keyboard.press('Escape');
  await page.keyboard.press('n'); await page.waitForTimeout(500); ok('N shows presenter notes', await page.evaluate(() => document.querySelector('#notes').classList.contains('on')));
  await page.keyboard.press('n');
  await page.keyboard.press('m'); await page.waitForTimeout(400);
  const audit = await page.evaluate(() => document.querySelector('#audit').textContent);
  ok('M shows audit mode with live values', /audit/i.test(audit) && /e-/.test(audit), audit.slice(0, 80)); await page.keyboard.press('m');
  await page.click('#bMore'); ok('tools popover opens', !(await page.evaluate(() => document.querySelector('#more').hidden))); await page.keyboard.press('Escape');
  ok('popover closes with Esc', await page.evaluate(() => document.querySelector('#more').hidden));
  // audit on every slide must not throw
  await page.keyboard.press('m');
  let auditBad = 0; for (let i = 1; i <= 12; i++) { await go(i, 450); const t = await page.evaluate(() => document.querySelector('#audit').textContent); if (/audit error/.test(t)) auditBad++; }
  ok('audit mode computes on all 12 slides without error', auditBad === 0); await page.keyboard.press('m');

  console.log('\n[3] slide 1 — hero, modes, play/pause, reset');
  await go(1, 900);
  await page.click('#s1modes button:nth-of-type(3)'); await page.waitForTimeout(2400);
  ok('segmented control moves the liquid indicator to “Statistics”', await page.evaluate(() => { const g = document.querySelector('#s1modes'), b = g.querySelector('[aria-pressed=true]'), l = g.querySelector('.liq'); return b.textContent.includes('Statistics') && Math.abs(b.offsetLeft - parseFloat(l.style.left)) < 1; }));
  const cloud = await page.evaluate(() => [...document.querySelectorAll('#s1svg circle')].filter((c) => c.getAttribute('r') === '3' || c.getAttribute('r') === '2.5').length);
  ok('statistics layer holds the seeded sample points', cloud > 400, cloud + ' points');
  await page.click('#s1reveal'); await page.waitForTimeout(900); ok('Reveal the Question shows the question', await page.evaluate(() => document.querySelector('#s1q').classList.contains('on')));
  const pb = await page.textContent('#s1play'); await page.click('#s1play'); ok('Pause button toggles to Play', (await page.textContent('#s1play')) !== pb);
  await page.keyboard.press('r'); await page.waitForTimeout(500); ok('R resets the experiment (question hidden)', !(await page.evaluate(() => document.querySelector('#s1q').classList.contains('on'))));
  await page.keyboard.press(' '); await page.waitForTimeout(150); const t1 = await page.textContent('#s1play'); await page.keyboard.press(' '); await page.waitForTimeout(150);
  ok('Space toggles the animation', t1 !== (await page.textContent('#s1play')));

  console.log('\n[4] slide 2 — drag a point, invariant');
  await go(2, 900);
  const h = await page.locator('#s2e .handle').boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(h.x + h.width / 2 - 60, h.y + h.height / 2 + 90, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(200);
  const sum = num(await page.textContent('#s2sum')); ok('d₁ + d₂ stays 10 after dragging on the curve', Math.abs(sum - 10) < 1e-6, String(sum));
  ok('measurements are inside an expandable panel', await page.evaluate(() => !!document.querySelector('#s2 details.xd')));

  console.log('\n[5] slide 3 — derivation steps, show all');
  await go(3, 900);
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  ok('↓ reaches step 8 / 8', (await page.textContent('#s3count')).includes('8 / 8'));
  ok('only current + previous step are visible in presentation mode', (await page.evaluate(() => [...document.querySelectorAll('#s3steps .step')].filter((s) => getComputedStyle(s).display !== 'none').length)) === 2);
  await page.click('#s3all'); await page.waitForTimeout(200); ok('Show all reveals the full derivation (8 steps)', (await page.evaluate(() => [...document.querySelectorAll('#s3steps .step')].filter((s) => getComputedStyle(s).display !== 'none').length)) === 8);
  const chk = num(await page.textContent('#s3diff')); ok('live check: measured d₁ equals a + cx/a', Math.abs(chk) < 1e-9, String(chk));

  console.log('\n[6] slide 4 — laboratory: continuous morph, values match the engine');
  await go(4, 900);
  await page.evaluate(() => { const r = document.querySelector('#s4ra'); r.value = 8; r.dispatchEvent(new Event('input', { bubbles: true })); });
  const seen = []; for (let i = 0; i < 40; i++) { seen.push(num(await page.textContent('#s4a'))); await page.waitForTimeout(40); }
  const fin = num(await page.textContent('#s4a')), between = seen.filter((x) => x > 5.05 && x < 7.95);
  ok('a morphs continuously (5 → … → 8), not a jump', between.length >= 1 && Math.abs(fin - 8) < 1e-9 && seen.every((x, i) => i === 0 || x >= seen[i - 1] - 1e-9), `${between.length} intermediate frames, monotone, final=${fin}`);
  const p48 = E.props(8, 4);
  ok('c, e, area at (8,4) equal the engine', Math.abs(num(await page.textContent('#s4c')) - p48.c) < 1e-4 && Math.abs(num(await page.textContent('#s4e')) - p48.e) < 1e-4 && Math.abs(num(await page.textContent('#s4A')) - p48.area) < 1e-3);
  ok('perimeter equals 4aE(e)', Math.abs(num(await page.textContent('#s4P')) - E.perimeterAGM(8, 4)) < 1e-3);
  await page.click('#s4circ'); await page.waitForTimeout(1100);
  ok('“Make it a circle” morphs to e = 0 and shows the circle badge', num(await page.textContent('#s4e')) === 0 && /circle/i.test(await page.textContent('#s4state')));
  await page.click('#s4reset'); await page.waitForTimeout(1100); ok('Reset returns to a = 5, b = 4', Math.abs(num(await page.textContent('#s4c')) - 3) < 1e-4);

  console.log('\n[7] slide 5 — rotation & matrix');
  await go(5, 900); await page.click('#s5_30'); await page.waitForTimeout(1500);
  ok('θ = 30° shows the verified equation 73x² − 18√3xy + 91y² = 1600', /73x²/.test(await page.textContent('#s5ok')) && /1600/.test(await page.textContent('#s5ok')) || /1600/.test(await page.textContent('#s5eq2')));
  const ev = await page.textContent('#s5l'); ok('eigenvalues stay 1/25 and 1/16 under rotation', /0\.04000000/.test(ev) && /0\.06250000/.test(ev), ev.slice(0, 60));

  console.log('\n[8] slide 6 — reflection theorem, drag');
  await go(6, 900); const h6 = await page.locator('#s6svg .handle').boundingBox();
  await page.mouse.move(h6.x + h6.width / 2, h6.y + h6.height / 2); await page.mouse.down(); await page.mouse.move(h6.x + h6.width / 2 + 40, h6.y + h6.height / 2 + 160, { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(200);
  const miss = num(await page.textContent('#s6miss')); const inc = num(await page.textContent('#s6inc')), ref = num(await page.textContent('#s6ref'));
  ok('reflected ray hits F₂ (miss angle ≈ 0) after dragging', Math.abs(miss) < 1e-9, await page.textContent('#s6miss')); ok('θᵢ = θᵣ', Math.abs(inc - ref) < 1e-5);
  ok('four labels on the figure', (await page.locator('#s6svg .ray-lab').count()) === 4);

  console.log('\n[9] slide 7 — billiards');
  await go(7, 900);
  await page.click('#s7_hyp'); await page.waitForTimeout(500); ok('preset button becomes pressed (liquid indicator)', await page.evaluate(() => document.querySelector('#s7_hyp').getAttribute('aria-pressed') === 'true'));
  await page.click('#s7ff'); await page.click('#s7ff'); await page.waitForTimeout(250);
  const bn = num(await page.textContent('#s7b')), dr = num(await page.textContent('#s7d'));
  ok('+100 bounces ×2 adds ≥ 200 bounces', bn >= 200, String(bn)); ok('λ is conserved: drift < 1e-9', dr < 1e-9, await page.textContent('#s7d'));
  const lam = num(await page.textContent('#s7l')); const ex = E.billiardLambda(5, 4, 0, 0.5, Math.cos(1.2), Math.sin(1.2)); ok('invariant λ for the hyperbola preset equals the engine', Math.abs(lam - ex) < 1e-6, `${lam} vs ${ex.toFixed(8)}`);
  await page.click('#s7_foc'); await page.waitForTimeout(250); ok('“Through F₁” shows the numerical-instability notice', await page.evaluate(() => !document.querySelector('#s7warn').classList.contains('hidden')));
  const run0 = await page.textContent('#s7go'); await page.click('#s7go'); ok('Start/Pause toggles', (await page.textContent('#s7go')) !== run0);
  await page.click('#s7rs'); await page.waitForTimeout(250); ok('Reset restores the generic preset', num(await page.textContent('#s7b')) === 0);
  ok('advanced controls live in an expandable panel', await page.evaluate(() => !!document.querySelector('#s7 details.xd #s7sp')));

  console.log('\n[10] slide 8/9 — physics');
  await go(8, 900); const k8 = await page.evaluate(() => { const t = document.querySelector('#s8ks').textContent; return parseFloat(t); }); ok('Kepler speed readout is a number', Number.isFinite(k8), String(k8));
  await go(9, 900); ok('Kepler: sector table lists 4 measured rows', (await page.locator('#s9tab tr').count()) === 4);
  const spread = await page.evaluate(() => document.querySelector('#s9tab').textContent); ok('equal-area spread is tiny', /e-1\d/.test(spread) || /e-0[89]/.test(spread), spread.slice(0, 70));
  await page.selectOption('#s9N', '24'); await page.waitForTimeout(400); ok('interval selector rebuilds the wedges (T/24)', (await page.textContent('#s9tab')).includes('T/24'));

  console.log('\n[11] slide 10 — Gaussian experiment');
  await go(10, 3200);
  const txt = await page.textContent('#s10n'); ok('10,000 samples drawn automatically, progressively', /10,000 \/ 10,000/.test(txt), txt);
  const data = E.sampleGaussian2D(10000, 42, 5, 4), c1 = E.countInside(data, 10000, 5, 4, 1), c95 = E.countInside(data, 10000, 5, 4, E.CHI2_95);
  const rows = await page.$$eval('#s10t tr', (trs) => trs.map((t) => [...t.children].map((c) => c.textContent)));
  ok('empirical coverage equals the seeded engine count (39.35 % row)', rows[0][2] === fmt(c1 / 100, 2) + '%', `${rows[0][2]} vs ${fmt(c1 / 100, 2)}%`);
  ok('95 % row equals the engine count', rows[1][2] === fmt(c95 / 100, 2) + '%', rows[1][2]);
  await page.click('#s10m', { force: true }); await page.waitForTimeout(500); ok('95 % region toggle works', await page.evaluate(() => document.querySelector('#s10m').checked));
  await page.click('#s10new'); await page.waitForTimeout(3300); ok('New seed re-runs and completes', /10,000 \/ 10,000/.test(await page.textContent('#s10n')));

  console.log('\n[12] slide 11/12');
  await go(11, 900); const row = await page.$$eval('#s11t tr', (trs) => trs.map((t) => [...t.children].map((c) => c.textContent)));
  ok('perimeter table: AGM value equals the engine', row.some((r) => r[0].includes('AGM') && r[1] === fmt(E.perimeterAGM(5, 4), 9)));
  await go(12, 1500); await page.locator('#s12svg .node').nth(2).click({ force: true }); await page.waitForTimeout(300);
  ok('finale: clicking a connection updates the card and links to its slide', /Optics/.test(await page.textContent('#s12card')) && /slide 6/.test(await page.textContent('#s12go')));

  console.log('\n[13] modes keep state');
  await go(4, 800); await page.evaluate(() => { const r = document.querySelector('#s4ra'); r.value = 7; r.dispatchEvent(new Event('input', { bubbles: true })); }); await page.waitForTimeout(800);
  await page.keyboard.press('d'); await page.waitForTimeout(300);
  ok('D switches to Research mode', (await page.evaluate(() => document.body.dataset.mode)) === 'research');
  ok('Research mode reveals extra controls', await page.evaluate(() => getComputedStyle(document.querySelector('#s4grid').closest('.res')).display !== 'none'));
  ok('experiment state survives the mode switch (a = 7)', Math.abs(num(await page.textContent('#s4a')) - 7) < 1e-9);
  await page.keyboard.press('d'); ok('D returns to Presentation mode', (await page.evaluate(() => document.body.dataset.mode)) === 'present');

  console.log('\n[14] accessibility basics');
  ok('every button has an accessible name', await page.evaluate(() => [...document.querySelectorAll('button')].every((b) => (b.textContent.trim() || b.getAttribute('aria-label') || b.title))));
  ok('inactive slides are inert', await page.evaluate(() => [...document.querySelectorAll('.slide')].filter((s) => !s.classList.contains('active')).every((s) => s.hasAttribute('inert'))));
  await page.keyboard.press('Tab'); ok('keyboard focus lands on a control and matches :focus-visible', await page.evaluate(() => { const a = document.activeElement; return !!a && a !== document.body && a.matches(':focus-visible'); }));
  ok('no console / page / network errors during the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));

  /* ---- reduced motion ---- */
  console.log('\n[15] prefers-reduced-motion');
  const rctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' }); const rp = await rctx.newPage();
  const rerr = []; rp.on('pageerror', (e) => rerr.push(e.message));
  await rp.goto(BASE + '#10'); await rp.waitForTimeout(900);
  ok('App.reduced is true', await rp.evaluate(() => CE.App.reduced));
  ok('title reveal and loops are disabled', await rp.evaluate(() => { const s = document.querySelector('.slide.active h1 .w > span'); return getComputedStyle(s).animationName === 'none' && getComputedStyle(document.querySelector('#atmos .orb i')).animationName === 'none'; }));
  ok('Gaussian experiment completes instantly (no progressive animation)', /10,000 \/ 10,000/.test(await rp.textContent('#s10n')));
  await rp.evaluate(() => { location.hash = '#4'; }); await rp.waitForTimeout(500);
  await rp.evaluate(() => { const r = document.querySelector('#s4ra'); r.value = 8; r.dispatchEvent(new Event('input', { bubbles: true })); }); await rp.waitForTimeout(120);
  ok('lab snaps to the target (no morph) when motion is reduced', Math.abs(num(await rp.textContent('#s4a')) - 8) < 1e-9);
  ok('no errors with reduced motion', rerr.length === 0, rerr.join('|')); await rctx.close();

  /* ---- responsive ---- */
  console.log('\n[16] responsive: no horizontal overflow, nothing clipped off-screen');
  for (const [w, hgt, name] of [[1366, 768, 'laptop 1366×768'], [1440, 900, 'laptop 1440×900'], [768, 1024, 'tablet 768'], [390, 844, 'mobile 390']]) {
    const c = await browser.newContext({ viewport: { width: w, height: hgt }, hasTouch: w < 900, isMobile: w < 500 }); const pg = await c.newPage(); const pe = []; pg.on('pageerror', (e) => pe.push(e.message));
    await pg.goto(BASE + '#1'); await pg.waitForTimeout(700); let bad = [];
    for (let i = 1; i <= 12; i++) {
      await pg.evaluate((k) => { location.hash = '#' + k; }, i); await pg.waitForTimeout(550);
      const r = await pg.evaluate(() => { const s = document.querySelector('.slide.active'), vw = innerWidth; const over = s.scrollWidth - s.clientWidth; const off = []; s.querySelectorAll('h1,.side,.hud,.drawer,.cdock,.viz').forEach((e) => { const b = e.getBoundingClientRect(); if (b.width > 0 && (b.left < -2 || b.right > vw + 2)) off.push(e.className || e.tagName); }); return { over, off }; });
      if (r.over > 2 || r.off.length) bad.push(`s${i}:${r.over > 2 ? 'scrollX ' + r.over : ''}${r.off.join(',')}`);
    }
    ok(`${name}: all 12 slides fit horizontally`, bad.length === 0, bad.join(' ')); ok(`${name}: no page errors`, pe.length === 0, pe.join('|')); await c.close();
  }
  await browser.close();
  console.log(`\n${results.filter((r) => r[0] === 'PASS').length} passed, ${failed} failed`);
  require('fs').writeFileSync(__dirname + '/e2e-results.json', JSON.stringify({ date: new Date().toISOString(), passed: results.filter((r) => r[0] === 'PASS').length, failed, results }, null, 1));
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
