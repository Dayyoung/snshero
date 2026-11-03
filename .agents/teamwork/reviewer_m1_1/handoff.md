# Milestone 1: Reviewer & Adversarial Critic Report

- **Reviewer**: `teamwork_reviewer` (Instance 1)
- **Roles**: reviewer, critic
- **Target**: Milestone 1 Deliverables (`worker_m1`) — Static Architecture & MPA Decoupling
- **Date**: 2026-11-02T04:03:00Z
- **Verdict**: **APPROVE**

---

## 1. Observation

1. **Independent Verification Execution**:
   - `npx tsc --noEmit`: Exited with code 0 (0 TypeScript errors).
   - `npm run build`: Exited with code 0 in 35.59s. Generated dual HTML entries (`dist/index.html` and `dist/home.html`), 59 static SPA fallback routes, and `dist/404.html`.
   - `npx tsx tests/e2e/run_all.ts --milestone M1`:
     ```text
     === [TIER 1] Feature Coverage & Interface Contracts ===
       [T1.MPA.1] [M1] Root index.html Static Landing Entry                 ✓ PASS (15.5ms)
       [T1.MPA.2] [M1] Separate home.html Game SPA Entry                    ✓ PASS (7.7ms)
       [T1.MPA.3] [M1] Vite Multi-Page Rollup Inputs                        ✓ PASS (1.1ms)
       [T1.MPA.4] [M1] Post-Build Route Preservation Script                 ✓ PASS (0.1ms)
       [T1.MPA.5] [M1] Router Decoupling / vs /home                         ✓ PASS (0.7ms)

     === [TIER 2] Boundary Value Analysis & Corner Cases ===
       [T2.B3.1] [M1] Trailing Slash & /home Resolution                    ✓ PASS (0.2ms)
       [T2.B3.2] [M1] Invalid Route Graceful Fallback                      ✓ PASS (0.1ms)
       [T2.B7.1] [M1] Static Offline Host Zero External Call Integrity     ✓ PASS (1.3ms)

     === [TIER 3] Pairwise Combinations & State Machine ===
       [T3.C1.4] [M1] Dual Routing Independence (/ Landing vs /home Game SPA) ✓ PASS (0.4ms)
     ----------------------------------------------------------------------
     Total Assertions Run : 9 | Passed : 9 | Failed : 0 | Pass Rate : 100.0%
     ```

2. **Bundle & Asset Weight Isolation Inspection**:
   - `dist/index.html` scripts inspection:
     - `grep -c "vendor-react" dist/index.html` returned `0`.
     - `grep -c "home-" dist/index.html` returned `0`.
     - Script tag: `<script type="module" crossorigin src="./assets/main-DFC6NrKW.js"></script>` (1,120 bytes).
     - Polyfill preload: `<link rel="modulepreload" crossorigin href="./assets/types-B5Qt9EMX.js">` (711 bytes).
     - Total initial JavaScript execution footprint on `/`: **1,831 bytes (~1.8 KB)**.
     - Zero references to React 19, TensorFlow, Motion, Firebase, or heavy novel/webtoon datasets.
   - `dist/home.html` scripts inspection:
     - Script tag: `<script type="module" crossorigin src="/assets/home-BUegtVJO.js"></script>` (648.42 KB).
     - Module preloads: `vendor-react` (194.35 KB), `vendor-firebase` (334.62 KB), `data-i18n` (3,600.64 KB), `vendor-motion` (129.32 KB), `vendor-icons` (109.82 KB).
     - Full interactive game engine correctly loaded.

3. **Physical Entry Separation (`index.html` vs `home.html`)**:
   - `index.html`:
     - Lines 718–726:
       ```html
       <!-- Static Landing Stylesheet -->
       <link rel="stylesheet" href="/src/landing/styles/landing.css" />
       <style>
         body { margin: 0; background-color: #fdfcfc; color: #201d1d; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
       </style>
       <script type="module" src="/src/landing/index.ts"></script>
     </head>
     <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
       <div id="landing-root"></div>
       ```
     - All pre-existing SEO tags, OpenGraph, Twitter cards, 12-language hreflang links, and 7 JSON-LD schemas remain intact.
   - `home.html`:
     - Preserves all game prerequisites: Leaflet CSS, `#root:empty` loading splash, boot watchdog timer, `<script type="module" src="/src/main.tsx"></script>`, and `<div id="root"></div>`.
     - Canonical & OG URL correctly aligned to `https://snshero.com/home`.

4. **Vite Configuration & Dev/Preview Middleware (`vite.config.ts`)**:
   - Lines 50–73: `mpa-dev-rewrite-plugin` added to both `configureServer` and `configurePreviewServer`. Intercepts requests where `pathname === '/home' || pathname === '/home/'` and rewrites to `/home.html${query}`, preserving query parameters.
   - Lines 585–587: Excludes `/home` and `/home.html` from `public-wildcard-static-plugin` to prevent wildcard collision.
   - Lines 713–716: `rollupOptions.input` explicitly configured with:
     ```typescript
     input: {
       main: path.resolve(process.cwd(), 'index.html'),
       home: path.resolve(process.cwd(), 'home.html'),
     }
     ```
   - Line 722: `if (id.includes('src/landing')) return undefined;` in `manualChunks` ensures clean chunk isolation without bundling landing code into game chunks.

5. **Post-Build Route Preservation (`scripts/post-build.js`)**:
   - Line 108: `spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;`
   - Lines 158–165: `ensureAbsoluteAssetPaths` function transforms relative `./assets/` to absolute `/assets/` so deep/nested subroute pages (`dist/home/index.html`, `dist/deck/index.html`, `dist/play/index.html`) correctly resolve assets.
   - Lines 200–202: Explicitly skips `''`, `'/'`, and `'index'` in route iteration, completely preserving `dist/index.html` as the pure static landing page.
   - Line 246–250: Generates `dist/404.html` from `homeHtmlPath` so deep links and client routing resolve to the game SPA router.

