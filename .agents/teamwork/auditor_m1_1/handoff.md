# Forensic Integrity Audit Report: Milestone 1

- **Auditor**: `teamwork_auditor` (Forensic Integrity Auditor M1-1)
- **Target**: Milestone 1 (Independent Static Landing Web Service & /home Decoupling)
- **Work Product**: Commit `7c974408b`, `home.html`, `index.html`, `vite.config.ts`, `scripts/post-build.js`, `src/routes.ts`, `src/landing/`
- **Integrity Mode**: Development Mode (as specified in `ORIGINAL_REQUEST.md` line 440)
- **Verdict**: **CLEAN**

---

## 1. Observation

1. **Commit Inspection (`7c974408b`)**:
   - `git show --stat 7c974408b`:
     - Modified: `index.html`, `scripts/post-build.js`, `src/routes.ts`, `vite.config.ts`, `WORK_LOGS.md`
     - Created: `home.html`, `src/landing/index.ts`, `src/landing/styles/landing.css`
     - Total diff: 12 files changed, 1,261 insertions(+), 272 deletions(-)
     - Git status: `On branch main. Your branch is ahead of 'origin/main' by 4 commits.` No remote push executed (strictly compliant with `/git-push` rule).

2. **Entry Points & Physical Decoupling (`index.html` vs `home.html`)**:
   - `index.html` (814 lines, 43,451 bytes):
     - Line 718–726:
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
     - Fully purged of Leaflet CSS, `#root:empty` React splash styles, React watchdog timer, and `/src/main.tsx`.
     - Canonical tag: `<link rel="canonical" href="https://snshero.com/" />` (Line 690).
   - `home.html` (869 lines, 45,291 bytes):
     - Line 720–781:
       ```html
       <style> ... #root:empty { ... } </style>
       <script> ... window.__SNSHERO_CLEAR_WATCHDOG__ = ... </script>
       <script type="module" src="/src/main.tsx"></script>
       </head>
       <body>
         <div id="root"></div>
       ```
     - Preserves all Leaflet CSS, `#root:empty` splash styles, watchdog script, and mounts `/src/main.tsx` into `<div id="root"></div>`.
     - Canonical tag: `<link rel="canonical" href="https://snshero.com/home" />` (Line 690).

3. **Vite MPA Rollup & Dev Middleware (`vite.config.ts`)**:
   - Lines 50–73:
     ```typescript
     name: 'mpa-dev-rewrite-plugin',
     configureServer(server: any) {
       server.middlewares.use((req: any, _res: any, next: any) => {
         if (!req.url) return next();
         const [pathname, search] = req.url.split('?');
         const query = search ? `?${search}` : '';
         if (pathname === '/home' || pathname === '/home/') {
           req.url = `/home.html${query}`;
         }
         next();
       });
     },
     ```
   - Lines 713–716:
     ```typescript
     rollupOptions: {
       input: {
         main: path.resolve(process.cwd(), 'index.html'),
         home: path.resolve(process.cwd(), 'home.html'),
       },
     ```
   - Line 722: `if (id.includes('src/landing')) return undefined;` (ensures `src/landing` code remains standalone and does not trigger vendor bundling).

4. **Post-Build Pipeline (`scripts/post-build.js`)**:
   - Lines 18–33: Automatically detects entry script by checking `dist/home.html` first (matching `home-*.js`).
   - Line 108: `const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;`
   - Lines 199–202: `for (const route of routes) { if (route === '' || route === '/' || route === 'index') continue; ... }`
   - Route preservation: `dist/index.html` is strictly guarded and never overwritten. `dist/home.html` and `dist/home/index.html` are generated and verified identical (`diff dist/home.html dist/home/index.html` returned 0 diff).
   - Line 246–249: `dist/404.html` is generated from `home.html` to support deep SPA client-side routing.

5. **Client Router Alignment (`src/routes.ts` & `src/App.tsx`)**:
   - `src/routes.ts`:
     - Line 22: `VIEW_ROUTES.home.path = '/home'`, `aliases: ['/home', '/main-lobby']`.
     - Line 424: `getViewPath(view: ViewType)` fallback returns `'/home'`.
     - Line 463: `if (cleanPath === '/home') return 'home';`
   - `src/App.tsx`:
     - Line 1819: `let targetPath = getViewPath(view);`
     - Line 1853: `window.history.pushState({ view }, '', targetPath);`
     - The game SPA now pushes `'/home'` into browser history instead of `'/'`, preventing URL collisions with the static landing page.

6. **Static Analysis for Prohibited Integrity Patterns**:
   - Hardcoded test outputs: Searched for fixed pass/fail or mock strings across `src/landing/` and root files — 0 found.
   - Facade implementations: `src/landing/index.ts` mounts a genuine DOM element with `#landing-root`, styled with `src/landing/styles/landing.css`, and provides a functional `<a href="/home">` link.
   - Pre-populated artifacts: Examined workspace for rogue `.log` or `.result` files predating the run — 0 found.

