# Milestone 1 Iteration 3: Explorer 1 Handoff Report

- **Author**: Explorer 1 (`explorer_m1_it3_1`)
- **Role**: `teamwork_explorer` (Read-Only Investigation & Code Synthesis)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/`
- **Date**: 2026-11-02T18:01:30Z
- **Recipient**: Orchestrator (`21826d14-7bc9-4995-866c-cbb42a941789`)
- **Status**: Complete (Hard Handoff)

---

## 1. Observation

1. **Defect in `scripts/post-build.js` (Lines 227–232 in Iteration 1)**:
   ```javascript
   fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
   if (!route.includes('/')) {
     fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBaseHtml, 'utf8');
   }
   ```
   Direct observation:
   - For all nested routes (`wiki/card`, `wiki/howtoplay`, `r/hanguk`, `r/hanguk/comments/...`), `route.includes('/')` is `true`.
   - The conditional `if (!route.includes('/'))` bypassed generating `dist/[route].html` for every nested route.
   - Only `dist/[route]/index.html` was written.

2. **Server Clean URL Fallback Behavior**:
   - In static file hosting (e.g. Vite preview server, Nginx, AWS S3 / CloudFront, Cloudflare Pages), a request for an extensionless clean URL without a trailing slash (`GET /wiki/card`) looks for:
     1. Exact file `dist/wiki/card` (does not exist).
     2. Exact file `dist/wiki/card.html` (did not exist because `if (!route.includes('/'))` skipped it).
     3. SPA default fallback: `dist/index.html`.
   - In Milestone 1, `dist/index.html` is the **standalone marketing landing page** (`#landing-root`, total JS 1.79 KB).
   - Verbatim curl failure observed by Challenger 2:
     ```bash
     curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
     # Output: id="landing-root" (Defective: Landing page delivered instead of Card Wiki)
     ```

3. **Current Workspace State (`scripts/post-build.js` lines 288–306 in commit `bfefd8c41`)**:
   - Worker M1-it2 removed `if (!route.includes('/'))` and implemented flat `.html` file generation with directory creation:
     ```javascript
     // 2. Write directory index: dist/[route]/index.html
     fs.writeFileSync(path.join(routeDir, 'index.html'), targetHtml, 'utf8');

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
   - Verified that `dist/wiki/card.html` (47,198 bytes) and `dist/r/hanguk.html` (47,198 bytes) now exist on disk.
   - Verified via live HTTP curl probe against preview server (port 3000):
     ```bash
     curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
     # Output: id="root" (PASS: SPA successfully loaded)
     curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
     # Output: id="root" (PASS: SPA successfully loaded)
     curl -s http://localhost:3000/ | grep -o 'id="[^"]*"'
     # Output: id="landing-root" (PASS: Landing isolation preserved)
     curl -s http://localhost:3000/home.html | grep -o 'id="[^"]*"'
     # Output: id="root" (PASS: Master SPA template preserved)
     ```

4. **Asset Path Invariant Finding in `dist/home.html` and `dist/404.html`**:
   - `dist/home.html` compiled by Vite contains relative asset links:
     `<script type="module" crossorigin src="./assets/home-Bat2XcI9.js"></script>`
   - `scripts/post-build.js` line 323 copies `home.html` directly to `dist/404.html`.
   - On deep nested URLs (`/foo/bar/baz`), relative asset paths `./assets/` fail because the browser requests `/foo/bar/assets/home-*.js`.
   - In `scripts/post-build.js`, `cleanBaseHtml` already has `ensureAbsoluteAssetPaths` applied (converting `./assets/` to `/assets/`).

---

## 2. Logic Chain

1. From Observation 1, the guard `if (!route.includes('/'))` in Iteration 1 caused `post-build.js` to omit `dist/[route].html` for all nested routes.
2. From Observation 2, when static file servers process requests for clean extensionless URLs without a trailing slash (`/wiki/card`), they search for `dist/wiki/card.html`. In its absence, they fall back to `dist/index.html`.
3. Because Milestone 1 decoupled `dist/index.html` into the static marketing landing page (`#landing-root`), users visiting nested routes were incorrectly served the landing page.
4. From Observation 3, removing `if (!route.includes('/'))` and calling `fs.mkdirSync(path.dirname(flatHtmlPath), { recursive: true })` before writing `dist/[route].html` solves the issue, as proven by `curl -s http://localhost:3000/wiki/card` returning `id="root"`.
5. From Observation 3 and 4, strict protection of `dist/home.html` and `dist/index.html` requires multi-tier identity checks (`cleanRoute === 'home'`, `cleanRoute === 'index'`, absolute and relative path checks).
6. Writing `cleanBaseHtml` to `dist/404.html` and `dist/home.html` guarantees that all SPA fallback and deep-link pages resolve assets using absolute `/assets/` paths.

