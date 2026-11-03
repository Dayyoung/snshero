# Challenger Handoff Report — Milestone 1: Independent Static Landing & /home Decoupling

- **Agent**: `teamwork_challenger` (`challenger_m1_1`)
- **Archetype**: EMPIRICAL CHALLENGER (critic, specialist)
- **Target**: Milestone 1 Implementation by `worker_m1` (Commit `7c974408b776f7855630f5ae13a018fab90183f2`)
- **Parent**: Orchestrator (`7b342c7a-1d74-43d7-a388-5ffc926b3969`)
- **Date**: 2026-11-02T04:05:00Z
- **Verdict**: **APPROVE**

---

## Challenge Summary

- **Overall risk assessment**: **LOW**
- **Empirical Probe Suite**: `tests/challenger_m1_adversarial.ts` (52 assertions executed)
- **Empirical Pass Rate**: **100.0% (52/52 Passed, 0 Failed)**
- **M1 E2E Test Suite**: `tests/e2e/run_all.ts --milestone M1` (9 assertions, 100% Passed)
- **TypeScript Strict Check**: `npx tsc --noEmit` (Exit code 0, 0 errors)
- **Production Build**: `npm run build` (Exit code 0)

---

## 1. Observation

### 1.1 DOM Isolation & Source Separation
- `index.html` (lines 725–728):
  ```html
  <script type="module" src="/src/landing/index.ts"></script>
  </head>
  <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
    <div id="landing-root"></div>
  ```
  Verified: Contains `<div id="landing-root"></div>`. Contains zero instances of `<div id="root">`. Strictly references `/src/landing/index.ts` and does not import `/src/main.tsx`.
- `home.html` (lines 765–770):
  ```html
  <script type="module" src="/src/main.tsx"></script>
  </head>
  <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
    <div id="root"></div>
  ```
  Verified: Contains `<div id="root"></div>`. Contains zero instances of `<div id="landing-root">`. Strictly references `/src/main.tsx` and does not import `/src/landing/index.ts`.

### 1.2 Route Boundaries & Live HTTP Server Verification (Port 3000)
Live HTTP probe requests executed via Node.js HTTP client against running preview server (`vite preview --host 0.0.0.0 --port 3000`):
1. `GET http://localhost:3000/` -> HTTP 200, served HTML containing `<div id="landing-root"></div>` and entry script `assets/main-DFC6NrKW.js`.
2. `GET http://localhost:3000/index.html` -> HTTP 200, served HTML containing `<div id="landing-root"></div>` and entry script `assets/main-DFC6NrKW.js`.
3. `GET http://localhost:3000/home` -> HTTP 200, served HTML containing `<div id="root"></div>` and entry script `assets/home-YLwOh41j.js`.
4. `GET http://localhost:3000/home/` -> HTTP 200, served HTML containing `<div id="root"></div>` and entry script `assets/home-YLwOh41j.js`.
5. `GET http://localhost:3000/home.html` -> HTTP 200, served HTML containing `<div id="root"></div>` and entry script `assets/home-YLwOh41j.js`.
6. `GET http://localhost:3000/home?ref=twitter&tab=deck` -> HTTP 200, query string safely preserved, served SPA HTML.
7. `GET http://localhost:3000/deck` -> HTTP 200, served static `dist/deck/index.html` containing `<div id="root"></div>` and `assets/home-YLwOh41j.js`.
8. `GET http://localhost:3000/deck/` -> HTTP 200, served static `dist/deck/index.html`.
9. `GET http://localhost:3000/shop` -> HTTP 200, served static `dist/shop/index.html`.
10. `GET http://localhost:3000/play` -> HTTP 200, served static `dist/play/index.html`.

### 1.3 Bundle Footprint & Dependency Isolation
File size and AST inspection of `dist/index.html` and its linked assets:
- `dist/index.html`: 43,549 bytes (HTML document, preserving 7 JSON-LD schemas and SEO metadata).
- `dist/assets/main-DFC6NrKW.js`: 1,120 bytes.
- `dist/assets/types-B5Qt9EMX.js`: 711 bytes (Vite modulepreload helper).
- **Total JavaScript Footprint for Landing**: **1,831 bytes (~1.79 KB)**.
- Budget Requirement: `< 50 KB` (`51,200 bytes`).
- Margin: **48.21 KB under budget** (landing uses only 3.58% of the budget).
- Runtime Scan: Zero occurrences of `vendor-react`, `vendor-tensorflow`, `vendor-firebase`, or `vendor-motion` in `dist/index.html` or its referenced bundles.

### 1.4 Post-Build Static Route Generator Integrity
- `scripts/post-build.js` lines 105–112:
  ```javascript
  const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;
  if (fs.existsSync(spaTemplatePath)) {
    console.log(`[post-build] Using SPA base template: ${spaTemplatePath}`);
    const baseHtml = fs.readFileSync(spaTemplatePath, 'utf8');
  ```
  Verified: Generated all 59 static subroute directories (including `/home/index.html`, `/deck/index.html`, `/shop/index.html`, `/play/index.html`), while preserving `dist/index.html` as the pure static landing page.
