# Investigation Report: `scripts/post-build.js` Template Overwrite Remediation

**Explorer**: `explorer_m1_it2_1`  
**Milestone**: Milestone 1 Iteration 2 Remediation  
**Date**: 2026-11-02T08:39:00Z  
**Target File**: `scripts/post-build.js` (lines 240–289) and `src/routes.ts` (lines 484–503)

---

## 1. Executive Summary

During Milestone 1 Iteration 1 review, Reviewer 1 identified a critical defect in the post-build pipeline:
In `scripts/post-build.js:250-258`, when iterating through legacy routes where `route === 'home'`, `flatHtmlPath` resolves to `dist/home.html`. Writing the 16-line redirect stub to `dist/home.html` obliterates Vite's compiled master React SPA template (900 lines / ~46 KB with `#root` and JavaScript chunks) and replaces it with an empty 16-line redirect stub (`<meta http-equiv="refresh" content="0; url=/#home">`).

Because downstream build steps (`dist/404.html`, `scripts/generate-news-seo.ts`, and `scripts/generate-video-seo.ts`) use `dist/home.html` as their base template, **all 80 movie & cinema pages (`dist/movie/ep-1..40`, `dist/cinema/ep-1..40`), all 120 news articles (`dist/r/news/comments/...`), `dist/reddit/index.html`, and `dist/404.html` have their React SPA application stripped and replaced with the 16-line redirect stub**. Any visitor opening an episode link or news article is immediately redirected to `/#home` with zero player or article text.

This investigation provides the exact, bug-free drop-in replacement that:
1. Generates `dist/home/index.html` as the directory redirect stub to `/#home` (handling `/home` and `/home/`).
2. Strictly preserves `dist/home.html` as the full compiled React SPA template (never overwritten).
3. Ensures downstream SEO generators and `dist/404.html` receive the authentic React SPA bundle.
4. Restores 100% build idempotency.

---

## 2. Verbatim Observations from Repositories & Build Outputs

### A. Current Corrupted State of `dist/home.html`
- **Path**: `dist/home.html`
- **Actual Size**: 16 lines, 535 bytes
- **Verbatim Content**:
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>눈히어로.com - 이동 중...</title>
  <meta http-equiv="refresh" content="0; url=/#home">
  <link rel="canonical" href="https://snshero.com/#home">
  <script>
    var search = window.location.search || '';
    window.location.replace('/' + '#home' + search);
  </script>
</head>
<body style="font-family: monospace; padding: 20px; background: #fdfcfc; color: #201d1d;">
  <p>섹션으로 이동 중입니다: <a href="/#home">/#home</a></p>
</body>
</html>
```

### B. Current Corrupted State of `dist/404.html`
- **Path**: `dist/404.html`
- **Actual Size**: 16 lines, 535 bytes (exact byte-for-byte copy of the corrupted `dist/home.html`)
- **Impact**: Any unmatched route or deep link that hits 404 does not boot the client SPA router; it bounces to `/#home`.

### C. Current Corrupted State of `dist/movie/ep-1/index.html`
- **Path**: `dist/movie/ep-1/index.html`
- **Observation (lines 6–11 and 146–148)**:
```html
<head>
  ...
  <meta http-equiv="refresh" content="0; url=/#home">
  <link rel="canonical" href="https://snshero.com/movie/ep-1" />
  <script>
    var search = window.location.search || '';
    window.location.replace('/' + '#home' + search);
  </script>
  ...
</head>
<body style="font-family: monospace; padding: 20px; background: #fdfcfc; color: #201d1d;">
  <p>섹션으로 이동 중입니다: <a href="/#home">/#home</a></p>
</body>
```
- **Impact**: The `<div id="root"></div>` mount point, the video player bundle, and the React entry script are 100% absent. The browser immediately bounces to `/#home`.

### D. Upstream Source Template `home.html`
- **Path**: `/Users/dayyoung/project/snshero/home.html`
- **Size**: 900 lines, 46,448 bytes
- **Key Elements**:
  - Lines 34–63: Early client-side hash normalizer in `<head>` that already redirects legacy paths if loaded directly.
  - Line 809: `<script type="module" src="/src/main.tsx"></script>`
  - Line 812: `<div id="root"></div>`
  - Vite `rollupOptions.input`:
    ```typescript
    input: {
      main: path.resolve(process.cwd(), 'index.html'),
      home: path.resolve(process.cwd(), 'home.html'),
    }
    ```
    Vite compiles `home.html` into `dist/home.html` with bundled assets before `scripts/post-build.js` executes.

---

## 3. Root Cause Logic Chain

