# Milestone 1: Handoff Report — Static Architecture & MPA Decoupling

- **Worker**: `teamwork_worker` (Milestone 1 Implementation)
- **Date**: 2026-11-02T03:53:00Z
- **Parent**: Orchestrator (`7b342c7a-1d74-43d7-a388-5ffc926b3969`)
- **Status**: Complete (Hard Handoff)

---

## 1. Observation

1. **`home.html` Created**:
   - Location: `/Users/dayyoung/project/snshero/home.html` (869 lines, 45,291 bytes).
   - Verbatim content: Contains `<title>눈히어로.com - 카단의 여정 (SNSHero.com - Kadan's Journey) | 원클릭 AI 웹 카드 게임 & 공식 웹소설·웹툰</title>`, `<link rel="canonical" href="https://snshero.com/home" />`, `<meta property="og:url" content="https://snshero.com/home" />`, Leaflet CSS (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`), React splash styles (`#root:empty`), watchdog script (`hero_boot_retries`), `<script type="module" src="/src/main.tsx"></script>`, and `<div id="root"></div>`.

2. **`index.html` Refactored**:
   - Location: `/Users/dayyoung/project/snshero/index.html` (812 lines).
   - Verbatim content: Lines 718–727 replaced with:
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
   - All GA4, Google Ads, AdSense, OpenGraph, Twitter, multi-lingual hreflang (12 languages + x-default), and 7 JSON-LD schemas were completely preserved.

3. **`src/landing/styles/landing.css` & `src/landing/index.ts` Created**:
   - `src/landing/styles/landing.css`: `@import "tailwindcss";` with `--landing-cream: #fdfcfc;`, `--landing-ink: #201d1d;`, `--landing-line: rgba(15, 0, 0, 0.12);`, and JetBrains Mono monospace body font.
   - `src/landing/index.ts`: Lightweight vanilla bootstrap code mounting `#landing-root` with an initial valid layout linking to `/home`.

4. **`vite.config.ts` Multi-Page Configuration & Dev Middleware**:
   - `plugins`: Added `mpa-dev-rewrite-plugin` for `configureServer` and `configurePreviewServer` to rewrite `/home` and `/home/` to `/home.html`.
   - `build.rollupOptions.input`:
     ```typescript
     input: {
       main: path.resolve(process.cwd(), 'index.html'),
       home: path.resolve(process.cwd(), 'home.html'),
     }
     ```
   - `manualChunks`: Added `if (id.includes('src/landing')) return undefined;` to isolate landing chunks.
   - Public wildcard middleware: Excluded `/home` and `/home.html` from candidate file match.

5. **`scripts/post-build.js` Template Decoupling**:
   - Entry script detection: Checks `dist/home.html` first for `home-*.js`, then `dist/index.html`.
   - Template selection: Uses `spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;` to generate all 59 SPA routes (`dist/deck/index.html`, `dist/play/index.html`, `dist/shop/index.html`, etc.) and `dist/home/index.html`.
   - Route safety: Skips `''`, `'/'`, and `'index'` so `dist/index.html` is 100% preserved as the static landing page.
   - Fallback `dist/404.html`: Copied from `spaTemplatePath` (`dist/home.html`).

6. **`src/routes.ts` Route Mapping**:
   - `VIEW_ROUTES.home.path = '/home'`, `aliases: ['/home', '/main-lobby']`.
   - `getViewPath(view)` fallback returns `'/home'`.
   - `getViewFromPath(pathname, search)`: `cleanPath === '/home'` returns `'home'`. Path `'/'` is cleanly decoupled.

7. **Compilation & Bundle Isolation Results**:
   - `npx tsc --noEmit`: Exit code 0 (0 errors).
   - `npm run build`: Exit code 0.
   - `dist/index.html` referenced assets:
     - `assets/main-DFC6NrKW.js`: 1.09 KB
     - `assets/types-B5Qt9EMX.js`: 0.69 KB
     - `assets/main-xkn4ezGR.css`: 547.40 KB
     - Zero references to `vendor-react`, `vendor-tensorflow`, `vendor-firebase`, or `vendor-motion`.
   - `dist/home.html` referenced assets:
     - `assets/home--1lkYYdL.js`: 648.42 KB
     - `assets/vendor-react-DjkHO9yN.js`: 194.35 KB
     - `assets/vendor-firebase-CBml-Qeu.js`: 334.62 KB
     - `assets/data-i18n-BQVLhNZr.js`: 3,600.64 KB

---

## 2. Logic Chain

1. From Observation 1 & 2: By creating `home.html` containing the existing React 19 entry points (`/src/main.tsx` and `#root`) and changing `index.html` to load `/src/landing/index.ts` and `#landing-root`, the application is physically split into two distinct entry documents.
2. From Observation 3 & 4: Setting Rollup's `input` to `{ main: 'index.html', home: 'home.html' }` and isolating `src/landing` in `manualChunks` causes Vite to compute two independent dependency trees. The `main` tree does not import React or TensorFlow, resulting in an ultra-lightweight bundle (< 2 KB of JavaScript).
3. From Observation 4: The `mpa-dev-rewrite-plugin` middleware in Vite dev and preview servers rewrites `/home` to `/home.html` before HTML serving, ensuring seamless routing during local development.
4. From Observation 5: In `scripts/post-build.js`, switching `spaTemplatePath` to `dist/home.html` and guarding `dist/index.html` against route overwrites ensures that all 59 SPA routes retain their full interactive React functionality while `dist/index.html` remains the pure static landing page.
5. From Observation 6: Updating `src/routes.ts` aligns client-side history navigation with `/home`, preventing the SPA from pushing `/` back into the address bar upon view transitions.
6. From Observation 7: The type check and production build completed with exit code 0, and automated assertions verified that `dist/index.html` has zero heavy dependencies while `dist/home.html` and all SPA routes function with the complete game bundle.

---

## 3. Caveats

- Milestone 1 focused strictly on Features 1–5: physical entry point decoupling, bundler configuration, post-build pipeline, and route mapping.
- The UI components within `src/landing/` (Header, Sidebar, Modals, 5 Core Sections, Card Nurturing system) are stubbed with a valid bootstrap layout in `src/landing/index.ts` and are scheduled for full implementation in Milestones 2 and 3.

---

## 4. Conclusion

Milestone 1 is complete. The Dual-Entry Architecture (Vite Multi-Page Application) is fully operational:
- Root (`/` and `/index.html`): Independent, ultra-lightweight static landing entry point loading `src/landing/index.ts` (0 heavy runtime dependencies).
- Game SPA (`/home` and `/home.html`): Dedicated full-featured entry point loading `src/main.tsx` for the rich card battle game.
- Build pipeline: `vite.config.ts` and `scripts/post-build.js` cleanly generate both targets with 0 errors and preserve all static SPA subroutes.

---

## 5. Verification Method

To independently reproduce and verify this milestone:

```bash
# 1. Verify TypeScript types
npx tsc --noEmit

# 2. Verify production build
npm run build

# 3. Assert HTML entry points and bundle isolation
grep -q "vendor-react" dist/index.html && echo "FAIL: React found in index.html" || echo "PASS: index.html is ultra-light"
grep -q "/src/landing/index.ts" index.html && echo "PASS: index.html loads landing entry"
grep -q "/src/main.tsx" home.html && echo "PASS: home.html loads main.tsx"
grep -q "vendor-react" dist/home.html && echo "PASS: home.html loads vendor-react"
grep -q "assets/home-" dist/home/index.html && echo "PASS: dist/home/index.html loads home script"
grep -q "assets/home-" dist/404.html && echo "PASS: dist/404.html loads home script"
```

Invalidation conditions:
- `dist/index.html` references `vendor-react` or any TensorFlow/Firebase chunk.
- `dist/home.html` or `dist/home/index.html` fails to load the React SPA engine.
- `npm run build` exits with a non-zero code.
