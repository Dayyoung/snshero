# Milestone 1 Review Handoff Report: reviewer_m1_9_1

- **Reviewer**: `reviewer_m1_9_1`
- **Target**: Milestone 1 deliverables from `worker_m1_9`
- **Verdict**: **REQUEST_CHANGES**
- **Date**: 2026-11-02T08:32:00Z

---

## 1. Observation

1. **Compilation & Existing Tests**:
   - `npx tsc --noEmit` exited with code 0 (zero TypeScript errors).
   - `npm run build` completed with exit code 0.
   - `npx tsx tests/e2e/run_all.ts --milestone M1` passed 16/16 assertions (100.0%).
   - `npx tsx tests/unit_m1_idle_autoplay.ts` passed 26/26 assertions (100.0%).

2. **Core Requirements Verification**:
   - `git grep 'href="/home"' src/landing/components/ src/landing/views/` returned 0 occurrences. All legacy links in `Header.tsx:97`, `Sidebar.tsx:140`, `Footer.tsx:50`, `Modals.tsx:161`, `HomeSection.tsx:41`, `MyDeckSection.tsx:131, 398` were updated to `href="#play"`.
   - `src/landing/services/idleAutoPlayManager.ts` listens to all 8 required events (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`) with `{ capture: true, passive: true }`, throttles to 250ms with dual-timestamp tracking, defaults to 15,000ms timeout, persists auto-mode flags to `localStorage`, and handles `#play` in-place activation without page reload.
   - `src/landing/types.ts` updated nav lists to replace `'미션'` with `'카드'`.
   - `src/App.tsx` handles `case 'card':` and updated `#seo-links` navigation anchors to hash routes.

3. **Critical Defect in `scripts/post-build.js`**:
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
   - When `route === 'home'`, `flatHtmlPath` resolves to `/Users/dayyoung/project/snshero/dist/home.html`.
   - This overwrites Vite's compiled React SPA master bundle `dist/home.html` with the 16-line redirect stub:
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
   - At line 301, `dist/404.html` copies from `dist/home.html` (the redirect stub).
   - At line 310, `scripts/generate-news-seo.ts` executes with `--template dist/home.html`, corrupting all 120 news articles and `dist/reddit/index.html`.
   - At line 320, `scripts/generate-video-seo.ts` executes with `--template dist/home.html`, corrupting all 80 movie & cinema pages (`dist/movie/ep-1..40`, `dist/cinema/ep-1..40`, `dist/movie/index.html`, `dist/cinema/index.html`).
   - Verbatim inspection of `dist/movie/ep-1/index.html` confirmed:
     `lines 6-10`: `<meta http-equiv="refresh" content="0; url=/#home">` and `<script>window.location.replace('/#home' + search);</script>`. The video player and `<div id="root"></div>` are completely absent.
   - Idempotency test: executing `node scripts/post-build.js` a second time destroys all 60 static fallback routes in `dist/`.

4. **Major Defect in `src/routes.ts`**:
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
   - Line 486 always triggers first for `/play`, making lines 497-502 dead code. `/play?ep=1` evaluates to `'play'` instead of `'main'`.

---

## 2. Logic Chain

1. From Observation 1 & 2: The client-side TypeScript implementation of `IdleAutoPlayManager` and `src/landing/` fulfills the core functional requirements of Milestone 1. The code is genuine, free of integrity violations, and passes type-checking.
2. From Observation 3: In the post-build pipeline, `dist/home.html` is the only artifact output by Vite representing the full React SPA application. Overwriting `dist/home.html` with a static 16-line redirect stub starves downstream generators (`generate-news-seo.ts`, `generate-video-seo.ts`, `404.html`) of their base SPA template.
3. Therefore, all 80 animation/movie pages and all 120 news pages in `dist/` become instant redirects to `/#home` with no playable video or readable article content. This is a severe functional regression to production deployment.
4. From Observation 4: The precedence order in `src/routes.ts` shadows episode query parameters, causing `/play?ep=...` deep-links to fail to route to the main RPG story mode.
5. Consequently, changes must be requested before Milestone 1 can be signed off.

---

## 3. Caveats

- Milestone 1 is focused on hash routing, legacy route elimination, and idle auto-play. Full card nurturing parity, shop pack reveals, and responsive AdSense layouts are scheduled for Milestones 2–5.
- The defect in `scripts/post-build.js` is isolated to the post-build file generation logic and does not impact the runtime code in `src/landing/`.

---

## 4. Conclusion

- **Verdict**: **REQUEST_CHANGES**
- **Action Required by Worker**:
  1. Fix `scripts/post-build.js` (line 251) to guard against overwriting `dist/home.html` so that `spaTemplatePath` retains the full React SPA bundle.
  2. Fix `src/routes.ts` by moving lines 497-502 above line 486 so `/play?ep=...` query routes correctly resolve to `'main'`.
  3. Run `npm run build` and verify that `dist/movie/ep-1/index.html` contains `<div id="root"></div>` and the YouTube video player elements.

---

## 5. Verification Method

To verify these findings:

```bash
# 1. Check corruption of movie pages after build
npm run build
grep 'window.location.replace' dist/movie/ep-1/index.html
# If corrupted, this prints: window.location.replace('/' + '#home' + search);

# 2. Check 404.html
cat dist/404.html
# If corrupted, this is a 16-line file with url=/#home

# 3. Check dead code in src/routes.ts
npx tsx -e "import { getViewFromPath } from './src/routes'; console.log(getViewFromPath('/play', '?ep=1'));"
# Expected: 'main', Actual: 'play'
```
