# Milestone 1: Challenger Adversarial Review Handoff Report

- **Challenger**: `teamwork_challenger` (Milestone 1 Adversarial Verification)
- **Date**: 2026-11-02T04:03:00Z
- **Parent**: Orchestrator (`7b342c7a-1d74-43d7-a388-5ffc926b3969`)
- **Status**: Complete (Hard Handoff)
- **Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

1. **`dist/index.html` Static Landing Isolation (PASS)**:
   - Tool execution: `npm run build`, `dist/index.html` inspected.
   - Verbatim content (lines 722–727):
     ```html
     <script type="module" crossorigin src="/assets/main-DFC6NrKW.js"></script>
     <link rel="modulepreload" crossorigin href="/assets/types-B5Qt9EMX.js">
     <link rel="stylesheet" crossorigin href="/assets/main-xkn4ezGR.css">
     </head>
     <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
       <div id="landing-root"></div>
     ```
   - Bundle audit: `dist/index.html` contains **0** references to `vendor-react`, `vendor-tensorflow`, `vendor-firebase`, or `vendor-motion`. Total initial script weight is 1.78 KB. It was **NOT** overwritten by `scripts/post-build.js`.

2. **`dist/home/index.html` & `dist/home.html` SPA Entry (PASS)**:
   - Location: `dist/home.html` and `dist/home/index.html`.
   - Verbatim content: Contains `<div id="root"></div>` and `<script type="module" crossorigin src="/assets/home-PQBwXUfo.js"></script>`.
   - Asset path audit: All script and stylesheet references in `dist/home/index.html` use absolute `/assets/` paths.

3. **E2E Test Runner Execution (PASS WITH BLIND SPOT)**:
   - Command: `npx tsx tests/e2e/run_all.ts --milestone M1`
   - Output: 9 of 9 assertions passed (100.0%).
   - Limitation: `T1.MPA.4` in `tests/e2e/tier1_feature_coverage.ts` (lines 76–86) only performs string matching against `scripts/post-build.js` (`script.includes('home.html')`), and does not inspect the resulting static files in `dist/` or the behavior of downstream generators.

4. **Empirical Adversarial Test Failure — Subroute Template Overwrite (FAIL / CRITICAL BUG)**:
   - Harness: `tests/adversarial_m1_build_pipeline.ts` executed via `npx tsx tests/adversarial_m1_build_pipeline.ts`.
   - Results: 62 PASS, 2 FAIL:
     - `[ADV-M1-SPA-reddit]` Route `dist/reddit/index.html` has SPA root & home.js: `root:false, homeJs:false`.
     - `[ADV-M1-SPA-movie]` Route `dist/movie/index.html` has SPA root & home.js: `root:false, homeJs:false`.
   - Verbatim inspection of `dist/movie/index.html` (lines 722, 1405):
     ```html
     <script type="module" crossorigin src="/assets/main-DFC6NrKW.js"></script>
     ...
     <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
       <div id="landing-root"></div>
     ```
   - Grep search result: **557 HTML files** across `dist/` (including `dist/reddit/index.html`, `dist/r/news/index.html`, `dist/movie/index.html`, `dist/animation/index.html`, `dist/cinema/index.html`, `dist/movie/ep-1..40/index.html`, `dist/cinema/ep-1..40/index.html`, and `dist/r/news/comments/...`) contain `<div id="landing-root"></div>` and load `/assets/main-*.js` instead of `<div id="root"></div>` and `/assets/home-*.js`.

5. **Root Cause Analysis in Post-Build Downstream Generators**:
   - `scripts/generate-news-seo.ts` (lines 625–628):
     ```typescript
     const distIndexPath = path.join(distDir, 'index.html');
     const rootIndexPath = path.join(rootDir, 'index.html');
     const baseTemplatePath = fs.existsSync(distIndexPath) ? distIndexPath : rootIndexPath;
     const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
     ```
   - `scripts/generate-video-seo.ts` (lines 700–705):
     ```typescript
     const distIndexPath = path.join(distDir, 'index.html');
     const rootIndexPath = path.join(rootDir, 'index.html');
     const baseHtml = fs.existsSync(distIndexPath)
       ? fs.readFileSync(distIndexPath, 'utf8')
       : fs.readFileSync(rootIndexPath, 'utf8');
     ```
   - Both scripts read `dist/index.html` (which in M1 is the static landing page) and overwrite the previously generated SPA routes in `dist/` and `public/`.
   - Furthermore, `scripts/post-build.js` lines 204–208 skips regenerating routes if `path.join(publicDir, route, 'index.html')` exists, cementing the corrupted landing-page templates into `dist/`.

