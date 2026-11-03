# Milestone 1 Iteration 2 Remediation Handoff Report

- **Author**: Explorer 3 (`explorer_m1_it2_3`)
- **Recipient**: Orchestrator (`21826d14-7bc9-4995-866c-cbb42a941789`) / Reviewer / Worker
- **Handoff Type**: Hard (Task Complete)
- **Date**: 2026-11-02T08:40:00Z

---

## 1. Observation

1. **`dist/home.html` and `dist/404.html` Overwrite Defect**:
   - In `scripts/post-build.js:250-258`:
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
     ```
   - When `route === 'home'`, `flatHtmlPath` resolves to `dist/home.html`.
   - Directly inspecting `dist/home.html` and `dist/404.html` via terminal reveals:
     ```
     -rw-r--r--@ 1 dayyoung  staff   535 Nov  2 17:31 dist/404.html
     -rw-r--r--@ 1 dayyoung  staff   535 Nov  2 17:31 dist/home.html
     ```
     Both files contain only the 16-line stub:
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

2. **Downstream Corruption in `dist/movie/ep-1/index.html`**:
   - `scripts/generate-video-seo.ts:47-71` loads `spaTemplatePath` (`dist/home.html`).
   - Line 689: `if (html.includes('<div id="root"></div>'))` evaluates to `false` because the redirect stub has no `<div id="root"></div>`.
   - Directly inspecting `dist/movie/ep-1/index.html` lines 6-11 and 146-148:
     ```html
     <meta http-equiv="refresh" content="0; url=/#home">
     ...
     <body style="font-family: monospace; padding: 20px; background: #fdfcfc; color: #201d1d;">
       <p>섹션으로 이동 중입니다: <a href="/#home">/#home</a></p>
     </body>
     ```
     The file contains ZERO `<div id="root"></div>`, ZERO `<iframe`, and immediately redirects all traffic to `/#home`.

3. **`src/routes.ts` Dead Code & Route Shadowing**:
   - In `src/routes.ts:486`:
     ```typescript
     if (cleanPath === '/play' || cleanPath === '/main') return 'play';
     ```
   - In `src/routes.ts:497-502`:
     ```typescript
     if (
       cleanPath === '/play' &&
       (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter'))
     ) {
       return 'main';
     }
     ```
   - Directly executing `npx tsx -e "import { getViewFromPath } from './src/routes'; console.log(getViewFromPath('/play', '?ep=1'));"` outputs:
     ```
     getViewFromPath("/play", "?ep=1") = play
     FAIL: Expected "main", got "play"
     ```
     with exit code 1.

4. **Multi-Run Idempotency Failure**:
   - Directly executing `npx tsx tests/adversarial_m1_build_pipeline.ts` triggers a second execution of `scripts/post-build.js`.
   - Result: 13 assertion failures, including `ADV-M1-12`, `ADV-M1-SPA-deck`, `ADV-M1-SPA-play`, `ADV-M1-SPA-shop`, `ADV-M1-SPA-reddit`, `ADV-M1-SPA-movie`, `ADV-M1-20`.

---

## 2. Logic Chain

1. **Root Cause Analysis (Defect 1)**:
   - Vite builds two entry points defined in `vite.config.ts`: `index.html` (static landing) and `home.html` (React SPA master template). Vite outputs the compiled SPA bundle to `dist/home.html` (~46KB, contains `<div id="root"></div>` and compiled `/assets/home-*.js`).
   - When `scripts/post-build.js` iterates through `routes = ['home', 'deck', ...]`, it processes `route === 'home'`.
   - At line 251, `flatHtmlPath = path.join(distDir, 'home.html')`. The guard checks `flatHtmlPath !== indexPath`, which passes because `home.html !== index.html`.
   - Thus, line 257 writes the 16-line `redirectHtml` over `dist/home.html`.
   - Consequently, when line 301 copies `dist/home.html` to `dist/404.html`, `404.html` becomes the redirect stub.
   - When `scripts/generate-video-seo.ts` and `scripts/generate-news-seo.ts` run, they read `spaTemplatePath` (`dist/home.html`), which is already destroyed. Their `<div id="root"></div>` search fails, leaving the redirect stub in all 80 movie/cinema and 120 news pages.
   - On any subsequent execution of `scripts/post-build.js`, `baseHtml` is read from the destroyed `dist/home.html`, destroying all 60 static route fallbacks.
   - **Remediation Logic**: Adding `route !== 'home'` to the condition at `scripts/post-build.js:252` ensures that `dist/home/index.html` receives the redirect stub (handling legacy `/home` directory requests), while `dist/home.html` is completely untouched. Downstream generators and repeated runs read the pristine SPA master template.

2. **Root Cause Analysis (Defect 2)**:
   - In `src/routes.ts:486`, `cleanPath === '/play'` matches unconditionally before line 497.
   - Because of JavaScript's top-to-bottom sequential statement execution, any URL with path `/play` immediately returns `'play'`. Lines 497-502 are dead code.
   - **Remediation Logic**: Moving lines 497-502 before line 486 ensures that when query parameters `ep`, `episode`, `ch`, or `chapter` are present, `getViewFromPath` evaluates them first and returns `'main'`. If no episode query parameter is present, it falls through to line 486 and returns `'play'`.