1. **Vite Compile Step**: `npm run build` runs `vite build`. Vite compiles `index.html` -> `dist/index.html` and `home.html` -> `dist/home.html`.
2. **Post-Build Script Initialization**: `scripts/post-build.js` runs.
   - Line 103: `const homeHtmlPath = path.join(distDir, 'home.html');`
   - Line 108: `const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;`
   - `spaTemplatePath` correctly identifies `dist/home.html` as the master template.
3. **Loop Over `routes` (Iteration 0: `route = 'home'`)**:
   - `legacyRoutesToHash['home']` is `'#home'`.
   - Line 250: `fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8')` writes `dist/home/index.html`. This is correct.
   - Line 251: `const flatHtmlPath = path.join(distDir, `${route}.html`);` -> resolves to `dist/home.html`.
   - Line 252: `if (flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html')`
     `flatHtmlPath` is NOT `indexPath` (`dist/index.html`), so the condition is true!
   - Line 257: `fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8')` writes the 16-line stub directly into `dist/home.html`.
4. **Downstream Corruption**:
   - Line 301–305: `404.html` copies `homeHtmlPath` (`dist/home.html`), now a redirect stub.
   - Line 310: `generate-news-seo.ts --template "${spaTemplatePath}"` reads `dist/home.html` and generates 120 news pages and Reddit feeds based on the redirect stub.
   - Line 320: `generate-video-seo.ts --template "${spaTemplatePath}"` reads `dist/home.html` and generates 80 movie/cinema episode pages based on the redirect stub.
5. **Loss of Idempotency**:
   - Running `node scripts/post-build.js` a second time uses the corrupted `dist/home.html` as `spaTemplatePath`, cascading the redirect stub to all 59 other static routes.

---

## 4. Exact Drop-In Replacement for `scripts/post-build.js`

### Target Location 1: Lines 250–260 of `scripts/post-build.js`

#### Existing Code (Defective):
```javascript
      fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');
      const flatHtmlPath = path.join(distDir, `${route}.html`);
      if (flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html') {
        const flatHtmlDir = path.dirname(flatHtmlPath);
        if (!fs.existsSync(flatHtmlDir)) {
          fs.mkdirSync(flatHtmlDir, { recursive: true });
        }
        fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
      }
      continue;
```

#### Proposed Replacement (Exact Drop-In):
```javascript
      // 0a. Write directory index redirect: dist/[route]/index.html (e.g. dist/home/index.html -> /#home)
      fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');

      // 0b. Write clean flat file: dist/[route].html ONLY for non-home legacy routes.
      // CRITICAL GUARD: dist/home.html is Vite's compiled master React SPA template containing
      // the full application bundle, #root mount point, and early client-side hash redirect.
      // It must strictly NEVER be overwritten with a redirect stub. Overwriting dist/home.html
      // destroys downstream generators (dist/404.html, generate-news-seo.ts, generate-video-seo.ts).
      const flatHtmlPath = path.join(distDir, `${route}.html`);
      const isProtectedTemplate =
        route === 'home' ||
        flatHtmlPath === homeHtmlPath ||
        flatHtmlPath === indexPath ||
        path.relative(distDir, flatHtmlPath) === 'home.html' ||
        path.relative(distDir, flatHtmlPath) === 'index.html';

      if (!isProtectedTemplate) {
        const flatHtmlDir = path.dirname(flatHtmlPath);
        if (!fs.existsSync(flatHtmlDir)) {
          fs.mkdirSync(flatHtmlDir, { recursive: true });
        }
        fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
      }
      continue;
```

---

### Target Location 2: Defensive Hardening in Lines 277–286 of `scripts/post-build.js`

For standard routes (step 3), also ensure that `dist/home.html` cannot be overwritten:

#### Existing Code:
```javascript
    // 3. Write clean URL extensionless file: dist/[route].html for ALL routes (flat & nested)
    const flatHtmlPath = path.join(distDir, `${route}.html`);
    // Strict isolation guard: never overwrite dist/index.html (the standalone static landing page)
    if (flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html') {
      const flatHtmlDir = path.dirname(flatHtmlPath);
      if (!fs.existsSync(flatHtmlDir)) {
        fs.mkdirSync(flatHtmlDir, { recursive: true });
      }
      fs.writeFileSync(flatHtmlPath, targetHtml, 'utf8');
    }
```

#### Proposed Replacement (Defensive):
```javascript
    // 3. Write clean URL extensionless file: dist/[route].html for ALL routes (flat & nested)
    const flatHtmlPath = path.join(distDir, `${route}.html`);
    // Strict isolation guard: never overwrite dist/index.html (standalone landing) or dist/home.html (master SPA template)
    const isProtectedMasterTemplate =
      flatHtmlPath === indexPath ||
      flatHtmlPath === homeHtmlPath ||
      path.relative(distDir, flatHtmlPath) === 'index.html' ||
      path.relative(distDir, flatHtmlPath) === 'home.html';

    if (!isProtectedMasterTemplate) {
      const flatHtmlDir = path.dirname(flatHtmlPath);
      if (!fs.existsSync(flatHtmlDir)) {
        fs.mkdirSync(flatHtmlDir, { recursive: true });
      }
      fs.writeFileSync(flatHtmlPath, targetHtml, 'utf8');
    }
```

