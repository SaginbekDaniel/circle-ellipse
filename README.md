# Circle & Ellipse — One Curve, Different Laws of the Universe

An interactive mathematical research presentation: one ellipse `x²/25 + y²/16 = 1` seen as geometry, linear algebra, optics,
billiard dynamics, orbital physics, probability and numerical analysis. 12 slides, no build step, no dependencies, no remote assets.

**Design identity: cinematic liquid mathematics** — obsidian canvas, midnight-navy depth, electric-blue light, liquid-glass instruments.

## Run
```bash
python3 -m http.server 8765      # any static server works
# open http://127.0.0.1:8765/index.html#7      (the #N hash deep-links to slide N)
```
Keys: `←/→` slides · `↑/↓` steps · `Space` play/pause · `R` reset · `D` Presentation ⇄ Research mode · `F` fullscreen · `N` notes ·
`P` presenter window · `M` audit mode · `O` overview · `A` appendix · `H` hide overlays · `?` help · `1–9 0 - =` jump.

## Deploy (GitHub Pages)
The site is plain static files. Publish the repository root (`index.html`, `css/`, `js/`, `fonts/`) from the branch Pages serves.
Nothing is deployed automatically from this branch; merge when you are satisfied.

## Test
```bash
node --test tests/engine.test.js                       # maths engine: byte-identity, golden snapshot, analytic invariants
python3 -m http.server 8765 & node tests/e2e.js        # 87 real-browser checks (needs Playwright); writes tests/e2e-results.json
```

## Architecture
| Layer | Files | Notes |
|---|---|---|
| Maths (protected) | `js/engine.js` | Pure functions. **Byte-identical to the pre-redesign engine** (SHA-256 asserted by a test) and covered by a golden snapshot. |
| App core | `js/core.js` | Slide registry, navigation, hash/keyboard, overlays, notes/audit/presenter, the one `requestAnimationFrame` loop, quality governor. |
| Presentation layer | `js/fx.js` | Atmosphere, liquid indicators, pointer light, idle dock, dock refraction, title reveals, Presentation/Research modes, easing helpers. |
| Slides | `js/slides-{a,b,c}.js`, `js/appendix.js` | Each slide: `layout`, `html`, `init/tick/audit/notes`. |
| Design system | `css/tokens.css` → `base.css` → `glass.css` → `motion.css` → `chrome.css` → `slides.css` | Tokens (colour, type scale, radii, durations, easing); controls; the glass material; motion language; dock/overlays; ten scene layouts. |

Key ideas
- **Liquid glass** (`glass.css`): tint body + pointer-following specular + masked 1px rim + inset depth + cast shadow; blur ≤ 16 px and only on small panes; opaque fallback without `backdrop-filter`. The dock additionally refracts its backdrop at the rim on Chromium (`backdrop-filter:url()` with a displacement map generated at runtime); text is never filtered.
- **Liquid motion**: selection indicators (dock, segmented controls) move leading-edge-first and stretch (`fx.liquid`); buttons/toggles/sliders use a `linear()` spring. Slide change = slow dolly (opacity + transform) with masked word-by-word title reveals and staggered panels.
- **Real morphing**: Lab/Rotation sliders set *targets*; the drawn `a, b, θ` glide toward them with frame-rate-independent smoothing, and every readout is computed from the **drawn** values. Slide 1 morphs the actual seeded Gaussian samples from the ellipse contour.
- **Two modes**: *Presentation* hides `.res` content (secondary measurements, notes, proofs) and keeps one visual focus; *Research* shows everything and opens every expandable panel. Switching only flips CSS — experiment state is untouched.
- **Performance**: large glows are stacked strokes (`bloomPath`), not filters; atmosphere layers are `vmin`-sized; a **quality governor** measures real frame time and sheds decoration in two steps (freeze light drift → drop backdrop blur/filters/grain). Simulation speed is time-based (`dt`), so it does not change with refresh rate (the 10 000-sample run takes ≈1.7 s at any fps).
- `prefers-reduced-motion`: no animations/transitions, no morphs, experiments start instantly.

## Evidence
`docs/screenshots/before-sheet.jpg` / `after-sheet.jpg` (all 12 slides each, 1920×1080 originals in `before/`, `after/`).