6. **Router Mapping (`src/routes.ts`)**:
   - `VIEW_ROUTES.home.path = '/home'` with aliases `['/home', '/main-lobby']`.
   - `getViewPath(view)` fallback returns `'/home'`.
   - `getViewFromPath`: `cleanPath === '/home'` returns `'home'`. Path `'/'` is cleanly decoupled from `'home'`.

---

## 2. Logic Chain

1. **Physical Decoupling (Observation 3 → R1, R2)**:
   By establishing `home.html` containing `/src/main.tsx` and `#root`, and refactoring `index.html` to load `/src/landing/index.ts` and `#landing-root`, the root URL `/` and the game lobby `/home` are physically isolated into separate documents at the source level.
2. **Bundle Weight Reduction & Isolation (Observation 2 & 4 → R1)**:
   Configuring Vite with two independent Rollup inputs (`main` and `home`) and keeping `src/landing` unchunked allows Rollup to generate two distinct dependency graphs. Because `src/landing/index.ts` imports only vanilla CSS without React, TensorFlow, or state libraries, `dist/index.html` requires only 1.8 KB of JS, achieving a >99.9% reduction in initial payload compared to the ~10 MB total game bundle.
3. **Dev and Preview Parity (Observation 4 → R1, R5)**:
   The `mpa-dev-rewrite-plugin` ensures that developers running `npm run dev` or `npm run preview` can access `/home` and `/home/` seamlessly, receiving `home.html` without 404s, while preserving URL queries (`?view=deck`, etc.).
4. **Static Route Preservation & Deep Linking (Observation 5 → R1, R5)**:
   `scripts/post-build.js` safeguards `dist/index.html` from being overwritten by SPA generation loops, while correctly using `dist/home.html` as the template for all 59 SPA routes (`dist/deck/index.html`, `dist/home/index.html`, etc.) and `dist/404.html`. Replacing relative paths with `/assets/` prevents 404 asset failures on nested routes.
5. **Client-Side History State Decoupling (Observation 6 → R1, R4)**:
   Updating `VIEW_ROUTES.home.path` to `'/home'` ensures that whenever the React SPA syncs the view state to `window.location`, it pushes `'/home'` instead of `'/'`, preventing the browser from inadvertently reverting to the static landing page during SPA navigation.
6. **Integrity & Verification Audit (Observation 1)**:
   All verification commands were executed independently. There are no dummy mocks, hardcoded test branches, or fabricated outputs. All 9 Milestone 1 E2E assertions pass legitimately.

---

## 3. Caveats

1. **Landing UI Shell Scope**:
   Milestone 1 delivered the structural MPA decoupling, bundler configuration, and routing architecture. The full UI components within `src/landing/` (Header, Sidebar, Modals, 5 Core Sections, Card Nurturing store) are currently minimal bootstrap placeholders and will be comprehensively implemented in Milestones 2 and 3 as defined in `PROJECT.md`.
2. **Dev Server Subroute Fallback**:
   In local development (`vite dev`), direct navigation to `/home` is rewritten to `/home.html`. Directly requesting unlisted subroutes like `/deck` in dev server may hit Vite's default SPA fallback (`index.html`) unless accessed via `/home?view=deck` or until dev middleware adds broader route rewrites if needed. In production (`dist/`), this is completely resolved by physical directory generation (`dist/deck/index.html`, etc.) and `dist/404.html`.
3. **Working Tree Cleanliness**:
   A few untracked files and working tree edits from previous surveys and background generators exist in `.agents/teamwork/` and `public/`, but these do not interfere with the Milestone 1 codebase.

---

## 4. Conclusion

**Verdict: APPROVE**

Worker M1 has completely, cleanly, and robustly satisfied all requirements for **Milestone 1: Static Architecture & MPA Decoupling** (`ORIGINAL_REQUEST.md ## 2026-11-02T03:18:46Z` and `PROJECT.md` Features 1–5):
- Root (`/` and `index.html`) is an ultra-lightweight standalone static entry (1.8 KB JS, 0 heavy SPA dependencies).
- Game SPA (`/home` and `home.html`) is fully preserved and decoupled with all 59 SPA subroutes and `404.html` generated cleanly.
- Bundler (`vite.config.ts`), post-build generator (`scripts/post-build.js`), and router (`src/routes.ts`) operate with 100% contract compliance.
- Zero integrity violations detected. TypeScript compilation, production build, and E2E milestone test suites pass with 0 errors.

---

## 5. Verification Method

To independently reproduce this verification:

```bash
# 1. TypeScript type check
npx tsc --noEmit

# 2. Production build
npm run build

# 3. Progressive E2E Milestone 1 test runner
npx tsx tests/e2e/run_all.ts --milestone M1

# 4. Independent bundle isolation checks
grep -c "vendor-react" dist/index.html  # Must return 0
grep -c "home-" dist/index.html         # Must return 0
grep -q "/src/landing/index.ts" index.html && echo "PASS: index loads landing"
grep -q "/src/main.tsx" home.html && echo "PASS: home loads main.tsx"
test -f dist/home/index.html && echo "PASS: dist/home/index.html exists"
test -f dist/home.html && echo "PASS: dist/home.html exists"
```

**Invalidation Conditions**:
- `dist/index.html` references `vendor-react` or any TensorFlow/Motion/Firebase bundle chunk.
- `npx tsc --noEmit` or `npm run build` exits with a non-zero exit code.
- `npx tsx tests/e2e/run_all.ts --milestone M1` reports any failed assertions.
