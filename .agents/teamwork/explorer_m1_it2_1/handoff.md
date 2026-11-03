# Handoff Report: `scripts/post-build.js` Template Overwrite Remediation

**Agent**: `explorer_m1_it2_1`  
**Recipient**: `orchestrator_9` / `worker_m1_9`  
**Milestone**: Milestone 1 Iteration 2 Remediation  
**Status**: Task complete (Hard handoff)  

---

## 1. Observation

1. **`dist/home.html` is overwritten with a 16-line redirect stub**:
   - `dist/home.html` currently has 16 lines and 535 bytes:
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
2. **`dist/404.html` is identical to the 16-line redirect stub**:
   - `dist/404.html` has 16 lines and 535 bytes, copied directly from `dist/home.html` at `scripts/post-build.js:303`.
3. **`dist/movie/ep-1/index.html` has lost its React SPA application**:
   - `dist/movie/ep-1/index.html` contains `<meta http-equiv="refresh" content="0; url=/#home">` at line 6, `window.location.replace('/#home')` at line 10, and `<body style="font-family: monospace; padding: 20px; background: #fdfcfc; color: #201d1d;"><p>섹션으로 이동 중입니다: <a href="/#home">/#home</a></p></body>` at lines 146–148. `<div id="root"></div>` is absent.
4. **`scripts/post-build.js` lines 250–258**:
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
   When `route === 'home'`, `flatHtmlPath` resolves to `dist/home.html`, and line 257 writes `redirectHtml` to it.
5. **`src/routes.ts` line 486 vs 497–502**:
   - Line 486: `if (cleanPath === '/play' || cleanPath === '/main') return 'play';`
   - Lines 497–502: `if (cleanPath === '/play' && (params.get('ep') || ...)) return 'main';`
   - Line 486 intercepts `/play` unconditionally before line 497 is reached.

---

## 2. Logic Chain

1. [Supported by Obs 4] In `scripts/post-build.js`, `routes` begins with `'home'`.
2. [Supported by Obs 4] Because `'home'` is in `legacyRoutesToHash`, the script generates a 16-line redirect stub (`redirectHtml`).
3. [Supported by Obs 4] Line 250 writes `dist/home/index.html` (which correctly redirects to `/#home`).
4. [Supported by Obs 1, 4] Lines 251–257 compute `flatHtmlPath = path.join(distDir, 'home.html')`. Because `dist/home.html !== dist/index.html`, line 257 executes and overwrites Vite's compiled React master template in `dist/home.html` with the 16-line redirect stub.
5. [Supported by Obs 2, 4] In lines 300–305, `dist/404.html` is generated via `fs.copyFileSync(templateFor404, notFoundPath)`, where `templateFor404` is `dist/home.html`. As a result, `dist/404.html` becomes the redirect stub.
6. [Supported by Obs 3, 4] In lines 310 and 320, `generate-news-seo.ts` and `generate-video-seo.ts` are invoked with `--template dist/home.html`. They read the redirect stub as their base template, resulting in all 80 movie/cinema pages and 120 news pages being generated from the redirect stub with `<meta http-equiv="refresh" content="0; url=/#home">` and an empty body.
7. [Supported by Obs 5] In `src/routes.ts`, `/play?ep=...` is never evaluated because line 486 executes prior to line 497.

---

## 3. Caveats

- **No source modifications executed**: Under Explorer role constraints, this agent is strictly read-only. No source files were edited.
- **Vite entry points**: `vite.config.ts` configures `main: index.html` and `home: home.html`. The solution relies on `home.html` in the repository root being compiled into `dist/home.html` by `vite build`.
- **Pre-existing client redirect**: `home.html` in the root already contains an early client-side redirect script in its `<head>` (lines 34–63). Thus, if a user directly loads `dist/home.html`, it naturally normalizes to `/#home` without requiring a destructive flat overwrite.

---

## 4. Conclusion

The defect is fully confirmed and localized. The remediation requires:

### A. In `scripts/post-build.js` lines 250–260:
Replace lines 250–259 with:
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

### B. In `scripts/post-build.js` lines 277–286:
Harden step 3 to prevent non-legacy routes from overwriting `dist/home.html`:
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

### C. In `src/routes.ts` lines 484–502:
Restructure the `/play` branch so query parameters are evaluated first:
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
```

---

## 5. Verification Method

To verify the remediation independently after implementation:

```bash
# 1. Run production build
npm run build

# 2. Check dist/home/index.html is the redirect stub
grep -q 'url=/#home' dist/home/index.html && echo "dist/home/index.html redirect: PASS"

# 3. Check dist/home.html is preserved with #root and entry JS
grep -q 'id="root"' dist/home.html && grep -q '/assets/home-' dist/home.html && echo "dist/home.html preserved: PASS"

# 4. Check dist/404.html is preserved with #root
grep -q 'id="root"' dist/404.html && echo "dist/404.html preserved: PASS"

# 5. Check dist/movie/ep-1/index.html has #root and NO redirect stub
grep -q 'id="root"' dist/movie/ep-1/index.html && ! grep -q 'url=/#home' dist/movie/ep-1/index.html && echo "Movie ep-1 preserved: PASS"

# 6. Test post-build idempotency
node scripts/post-build.js
grep -q 'id="root"' dist/home.html && echo "Idempotency preserved: PASS"

# 7. Run test suites
npx tsx tests/e2e/run_all.ts --milestone M1
npx tsx tests/unit_m1_idle_autoplay.ts
npx tsx tests/adversarial_m1_build_pipeline.ts
```

### Invalidation Conditions:
- If `dist/home.html` has size < 10 KB or lacks `<div id="root"></div>`, the fix is invalid.
- If `dist/movie/ep-1/index.html` contains `<meta http-equiv="refresh" content="0; url=/#home">`, the fix is invalid.
- If `node scripts/post-build.js` cannot be run twice consecutively with identical results, idempotency is invalid.