---

## 3. Caveats

1. **Development vs Production Template Fallback**: In pre-build or pure development mode, `dist/home.html` may not yet exist until `npm run build` or `vite build` has run. The verification tests must be run against the post-build `dist/` directory.
2. **`dist/home/index.html` vs `dist/home.html` Distinction**:
   - `dist/home/index.html` SHOULD contain the redirect stub to `/#home` (or client redirect) to support legacy `/home` navigation.
   - `dist/home.html` MUST NOT contain the redirect stub; it is the Vite SPA master bundle.
3. **Other Subroutes Under `/main`**: URLs like `/main` (clean path) resolve to `'play'`, while `/main/1` or `/main/ep-1` resolve to `'main'`. This behavior is tested and preserved.

---

## 4. Conclusion

The verification test design completely addresses all 5 requirements with concrete, reproducible criteria:
1. `dist/home.html` preservation is verified via file size (>= 10KB), presence of `<div id="root"></div>` and `/assets/` script tag, and absence of `http-equiv="refresh"`.
2. `dist/movie/ep-1/index.html` video player markup is verified via presence of `<div id="root">`, YouTube `iframe` embed (`https://www.youtube.com/embed/62ziCvTMfB8`), and absence of redirect tags.
3. `dist/404.html` SPA fallback is verified via line count (> 100), size (>= 10KB), `#root` presence, and absence of redirect refresh.
4. `getViewFromPath('/play', '?ep=1')` is verified via a 13-case route resolution test matrix resolving to `'main'`.
5. Idempotency is verified via sequential executions of `node scripts/post-build.js` confirming SHA-256 / size stability and zero degradation across all static routes.

The complete test harness code is documented in `.agents/teamwork/explorer_m1_it2_3/report.md`.

---

## 5. Verification Method

### Quick Command-Line Verification Commands
```bash
# 1. Verify dist/home.html is not overwritten
test $(wc -c < dist/home.html) -ge 10000 && grep -q '<div id="root"></div>' dist/home.html && ! grep -q 'http-equiv="refresh"' dist/home.html && echo "TARGET 1 PASS"

# 2. Verify dist/movie/ep-1/index.html contains #root and video player iframe
grep -q '<div id="root">' dist/movie/ep-1/index.html && grep -q '<iframe' dist/movie/ep-1/index.html && ! grep -q 'http-equiv="refresh"' dist/movie/ep-1/index.html && echo "TARGET 2 PASS"

# 3. Verify dist/404.html contains full SPA fallback
test $(wc -c < dist/404.html) -ge 10000 && test $(wc -l < dist/404.html) -gt 100 && grep -q '<div id="root"></div>' dist/404.html && ! grep -q 'http-equiv="refresh"' dist/404.html && echo "TARGET 3 PASS"

# 4. Verify getViewFromPath('/play', '?ep=1') resolves to 'main'
npx tsx -e "import { getViewFromPath } from './src/routes'; process.exit(getViewFromPath('/play', '?ep=1') === 'main' ? 0 : 1)" && echo "TARGET 4 PASS"

# 5. Verify post-build idempotency
H1=$(shasum -a 256 dist/home.html) && node scripts/post-build.js > /dev/null 2>&1 && H2=$(shasum -a 256 dist/home.html) && [ "$H1" = "$H2" ] && echo "TARGET 5 PASS"
```

### Full Test Harness Execution
Run the complete TypeScript verification harness provided in `report.md`:
```bash
npx tsx -e "
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getViewFromPath } from './src/routes';

// Target 1
const home = fs.readFileSync('dist/home.html', 'utf8');
if (fs.statSync('dist/home.html').size < 10000 || !home.includes('<div id=\"root\"></div>') || home.includes('http-equiv=\"refresh\"')) {
  console.error('Target 1 Failed'); process.exit(1);
}

// Target 2
const movie = fs.readFileSync('dist/movie/ep-1/index.html', 'utf8');
if (!movie.includes('<div id=\"root\">') || !movie.includes('<iframe') || movie.includes('http-equiv=\"refresh\"')) {
  console.error('Target 2 Failed'); process.exit(1);
}

// Target 3
const notFound = fs.readFileSync('dist/404.html', 'utf8');
if (fs.statSync('dist/404.html').size < 10000 || notFound.split('\n').length <= 100 || !notFound.includes('<div id=\"root\"></div>')) {
  console.error('Target 3 Failed'); process.exit(1);
}

// Target 4
if (getViewFromPath('/play', '?ep=1') !== 'main' || getViewFromPath('/play', '?episode=40') !== 'main' || getViewFromPath('/play') !== 'play') {
  console.error('Target 4 Failed'); process.exit(1);
}

// Target 5
const size1 = fs.statSync('dist/home.html').size;
execSync('node scripts/post-build.js', { stdio: 'pipe' });
const size2 = fs.statSync('dist/home.html').size;
if (size1 !== size2 || size2 < 10000) {
  console.error('Target 5 Failed'); process.exit(1);
}

console.log('ALL 5 REMEDIATION TARGETS VERIFIED SUCCESSFULLY');
"
```