---

## 3. Caveats

- Top-level legacy routes (`home`, `deck`, `play`, `card`, `shop`) are intentionally written with canonical `<meta http-equiv="refresh" content="0; url=/#...">` and `window.location.replace` redirect stubs in accordance with the Milestone 1 Hash Routing specification (`ORIGINAL_REQUEST.md` R1 and `PROJECT.md` Feature 1 & 2).
- Test harnesses that have not been updated to expect redirect stubs on legacy routes (`tests/adversarial_route_edge_cases.ts` and `tests/adversarial_m1_build_pipeline.ts`) must be aligned to test for redirect stubs on legacy routes, as noted by Challenger 1 (`challenger_m1_it2_1/handoff.md`).
- No other caveats.

---

## 4. Conclusion

The defect reported by Challenger 2 is completely resolved by standardizing `scripts/post-build.js` around the following requirements:
1. For ALL routes in `routes` (both flat and nested), generate both:
   - `dist/[route]/index.html` (directory index)
   - `dist/[route].html` (clean extensionless file)
2. Create subdirectories recursively using `fs.mkdirSync(path.dirname(flatHtmlPath), { recursive: true })`.
3. Protect `dist/home.html` and `dist/index.html` via 6-point invariant protection:
   `cleanRoute === 'home' || cleanRoute === 'index' || flatHtmlPath === homeHtmlPath || flatHtmlPath === indexPath || path.relative(distDir, flatHtmlPath) === 'home.html' || path.relative(distDir, flatHtmlPath) === 'index.html'`.
4. Normalize `dist/home.html` and `dist/404.html` with `cleanBaseHtml` to ensure absolute `/assets/` paths.

### Exact Drop-In Replacement for `scripts/post-build.js` (lines 199–328)

```javascript
  // 4. Generate SPA route directories with index.html and root .html clean URLs for ALL routes (flat & nested)
  for (const route of routes) {
    const cleanRoute = (route || '').replace(/^\/+/, '').replace(/\/+$/, '');
    if (!cleanRoute || cleanRoute === 'index') {
      continue;
    }

    const publicStaticIndex = path.join(publicDir, cleanRoute, 'index.html');
    // Only skip dedicated non-SPA static sites (e.g., mirrored Shopify mall in public/mall)
    const isDedicatedStaticSite = cleanRoute === 'mall' || cleanRoute.startsWith('mall/');
    if (isDedicatedStaticSite && fs.existsSync(publicStaticIndex)) {
      continue;
    }

    const routeDir = path.join(distDir, cleanRoute);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    // 0. Legacy standalone routes redirect cleanly to canonical hash routes
    const legacyRoutesToHash = {
      home: '#home',
      'main-lobby': '#home',
      deck: '#deck',
      mydeck: '#deck',
      play: '#play',
      main: '#play',
      card: '#card',
      cards: '#card',
      mission: '#card',
      missions: '#card',
      shop: '#shop',
      store: '#shop',
    };

    if (legacyRoutesToHash[cleanRoute]) {
      const targetHash = legacyRoutesToHash[cleanRoute];
      const redirectHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>눈히어로.com - 이동 중...</title>
  <meta http-equiv="refresh" content="0; url=/${targetHash}">
  <link rel="canonical" href="https://snshero.com/${targetHash}">
  <script>
    var search = window.location.search || '';
    window.location.replace('/' + '${targetHash}' + search);
  </script>
</head>
<body style="font-family: monospace; padding: 20px; background: #fdfcfc; color: #201d1d;">
  <p>섹션으로 이동 중입니다: <a href="/${targetHash}">/${targetHash}</a></p>
</body>
</html>`;
      // 0a. Write directory index redirect: dist/[route]/index.html (e.g. dist/home/index.html -> /#home)
      fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');

      // 0b. Write clean flat file: dist/[route].html ONLY for non-home legacy routes.
      // CRITICAL GUARD: dist/home.html is Vite's compiled master React SPA template containing
      // the full application bundle, #root mount point, and early client-side hash redirect.
      // It must strictly NEVER be overwritten with a redirect stub. Overwriting dist/home.html
      // destroys downstream generators (dist/404.html, generate-news-seo.ts, generate-video-seo.ts).
      const flatHtmlPath = path.join(distDir, `${cleanRoute}.html`);
      const isProtectedTemplate =
        cleanRoute === 'home' ||
        cleanRoute === 'index' ||
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
    }

    // 1. Determine HTML content for the route
    let targetHtml = cleanBaseHtml;
    if (cleanRoute === 'bench' || cleanRoute === 'benchmark' || cleanRoute === 'shbp') {
      targetHtml = cleanBenchHtml;
    } else if (cleanRoute === 'novel' || cleanRoute === 'book' || cleanRoute === 'webtoon') {
      const routeCanonical = `https://snshero.com/${cleanRoute}`;
      targetHtml = cleanNovelHtml
        .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${routeCanonical}" />`)
        .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/, `<meta property="og:url" content="${routeCanonical}" />`)
        .replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/, `<meta property="twitter:url" content="${routeCanonical}" />`);
    }

    // 2. Write directory index: dist/[route]/index.html
    fs.writeFileSync(path.join(routeDir, 'index.html'), targetHtml, 'utf8');

    // 3. Write clean URL extensionless file: dist/[route].html for ALL routes (both flat and nested)
    const flatHtmlPath = path.join(distDir, `${cleanRoute}.html`);
    // Strict isolation guard: never overwrite dist/index.html (standalone landing) or dist/home.html (master SPA template)
    const isProtectedMasterTemplate =
      cleanRoute === 'home' ||
      cleanRoute === 'index' ||
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
  }
  console.log(`[post-build] Generated ${routes.length} static SPA route fallback pages (including .html root clean URLs)`);
}