---

## 2. Logic Chain

1. From Observation 1: `dist/index.html` is indeed decoupled and preserved as a pure static landing page without heavy dependencies.
2. From Observation 2: `dist/home.html` and `dist/home/index.html` properly load the React 19 game SPA engine.
3. From Observation 4 & 5: When `scripts/post-build.js` executes, it generates SPA routes for `routes` from `dist/home.html`. However, at lines 255 and 263, it invokes `scripts/generate-news-seo.ts` and `scripts/generate-video-seo.ts`.
4. These two downstream scripts were not updated for Milestone 1's Dual-Entry architecture and still assume `dist/index.html` is the SPA template.
5. They read `dist/index.html`, which injects the static landing script (`/assets/main-*.js`) and `<div id="landing-root"></div>` into:
   - `/reddit`
   - `/r/news`
   - `/movie`
   - `/animation`
   - `/cinema`
   - All 80 episode pages (`/movie/ep-1..40`, `/cinema/ep-1..40`)
   - All news comment subpages
6. When a user navigates to any of these URLs in a browser, they receive an HTML document that mounts `src/landing/index.ts` rather than `src/main.tsx`. The user is served the static landing page, completely breaking deep-linking to the Reddit community, Movie player, and Cinema player.
7. Therefore, while `dist/index.html` preservation succeeded, the subroute SPA template requirement failed.

---

## 3. Caveats

- Standard routes not touched by `generate-news-seo.ts` or `generate-video-seo.ts` (e.g., `/deck`, `/play`, `/shop`, `/bench`, `/novel`, `/webtoon`) correctly retain their SPA `#root` and `home-*.js` entry scripts.
- The TypeScript build (`npx tsc --noEmit`) and Vite compilation pass with exit code 0.
- No caveats regarding reproducibility: this issue reproduces deterministically on every `npm run build`.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone 1 cannot be approved in its current state because the post-build pipeline corrupts core SPA subroutes (`/reddit`, `/movie`, `/cinema`, `/animation`, and 500+ child pages) by overwriting them with the static landing template.

### Required Changes for Worker:
1. **Update `scripts/generate-news-seo.ts` (lines 625–629)**:
   - Change `baseTemplatePath` to resolve `dist/home.html` (or `rootDir/home.html`) instead of `dist/index.html`.
2. **Update `scripts/generate-video-seo.ts` (lines 700–705)**:
   - Change `baseHtml` to load from `dist/home.html` (or `rootDir/home.html`) instead of `dist/index.html`.
3. **Clean corrupted files in `public/`**:
   - Clean out stale `public/movie/index.html`, `public/animation/index.html`, `public/cinema/index.html`, `public/reddit/index.html`, and `public/r/news/index.html` so they do not preserve stale static landing bundles across builds.
4. **Update `tests/e2e/tier1_feature_coverage.ts` (T1.MPA.4)**:
   - Add empirical verification that `dist/movie/index.html` and `dist/reddit/index.html` contain `<div id="root"></div>` and load `home-*.js`.

---

## 5. Verification Method

To verify the failure and subsequent fix:

```bash
# 1. Run production build
npm run build

# 2. Run adversarial test harness
npx tsx tests/adversarial_m1_build_pipeline.ts

# 3. Direct verification of affected routes
grep -q "landing-root" dist/reddit/index.html && echo "FAIL: dist/reddit has landing-root" || echo "PASS: dist/reddit has SPA root"
grep -q "landing-root" dist/movie/index.html && echo "FAIL: dist/movie has landing-root" || echo "PASS: dist/movie has SPA root"
grep -q "landing-root" dist/cinema/index.html && echo "FAIL: dist/cinema has landing-root" || echo "PASS: dist/cinema has SPA root"

# 4. Standard M1 E2E tests
npx tsx tests/e2e/run_all.ts --milestone M1
```

Invalidation conditions for fix:
- Any file under `dist/deck`, `dist/play`, `dist/shop`, `dist/reddit`, `dist/movie`, `dist/cinema`, or `dist/animation` contains `landing-root` or loads `assets/main-*.js`.
