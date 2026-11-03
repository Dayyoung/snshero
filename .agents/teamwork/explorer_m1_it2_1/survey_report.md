# Technical Survey Report: `scripts/generate-news-seo.ts` Base Template Selection Fix

- **Author**: Explorer M1 Iteration 2-1 (`teamwork_explorer`)
- **Date**: 2026-11-02T04:10:00Z
- **Target File**: `scripts/generate-news-seo.ts` (lines 624–629)
- **Target Issue**: Resolution of Base Template Reference Error causing SPA subroutes (`/reddit`, `/r/news`) to mount `#landing-root` instead of `#root`
- **Milestone**: Milestone 1 (Static Architecture & MPA Decoupling) — Iteration 2

---

## 1. Executive Summary

During Milestone 1 Iteration 1 Gate review, Challenger M1-2 identified that `scripts/generate-news-seo.ts` reads `dist/index.html` as its base template. In Milestone 1's Dual-Entry Multi-Page Application (MPA) architecture, `dist/index.html` has been decoupled to serve strictly as an ultra-lightweight standalone static landing page mounting `<div id="landing-root"></div>` via `src/landing/index.ts` (`assets/main-*.js`). The rich React 19 card battle SPA now resides at `dist/home.html`, mounting `<div id="root"></div>` via `src/main.tsx` (`assets/home-*.js`).

Because `scripts/generate-news-seo.ts` was not updated to reference `dist/home.html`:
1. It loaded `dist/index.html` as `baseHtml`.
2. It failed to locate `<div id="root"></div>`, silently skipping injection of the prerendered semantic article and feed markup (`articleHtmlSnippet` and `redditIndexSnippet`).
3. It overwrote `dist/reddit/index.html`, `dist/r/news/index.html`, `dist/r/news/comments/...`, and `dist/reddit/comments/...` with documents containing `<div id="landing-root"></div>` and `/assets/main-*.js`.
4. Users navigating to any Reddit or Google News subroute received the static landing page rather than the interactive Reddit news room / game SPA, causing `[ADV-M1-SPA-reddit]` in `tests/adversarial_m1_build_pipeline.ts` to fail.
5. In addition, `generate-news-seo.ts` wrote the corrupted landing template into `public/reddit/index.html` and `public/r/news/index.html`, which Vite copies into `dist/` on every subsequent build, perpetuating the corruption.

This report specifies the exact code fix in `scripts/generate-news-seo.ts` to prioritize `dist/home.html` and `rootDir/home.html`, outlines the filesystem cleanup procedure for `public/`, and provides automated verification steps to confirm zero regressions.

---

## 2. Architectural Context & Problem Boundary

### 2.1 The Milestone 1 Dual-Entry MPA Model
In accordance with `ORIGINAL_REQUEST.md` and `PROJECT.md`:
- **Static Landing Entry (`/` or `/index.html`)**:
  - Purpose: Lightning-fast, zero-dependency landing page.
  - Container: `<div id="landing-root"></div>`.
  - Script: `src/landing/index.ts` compiled to `/assets/main-[hash].js`.
  - Heavy bundles: Strictly 0 dependencies on `vendor-react`, `vendor-tensorflow`, `vendor-firebase`, or `vendor-motion`.
- **Game SPA Entry (`/home` or `/home.html`)**:
  - Purpose: Full interactive web card game and multimedia SPA (including `/deck`, `/play`, `/shop`, `/reddit`, `/movie`, etc.).
  - Container: `<div id="root"></div>`.
  - Script: `src/main.tsx` compiled to `/assets/home-[hash].js`.
  - Dependencies: React 19, Motion, Firebase, Lucide, etc.

### 2.2 The Downstream Post-Build Pipeline
When `npm run build` runs:
1. `tsc` validates types.
2. `vite build` builds `index.html` and `home.html` into `dist/index.html` and `dist/home.html`, and copies `public/` into `dist/`.
3. `scripts/post-build.js` executes:
   - Line 108: Correctly selects `spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath`.
   - Line 199–232: Generates static SPA fallback routes for `/deck`, `/play`, `/shop`, `/bench`, `/novel`, etc.
   - Line 255: Executes `scripts/generate-news-seo.ts`.
   - Line 263: Executes `scripts/generate-video-seo.ts`.

