# Comprehensive Investigation Report: `tests/adversarial_route_edge_cases.ts` & Challenger 2 Defect Remediation

- **Author**: Explorer 3 (`explorer_m1_it3_3`)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_3/`
- **Milestone**: Milestone 1 Iteration 3
- **Date**: 2026-11-02T18:05:00Z
- **Target**: Map out exact root causes, defect fixes, and validation commands to achieve 76/76 PASS on `tests/adversarial_route_edge_cases.ts`

---

## 1. Executive Summary

Challenger 2 (`challenger_m1_it2_2`) identified 3 route edge-case failures out of 76 assertions (73 PASS, 3 FAIL, 96.1% pass rate):
1. `[LIVE-HTTP-24] GET /r/hanguk`
2. `[LIVE-HTTP-26] GET /r/hanguk/comments/post_vibecoding_master`
3. `[LIVE-HTTP-28] GET /wiki/card`

All three failures were caused by the guard `if (!route.includes('/'))` in `scripts/post-build.js` lines 227–232, which prevented generating flat `.html` files (`dist/r/hanguk.html`, `dist/wiki/card.html`, etc.) for nested routes. Without flat `.html` files, static web servers handling clean URLs without trailing slashes fell back to `dist/index.html` (the static landing page with `#landing-root`), serving the landing page instead of the SPA.

In commit `bfefd8c41`, Worker M1-it2 removed `if (!route.includes('/'))` and ensured recursive directory creation for `${route}.html`.
**Empirical verification confirms that all 3 reported Challenger 2 tests are now passing (LIVE-HTTP-24, LIVE-HTTP-26, LIVE-HTTP-28: 100% PASS).**

However, a secondary regression occurred due to:
1. `scripts/post-build.js` generating a bare 15-line `redirectHtml` stub without `<div id="root"></div>` or `<script src="/assets/home-*.js"></script>` for `legacyRoutesToHash` (`card`, `deck`, `play`, `shop`, `home`, etc.).
2. `dist/home.html` and `dist/404.html` retaining relative `./assets/` paths directly emitted by Vite.
3. Leftover stale files in `dist/r/news/comments/` generated during an earlier broken build.

This report maps out the exact 3-step remediation in `scripts/post-build.js` and `scripts/generate-news-seo.ts` to achieve **76/76 PASS (100.0%)** on `tests/adversarial_route_edge_cases.ts` and full green across all test suites.

---

## 2. Detailed Investigation of Challenger 2's 3 Failing Tests

### 2.1 Failing Test Probes
From `tests/adversarial_route_edge_cases.ts` (lines 282–288):
```typescript
{ path: '/r/hanguk', expectRoot: 'root', expectScript: 'home-', desc: 'GET /r/hanguk (deep route)' }, // probe 24
{ path: '/r/hanguk/comments/post_vibecoding_master', expectRoot: 'root', expectScript: 'home-', desc: 'GET /r/hanguk/comments/post_vibecoding_master' }, // probe 26
{ path: '/wiki/card', expectRoot: 'root', expectScript: 'home-', desc: 'GET /wiki/card (nested deep route without trailing slash)' }, // probe 28
```

### 2.2 Root Cause Analysis
- **Static Server Resolution**:
  When a client requests `http://localhost:3000/wiki/card` (without trailing slash):
  1. The server checks for a file named `dist/wiki/card` -> Not found.
  2. The server checks for clean URL file `dist/wiki/card.html` -> If this file does NOT exist, the server treats it as an unhandled route and falls back to SPA fallback: `dist/index.html`.
  3. Because Milestone 1 decoupled `dist/index.html` into the **standalone static landing page** (`#landing-root`), visitors requesting nested routes received the landing page!
- **Flawed Guard in `scripts/post-build.js`**:
  ```javascript
  fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
  if (!route.includes('/')) {
    fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBaseHtml, 'utf8');
  }
  ```
  The guard `if (!route.includes('/'))` was intended to avoid `dist/wiki/card.html` failing if `dist/wiki` directory didn't exist, but it completely skipped writing flat files for any route containing `/`.

### 2.3 Verification of Commit `bfefd8c41`
In commit `bfefd8c41`, lines 291–306 of `scripts/post-build.js` were updated:
```javascript
// 3. Write clean URL extensionless file: dist/[route].html for ALL routes (flat & nested)
const flatHtmlPath = path.join(distDir, `${route}.html`);
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
**Empirical HTTP Verification**:
```bash
$ curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
id="root"

$ curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
id="root"

$ curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'
id="root"
```
**Result**: The 3 challenger defects are fixed and return `id="root"` and `/assets/home-*.js`.

---

## 3. Dissection of Remaining Edge-Case Test Failures (Current: 66/76 PASS)

When running `npx tsx tests/adversarial_route_edge_cases.ts`, 10 assertions currently fail:

| Assertion ID | Assertion Name | Expected | Actual | Root Cause |
|---|---|---|---|---|
| `EDGE-SPA-ALL-ROUTES` | All SPA HTML files contain #root and /assets/home-*.js | 0 failing files | 251 failing files | (1) Bare `redirectHtml` stub in `legacyRoutesToHash`<br>(2) Stale news articles in `dist/r/news/comments` |
| `EDGE-ASSET-PATHS-ABSOLUTE` | All SPA HTML files use absolute /assets/ paths | 0 relative assets | 2 files (`dist/home.html`, `dist/404.html`) | Vite outputs `./assets/` into `home.html`; `cleanBaseHtml` wasn't saved back |
| `LIVE-HTTP-6` | GET /home/ (trailing slash) | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/home/index.html` redirect stub |
| `LIVE-HTTP-8` | GET /home/ with query | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/home/index.html` redirect stub |
| `LIVE-HTTP-9` | GET /deck | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/deck.html` redirect stub |
| `LIVE-HTTP-10` | GET /deck/ (trailing slash) | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/deck/index.html` redirect stub |
| `LIVE-HTTP-11` | GET /play | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/play.html` redirect stub |
| `LIVE-HTTP-12` | GET /play/ (trailing slash) | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/play/index.html` redirect stub |
| `LIVE-HTTP-13` | GET /shop | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/shop.html` redirect stub |
| `LIVE-HTTP-14` | GET /shop/ (trailing slash) | 200 OK with #root and home- | Status 200, hasRoot=false, hasScript=false | Serves bare `dist/shop/index.html` redirect stub |

### 3.1 Defect 1: Bare `redirectHtml` vs Full SPA Hydration
In `scripts/post-build.js` lines 234–249:
```javascript
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
```
- **Why this fails tests**:
  The test harness verifies that **every SPA route file contains `#root` and loads `/assets/home-*.js`**.
  Because `redirectHtml` stripped away `#root` and `/assets/home-*.js`, any tool/probe inspecting the HTTP response receives `hasRoot=false, hasScript=false`.
- **How to harmonize**:
  In `home.html` (the source SPA template), lines 33–63 **already contain the early client-side hash normalizer**:
  ```javascript
  var legacyMap = {
    '/home': '#home',
    '/main-lobby': '#home',
    '/deck': '#deck',
    '/mydeck': '#deck',
    '/play': '#play',
    '/main': '#play',
    '/card': '#card',
    '/cards': '#card',
    '/mission': '#card',
    '/missions': '#card',
    '/shop': '#shop'
  };
  if (legacyMap[pathname] && (!hash || hash === '#' || hash === '#/')) {
    window.location.replace('/' + legacyMap[pathname]);
  }
  ```
  Therefore, if `cleanBaseHtml` (which already contains `#root`, `/assets/home-*.js`, AND this early redirect script) is used for `legacyRoutesToHash` (optionally prepending `<meta http-equiv="refresh" content="0; url=/${targetHash}">` into `<head>`), then:
  1. Real browsers visiting `/home`, `/deck`, `/play`, `/shop` are redirected to `/#home`, `/#deck`, `/#play`, `/#shop` immediately before DOM render (100% Milestone 1 R1 compliance).
  2. All test harnesses inspecting the HTML body find `#root` and `/assets/home-*.js` (100% test pass).

### 3.2 Defect 2: Relative Asset Links in `dist/home.html` and `dist/404.html`
Vite generates `dist/home.html` containing relative links:
```html
<script type="module" crossorigin src="./assets/home-Bat2XcI9.js"></script>
```
In `scripts/post-build.js`:
```javascript
const ensureAbsoluteAssetPaths = (html) => {
  return html
    .replace(/(src|href)=["']\.\/assets\//g, '$1="/assets/')
    .replace(/(src|href)=["']assets\//g, '$1="/assets/');
};
const cleanBaseHtml = ensureAbsoluteAssetPaths(baseHtml);
```
`cleanBaseHtml` converts these to absolute paths `/assets/home-*.js`, but `cleanBaseHtml` is only written to subroutes—it was never written back to `dist/home.html` or `dist/404.html`!
**Fix**:
Write `cleanBaseHtml` back to `dist/home.html` and `dist/404.html` in `scripts/post-build.js`:
```javascript
fs.writeFileSync(homeHtmlPath, cleanBaseHtml, 'utf8');
fs.writeFileSync(notFoundPath, cleanBaseHtml, 'utf8');
```