- `dist/404.html` was generated from `dist/home.html` (46,041 bytes), ensuring static web hosts (GitHub Pages, Cloudflare Pages, S3) direct unmatched deep links into the full React game router.

---

## 2. Logic Chain

1. **Physical Decoupling (Observation 1.1)**: By splitting root HTML into `index.html` (`#landing-root` -> `src/landing/index.ts`) and `home.html` (`#root` -> `src/main.tsx`), the build toolchain calculates two non-intersecting entry trees. No React or heavy runtime code leaks into the landing bundle.
2. **Mount Isolation (Observation 1.1)**: `src/landing/index.ts` targets `#landing-root`, with fallback precedence. `src/main.tsx` targets `#root` (`createRoot(document.getElementById('root')!)`). Because `index.html` lacks `#root` and `home.html` lacks `#landing-root`, concurrent DOM collisions or double-renders are physically prevented at the document level.
3. **Route Handling & Live Serving (Observation 1.2)**: In `vite.config.ts`, `mpa-dev-rewrite-plugin` intercepts `/home` and `/home/` and rewrites them to `/home.html`. In `scripts/post-build.js`, static subroute folders (`dist/home/index.html`, `dist/deck/index.html`, etc.) are pre-generated from `dist/home.html`. As proven by our live HTTP probes on port 3000, both root `/` and `/index.html` serve the landing page, while `/home`, `/home/`, `/deck`, `/shop`, `/play` serve the game SPA with zero 404s or infinite loops.
4. **Extreme Performance (Observation 1.3)**: The total JS payload required to render `dist/index.html` is 1,831 bytes (~1.79 KB), easily beating the <50 KB budget.
5. **Type Safety & Build Cleanliness (Observation 1.4)**: `tsc --noEmit` and `npm run build` completed with exit code 0, confirming no type regressions across the repository.

---

## 3. Caveats

- **Dev Server Subroute Fallback**: On Vite's dev server (`npm run dev`), unknown routes not explicitly covered by middleware fall back to `index.html` (the landing page). The worker provided dev middleware rewriting for `/home` and `/home/`. In production builds and preview server (`dist/`), this is a non-issue because all 59 subroutes (`/deck`, `/shop`, `/play`, etc.) are pre-rendered as physical directory `index.html` files by `scripts/post-build.js`.
- **Milestone Scope**: UI components for the landing page (Header, Sidebar, Modals, 5 Core Sections, Card Nurturing) are intentionally stubbed with a minimal functional bootstrap layout in `src/landing/index.ts`, as their full implementation is scheduled for Milestones 2 and 3.

---

## 4. Conclusion & Verdict

**Verdict**: **APPROVE**

Milestone 1 successfully delivers a rock-solid, dual-entry static architecture:
- Standalone landing page at `/` and `/index.html` with zero heavy runtimes (1.79 KB JS total).
- Decoupled game SPA at `/home` and `/home.html` with full React 19 engine.
- Complete route isolation and verified live HTTP serving on port 3000.
- All 52 adversarial probes and 9 M1 E2E tests pass with 100% success.

---

## 5. Verification Method

To independently verify these findings:

```bash
# 1. Run the empirical adversarial challenger probe suite (52 probes)
npx tsx tests/challenger_m1_adversarial.ts

# 2. Run the master E2E test suite for Milestone 1 (9 assertions)
npx tsx tests/e2e/run_all.ts --milestone M1

# 3. Verify TypeScript type safety
npx tsc --noEmit

# 4. Probe live HTTP endpoints (while preview server is running on :3000)
curl -s http://localhost:3000/ | grep "landing-root" && echo "PASS: / serves landing"
curl -s http://localhost:3000/home | grep 'id="root"' && echo "PASS: /home serves SPA"
curl -s http://localhost:3000/deck | grep 'id="root"' && echo "PASS: /deck serves SPA"

# 5. Measure landing JavaScript bundle size
node -e '
const fs = require("fs");
const path = require("path");
const scripts = ["dist/assets/main-DFC6NrKW.js", "dist/assets/types-B5Qt9EMX.js"];
const total = scripts.reduce((acc, f) => acc + (fs.existsSync(f) ? fs.statSync(f).size : 0), 0);
console.log(`Landing JS Total: ${total} bytes (${(total / 1024).toFixed(2)} KB) - Budget < 51,200 bytes`);
'
```

**Invalidation conditions**:
- Any React or heavy library script (`vendor-react`, `vendor-tensorflow`, `vendor-firebase`) appears in `dist/index.html`.
- `GET http://localhost:3000/` fails to serve `#landing-root` or `GET http://localhost:3000/home` fails to serve `#root`.
- Total JavaScript size for `dist/index.html` exceeds 50 KB (51,200 bytes).