---

## 3. Detailed Root Cause Analysis in `scripts/generate-news-seo.ts`

### 3.1 Defective Code in `scripts/generate-news-seo.ts`
Lines 624–629 verbatim:
```typescript
  // C. 템플릿 HTML 로드 (dist/index.html 우선, 없으면 root index.html)
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');
  const baseTemplatePath = fs.existsSync(distIndexPath) ? distIndexPath : rootIndexPath;
  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
```

### 3.2 Mechanism of Failure
1. **Wrong Base Template Selection**:
   `distIndexPath` (`dist/index.html`) exists after `vite build`. The script reads `dist/index.html`.
2. **Container Mismatch & Silent Prerender Bypass**:
   In `buildArticleStaticHtml` (lines 499–501) and `buildRedditNewsIndexHtml` (lines 592–594):
   ```typescript
   if (customHtml.includes('<div id="root"></div>')) {
     customHtml = customHtml.replace('<div id="root"></div>', `<div id="root">\n${articleHtmlSnippet}\n</div>`);
   }
   ```
   Because `dist/index.html` has `<div id="landing-root"></div>`, `customHtml.includes('<div id="root"></div>')` evaluates to `false`.
   The prerendered article/feed content is **never inserted**.
3. **Corrupted Output Injection**:
   The script writes `articleHtml` and `redditIndexHtml` (which contain `<div id="landing-root"></div>` and load `/assets/main-*.js`) to:
   - `dist/r/news/comments/${aliasId}/index.html` (120+ articles)
   - `dist/reddit/comments/${aliasId}/index.html` (120+ articles)
   - `dist/reddit/index.html`
   - `dist/r/news/index.html`
   - `public/reddit/index.html`
   - `public/r/news/index.html`
4. **Permanent State Pollution in `public/`**:
   Because `public/reddit/index.html` and `public/r/news/index.html` are modified in `public/`, `scripts/post-build.js` lines 204–208:
   ```javascript
   const publicStaticIndex = path.join(publicDir, route, 'index.html');
   if (fs.existsSync(publicStaticIndex)) {
     // Do not overwrite real static games/pages that already exist in public/
     continue;
   }
   ```
   detects that `public/reddit/index.html` exists and skips regenerating `dist/reddit/index.html` from `dist/home.html`.
   Then when `generate-news-seo.ts` runs at line 255, it continuously cements the landing-page template into both `dist/` and `public/`.

---

## 4. Implementation Specification

### 4.1 Target File & Modification Scope
- **File**: `scripts/generate-news-seo.ts`
- **Location**: Lines 624–629 (`runGenerateNewsSeo` function)
- **Nature of Change**: Update template resolution hierarchy to prioritize `dist/home.html`, then `rootDir/home.html`, falling back to `index.html` only as a secondary fail-safe.

### 4.2 Exact Code Replacement

#### Before (Lines 624–629):
```typescript
  // C. 템플릿 HTML 로드 (dist/index.html 우선, 없으면 root index.html)
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');
  const baseTemplatePath = fs.existsSync(distIndexPath) ? distIndexPath : rootIndexPath;
  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
```

#### After (Proposed Drop-In Replacement):
```typescript
  // C. SPA 베이스 템플릿 HTML 로드 (dist/home.html 우선, 없으면 root home.html)
  // [주의] dist/index.html은 순수 정적 랜딩 페이지(#landing-root)이므로,
  // SPA 서브라우트(/reddit, /r/news)는 반드시 React 19 SPA 번들이 포함된 home.html(#root)을 베이스로 사용해야 합니다.
  const distHomePath = path.join(distDir, 'home.html');
  const rootHomePath = path.join(rootDir, 'home.html');
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');

  const baseTemplatePath = fs.existsSync(distHomePath)
    ? distHomePath
    : fs.existsSync(rootHomePath)
      ? rootHomePath
      : fs.existsSync(distIndexPath)
        ? distIndexPath
        : rootIndexPath;

  console.log(`[generate-news-seo] Using base SPA template: ${baseTemplatePath}`);
  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
```