---

## 5. Companion Defect Fix: `src/routes.ts` Lines 484–502

Reviewer 1 also identified dead code in `src/routes.ts` where `/play?ep=...` was shadowed by an earlier unconditional check:

### Existing Code in `src/routes.ts:484-502`:
```typescript
  if (cleanPath === '/home' || cleanPath === '/main-lobby') return 'home';
  if (cleanPath === '/deck' || cleanPath === '/mydeck') return 'mydeck';
  if (cleanPath === '/play' || cleanPath === '/main') return 'play';
  if (cleanPath === '/card' || cleanPath === '/cards' || cleanPath === '/mission' || cleanPath === '/missions') return 'card' as ViewType;
  if (cleanPath === '/shop') return 'shop';

  // 특수 접두사 라우팅
  if (cleanPath.startsWith('/creator/')) return 'creator';
  if (cleanPath.startsWith('/novel/s1-') || cleanPath.startsWith('/book/')) return 'novel';
  if (cleanPath.startsWith('/movie/') || cleanPath.startsWith('/animation/')) return 'movie';
  if (cleanPath.startsWith('/cinema/') || cleanPath.startsWith('/live-cinema/')) return 'cinema';
  if (cleanPath === '/script' || cleanPath.startsWith('/script/')) return 'script';
  if (cleanPath.startsWith('/main/')) return 'main';
  if (
    cleanPath === '/play' &&
    (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter'))
  ) {
    return 'main';
  }
```

### Proposed Replacement in `src/routes.ts:484-502`:
```typescript
  if (cleanPath === '/home' || cleanPath === '/main-lobby') return 'home';
  if (cleanPath === '/deck' || cleanPath === '/mydeck') return 'mydeck';
  if (cleanPath === '/play') {
    if (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter')) {
      return 'main';
    }
    return 'play';
  }
  if (cleanPath === '/main') return 'play';
  if (cleanPath === '/card' || cleanPath === '/cards' || cleanPath === '/mission' || cleanPath === '/missions') return 'card' as ViewType;
  if (cleanPath === '/shop') return 'shop';

  // 특수 접두사 라우팅
  if (cleanPath.startsWith('/creator/')) return 'creator';
  if (cleanPath.startsWith('/novel/s1-') || cleanPath.startsWith('/book/')) return 'novel';
  if (cleanPath.startsWith('/movie/') || cleanPath.startsWith('/animation/')) return 'movie';
  if (cleanPath.startsWith('/cinema/') || cleanPath.startsWith('/live-cinema/')) return 'cinema';
  if (cleanPath === '/script' || cleanPath.startsWith('/script/')) return 'script';
  if (cleanPath.startsWith('/main/')) return 'main';
```

---

## 6. Verification Method

Once the worker applies these changes, execute:

1. **Full Production Build**:
   ```bash
   npm run build
   ```
2. **File Integrity Verification**:
   - Verify `dist/home/index.html` is the redirect stub:
     ```bash
     grep -q 'url=/#home' dist/home/index.html && echo "dist/home/index.html is redirect stub: PASS"
     ```
   - Verify `dist/home.html` is the full compiled React SPA template:
     ```bash
     grep -q 'id="root"' dist/home.html && grep -q '/assets/home-' dist/home.html && echo "dist/home.html preserved: PASS"
     ```
   - Verify `dist/404.html` contains `#root` and React entry:
     ```bash
     grep -q 'id="root"' dist/404.html && echo "dist/404.html preserved: PASS"
     ```
   - Verify `dist/movie/ep-1/index.html` has `#root` and NO redirect stub:
     ```bash
     grep -q 'id="root"' dist/movie/ep-1/index.html && ! grep -q 'url=/#home' dist/movie/ep-1/index.html && echo "Movie ep-1 preserved: PASS"
     ```
   - Verify `dist/reddit/index.html` has `#root` and NO redirect stub:
     ```bash
     grep -q 'id="root"' dist/reddit/index.html && ! grep -q 'url=/#home' dist/reddit/index.html && echo "Reddit index preserved: PASS"
     ```
3. **Idempotency Verification**:
   ```bash
   node scripts/post-build.js
   grep -q 'id="root"' dist/home.html && echo "Idempotency preserved: PASS"
   ```
4. **E2E & Unit Test Suites**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M1
   npx tsx tests/unit_m1_idle_autoplay.ts
   npx tsx tests/adversarial_m1_build_pipeline.ts
   ```