7. **Independent Build & Test Reproduction**:
   - `npx tsc --noEmit`: Executed cleanly with exit code 0 (0 type errors).
   - `npm run build`: Executed cleanly with exit code 0 in 33.78s.
   - Bundle analysis:
     - `dist/index.html`: References solely `./assets/main-DFC6NrKW.js` (1.09 KB) and `./assets/main-xkn4ezGR.css`.
     - `grep -E "home-|vendor-react|vendor-tensorflow|vendor-firebase" dist/index.html`: 0 matches (exit code 1).
     - `dist/home.html`: References `/assets/home-YLwOh41j.js` (648.42 KB) and all vendor chunks (`vendor-react-DjkHO9yN.js`, `vendor-firebase`, `data-i18n`, etc.).
   - E2E Test Suite (`npx tsx tests/e2e/run_all.ts --milestone M1`):
     - Total Assertions: 9 / 9 PASSED (100% pass rate in 0.06s).
       - `T1.MPA.1`: Root index.html Static Landing Entry (PASS)
       - `T1.MPA.2`: Separate home.html Game SPA Entry (PASS)
       - `T1.MPA.3`: Vite Multi-Page Rollup Inputs (PASS)
       - `T1.MPA.4`: Post-Build Route Preservation Script (PASS)
       - `T1.MPA.5`: Router Decoupling / vs /home (PASS)
       - `T2.B3.1`: Trailing Slash & /home Resolution (PASS)
       - `T2.B3.2`: Invalid Route Graceful Fallback (PASS)
       - `T2.B7.1`: Static Offline Host Zero External Call Integrity (PASS)
       - `T3.C1.4`: Dual Routing Independence (/ Landing vs /home Game SPA) (PASS)

---

## 2. Logic Chain

1. From Observation 1 & 2: By physically creating `home.html` containing the React 19 entry points (`/src/main.tsx` and `#root`) and changing `index.html` to load `/src/landing/index.ts` and `#landing-root`, the repository establishes two separate, genuine HTML entry documents with distinct canonical targets (`/` and `/home`).
2. From Observation 3: Rollup's multi-entry configuration (`input: { main: 'index.html', home: 'home.html' }`) and the manual chunk isolation of `src/landing` force Vite to construct two disjoint dependency graphs. The `main` graph imports 0 React or heavy dependencies, generating an ultra-lightweight 1.09 KB JavaScript payload.
3. From Observation 4: `scripts/post-build.js` dynamically identifies `home.html` as the base template for all 59 SPA subroutes and `404.html`, while explicitly skipping `''`, `'/'`, and `'index'`. This guarantees that `dist/index.html` is never overwritten by post-build scripts and remains purely static.
4. From Observation 5: Re-aligning `VIEW_ROUTES.home.path = '/home'` and `getViewPath(view)` prevents the React application from overwriting the browser address bar with `'/'` during view transitions, ensuring client-side navigation stability.
5. From Observation 6: Static analysis proves that the implementation contains no hardcoded test mocks, bypass logic, or fabricated results.
6. From Observation 7: The independent execution of `npx tsc --noEmit` and `npm run build` completed with exit code 0. Inspection of the resulting `dist/` directory empirically verifies that `dist/index.html` contains 0 references to React, TensorFlow, or Firebase, while `dist/home.html` loads the complete interactive game. All Milestone 1 E2E tests pass 100%.

---

## 3. Caveats

- Milestone 1 encompasses solely the foundational dual-entry architecture, MPA decoupling, and route splitting (Features 1–5 in `PROJECT.md`).
- Detailed UI components in `src/landing/` (Header, Sidebar, Modals, 5 Core Sections, and Card Nurture engine) currently exist as valid bootstrap shells in `src/landing/index.ts` and are scheduled for comprehensive implementation in Milestones 2 and 3.
- The 32 failing assertions in `run_all.ts` across Milestones M2 and M3 represent planned future scope and correctly track unimplemented files.

---

## 4. Conclusion

**Verdict: CLEAN**

Milestone 1 satisfies all functional, architectural, and integrity requirements:
- Zero integrity violations detected under Development Mode.
- Physical entry separation between static landing (`index.html`) and game SPA (`home.html`) is genuine, robust, and reproducible.
- Production build delivers an ultra-lightweight root landing bundle (1.09 KB JS) with zero heavy runtime dependencies.
- SPA routes, deep links, dev-server rewrites, and 404 fallbacks operate with complete independence.

---

## 5. Verification Method

To independently reproduce the forensic verification:

```bash
# 1. Type check
npx tsc --noEmit
# Expected: exit code 0

# 2. Production build
npm run build
# Expected: exit code 0, post-build detects home.html

# 3. Assert bundle isolation on disk
grep -q "vendor-react" dist/index.html && echo "FAIL: React in index.html" || echo "PASS: index.html is ultra-light"
grep -q "/src/landing/index.ts" index.html && echo "PASS: index.html loads landing entry"
grep -q "/src/main.tsx" home.html && echo "PASS: home.html loads main.tsx"
grep -q "vendor-react" dist/home.html && echo "PASS: home.html loads vendor-react"
diff -u dist/home.html dist/home/index.html && echo "PASS: dist/home/index.html matches dist/home.html"

# 4. Run Milestone 1 E2E assertions
npx tsx tests/e2e/run_all.ts --milestone M1
# Expected: 9/9 assertions PASS (100%)
```