// 4.1 Ensure public/gwent is copied to dist/gwent
const publicGwentDir = path.join(publicDir, 'gwent');
const distGwentDir = path.join(distDir, 'gwent');
if (fs.existsSync(publicGwentDir) && !fs.existsSync(path.join(distGwentDir, 'index.html'))) {
  fs.cpSync(publicGwentDir, distGwentDir, { recursive: true });
  console.log('[post-build] Synced public/gwent to dist/gwent');
}

// 5. Ensure 404.html fallback (uses clean SPA template so deep links load client-side router with absolute /assets/ paths)
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(homeHtmlPath)) {
  fs.writeFileSync(notFoundPath, cleanBaseHtml, 'utf8');
  console.log('[post-build] Generated 404.html with absolute asset paths from cleanBaseHtml');
} else if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('[post-build] Fallback 404.html copied from index.html');
}

// 5.1 Ensure dist/home.html also has absolute asset paths
if (fs.existsSync(homeHtmlPath)) {
  fs.writeFileSync(homeHtmlPath, cleanBaseHtml, 'utf8');
  console.log('[post-build] Normalized dist/home.html asset paths to absolute');
}
```

---

## 5. Verification Method

To independently verify this implementation:

1. **Verify Nested Route Static Files Exist**:
   ```bash
   ls -la dist/wiki/card.html
   ls -la dist/wiki/card/index.html
   ls -la dist/r/hanguk.html
   ls -la dist/r/hanguk/index.html
   ls -la dist/r/hanguk/comments/post_vibecoding_master.html
   ls -la dist/r/hanguk/comments/post_vibecoding_master/index.html
   ```

2. **Verify Live Clean URL HTTP Responses (No Landing Page Fallback)**:
   ```bash
   # Nested route without trailing slash must return id="root":
   curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
   # Expected: id="root"

   curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
   # Expected: id="root"

   curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'
   # Expected: id="root"
   ```

3. **Verify Strict Template Isolation**:
   ```bash
   # Standalone Landing must contain #landing-root:
   curl -s http://localhost:3000/ | grep -o 'id="[^"]*"'
   # Expected: id="landing-root"

   curl -s http://localhost:3000/index.html | grep -o 'id="[^"]*"'
   # Expected: id="landing-root"

   # Master SPA template must contain #root:
   curl -s http://localhost:3000/home.html | grep -o 'id="[^"]*"'
   # Expected: id="root"
   ```

4. **Invalidation Conditions**:
   - If `curl -s http://localhost:3000/wiki/card` returns `id="landing-root"`.
   - If `dist/home.html` contains `<meta http-equiv="refresh"` instead of `<div id="root">`.
   - If `dist/index.html` contains `<div id="root">` instead of `<div id="landing-root">`.