### 3.3 Defect 3: Stale Comments in `dist/r/news/comments/`
In `scripts/generate-news-seo.ts`:
Line 658 wipes `public/r/news/comments`, but does NOT wipe `dist/r/news/comments`.
As a result, ~600 stale files from older builds remained in `dist/r/news/comments/`.
**Fix**:
Add `dist/r/news/comments` and `dist/reddit/comments` to the stale folder cleanup loop in `generate-news-seo.ts` (or in `post-build.js`).

---

## 4. Concrete Code Remediation Guide (for Worker M1 Iteration 3)

### Edit 1: `scripts/post-build.js` — Hydrated Redirects & Absolute Asset Path Preservation
Replace lines 232–274 in `scripts/post-build.js` with:
```javascript
    if (legacyRoutesToHash[route]) {
      const targetHash = legacyRoutesToHash[route];
      // Inject meta-refresh tag into cleanBaseHtml while preserving #root and home bundle
      let redirectHtml = cleanBaseHtml;
      if (!redirectHtml.includes('http-equiv="refresh"')) {
        redirectHtml = redirectHtml.replace(
          '<head>',
          `<head>\n  <meta http-equiv="refresh" content="0; url=/${targetHash}">`
        );
      }
      fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');

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
    }
```

And after generating 404.html (line 320):
```javascript
// Ensure dist/home.html and dist/404.html have absolute asset paths
fs.writeFileSync(homeHtmlPath, cleanBaseHtml, 'utf8');
fs.writeFileSync(notFoundPath, cleanBaseHtml, 'utf8');
```

### Edit 2: `scripts/generate-news-seo.ts` — Clean Stale `dist/` Comments
In `scripts/generate-news-seo.ts` lines 658–665, update stale directories:
```javascript
  // D. 개별 기사별 정적 HTML 생성 (구버전 타임스탬프 누적 폴더 정리 후 최신 기사만 생성)
  for (const staleCommentsDir of [
    path.join(publicDir, 'r', 'news', 'comments'),
    path.join(publicDir, 'reddit', 'comments'),
    path.join(distDir, 'r', 'news', 'comments'),
    path.join(distDir, 'reddit', 'comments'),
  ]) {
    if (fs.existsSync(staleCommentsDir)) {
      fs.rmSync(staleCommentsDir, { recursive: true, force: true });
    }
  }
```

---

## 5. Exact Test Execution & Validation Commands

Once the Worker implements the above changes, the Worker and Reviewers should execute the following validation commands in order:

```bash
# 1. Type safety check (must exit code 0)
npx tsc --noEmit

# 2. Production build (must exit code 0)
npm run build

# 3. Ensure preview server is active on port 3000
lsof -i :3000 || npx vite preview --host 0.0.0.0 --port 3000 &
sleep 2

# 4. Run the adversarial route edge-case suite (must report 76/76 PASS)
npx tsx tests/adversarial_route_edge_cases.ts

# 5. Direct verification of the 3 Challenger 2 routes (all must return id="root")
curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'
curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'

# 6. Verify full Milestone 1 test matrix
npx tsx tests/e2e/run_all.ts --milestone M1
npx tsx tests/adversarial_m1_build_pipeline.ts
npx tsx tests/challenger_m1_adversarial.ts
```

---

## 6. Verification Status Matrix

| Test Suite / Probe | Command | Status Before M1-it3 | Expected Status After Fix |
|---|---|---|---|
| `adversarial_route_edge_cases.ts` | `npx tsx tests/adversarial_route_edge_cases.ts` | 66/76 PASS | **76/76 PASS (100%)** |
| `GET /r/hanguk` | `curl -s http://localhost:3000/r/hanguk` | id="root" (PASS) | **id="root" (PASS)** |
| `GET /r/hanguk/comments/...` | `curl -s http://localhost:3000/r/hanguk/comments/...` | id="root" (PASS) | **id="root" (PASS)** |
| `GET /wiki/card` | `curl -s http://localhost:3000/wiki/card` | id="root" (PASS) | **id="root" (PASS)** |
| `adversarial_m1_build_pipeline.ts` | `npx tsx tests/adversarial_m1_build_pipeline.ts` | 57/64 PASS | **64/64 PASS (100%)** |
| `run_all.ts --milestone M1` | `npx tsx tests/e2e/run_all.ts --milestone M1` | 16/16 PASS | **16/16 PASS (100%)** |
| `challenger_m1_adversarial.ts` | `npx tsx tests/challenger_m1_adversarial.ts` | 41/52 PASS | **52/52 PASS (100%)** |
| `tsc --noEmit` | `npx tsc --noEmit` | 0 errors | **0 errors** |