### 4.3 Why this Resolution Hierarchy is Complete and Robust
1. **Normal Production Build (`npm run build`)**:
   `dist/home.html` is produced during `vite build`. It contains `<div id="root"></div>` and production-hashed scripts (`/assets/home-[hash].js`, `/assets/vendor-react-[hash].js`). `baseTemplatePath` selects `dist/home.html`.
2. **Pre-Build or Standalone Script Invocation (`npx tsx scripts/generate-news-seo.ts`)**:
   If executed before `dist/` is compiled, `rootHomePath` (`home.html` at the workspace root) is selected. It contains `<div id="root"></div>` and `<script type="module" src="/src/main.tsx"></script>`. It will never pick `index.html` (`#landing-root`).
3. **Fail-Safe Fallback**:
   If for any unanticipated reason `home.html` is missing, it falls back to `dist/index.html` or `rootDir/index.html` rather than throwing an unhandled exception.

---

## 5. Downstream Filesystem Cleanup Specification

Because iteration 1 previously executed with the defective code, `public/reddit/index.html` and `public/r/news/index.html` currently contain `<div id="landing-root"></div>`.

To ensure total clean-room integrity during iteration 2 implementation, the worker must:
1. Revert or clean the poisoned static files in `public/`:
   ```bash
   git checkout HEAD -- public/reddit/index.html public/r/news/index.html
   ```
   Or remove them before build so Vite does not copy stale files into `dist/`.
2. Clean stale article comment folders in `public/` and `dist/`:
   `scripts/generate-news-seo.ts` lines 631–638 already automates the deletion of:
   - `public/r/news/comments`
   - `public/reddit/comments`
3. After applying the code edit to `scripts/generate-news-seo.ts`, running `npm run build` will regenerate `dist/reddit/index.html`, `dist/r/news/index.html`, and `dist/r/news/comments/...` using `dist/home.html`.

---

## 6. Verification and Validation Plan

### 6.1 Automated Verification Commands
```bash
# Step 1: Re-build project
npm run build

# Step 2: Verify dist/reddit/index.html contains SPA #root and home-*.js
grep -q '<div id="root">' dist/reddit/index.html && echo "PASS: dist/reddit contains #root" || echo "FAIL: dist/reddit missing #root"
grep -q 'landing-root' dist/reddit/index.html && echo "FAIL: dist/reddit has landing-root" || echo "PASS: dist/reddit clean of landing-root"
grep -E -q '/assets/home-[A-Za-z0-9_-]+\.js' dist/reddit/index.html && echo "PASS: dist/reddit loads home.js" || echo "FAIL: dist/reddit missing home.js"

# Step 3: Verify news article comments route
ARTICLE_SAMPLE=$(ls -d dist/r/news/comments/* | head -n 1)
grep -q '<div id="root">' "$ARTICLE_SAMPLE/index.html" && echo "PASS: article comments contain #root" || echo "FAIL"
grep -q 'landing-root' "$ARTICLE_SAMPLE/index.html" && echo "FAIL: article has landing-root" || echo "PASS: article clean"

# Step 4: Run the Challenger Adversarial Test Suite
npx tsx tests/adversarial_m1_build_pipeline.ts
```

### 6.2 Acceptance / Invalidation Conditions
- **Pass Criteria**:
  - `ADV-M1-SPA-reddit` in `tests/adversarial_m1_build_pipeline.ts` passes (`root:true, homeJs:true`).
  - Zero files under `dist/reddit`, `dist/r/news`, or `dist/r/news/comments` contain `landing-root` or load `/assets/main-*.js`.
  - `dist/index.html` remains untouched as the standalone static landing page (`#landing-root`, 0 React dependencies).
- **Invalidation Condition**:
  - Any HTML file generated under `dist/reddit` or `dist/r/news` contains `landing-root` or fails to mount client-side React SPA.
