# Progress Log — Challenger M1-2

**Last visited**: 2026-11-02T04:02:00Z  
**Status**: COMPLETE  

## Tasks
- [x] Read DISPATCH.md, ORIGINAL_REQUEST.md, PROJECT.md, TEST_READY.md, worker_m1/handoff.md
- [x] Update BRIEFING.md and progress.md
- [x] Investigate `scripts/post-build.js`, `vite.config.ts`, `src/routes.ts`, `index.html`, `home.html`
- [x] Run `npx tsc --noEmit` (Exit code 0) and `npm run build` (Exit code 0)
- [x] Run `npx tsx tests/e2e/run_all.ts --milestone M1` (9/9 pass)
- [x] Empirically inspect `dist/` directory:
  - Verified `dist/index.html` is preserved as pure static landing (mounts `#landing-root`, loads `assets/main-*.js`, 0 vendor-react / vendor-tf / vendor-fb dependencies, bundle size < 2 KB JS).
  - Verified `dist/home.html` and `dist/home/index.html` exist and contain SPA `#root` and `assets/home-*.js`.
  - Audited subroutes: Found that while `dist/deck/index.html`, `dist/play/index.html`, `dist/shop/index.html` have SPA `#root`, `dist/reddit/index.html`, `dist/movie/index.html`, `dist/animation/index.html`, `dist/cinema/index.html`, `dist/r/news/index.html`, and 500+ sub-pages (`dist/movie/ep-*`, `dist/cinema/ep-*`, `dist/r/news/comments/*`) have `#landing-root` and load `main-*.js` instead of SPA `root` and `home-*.js`.
- [x] Authored and executed adversarial test harness `tests/adversarial_m1_build_pipeline.ts`:
  - 62 PASS, 2 FAIL (`ADV-M1-SPA-reddit` and `ADV-M1-SPA-movie`).
  - Isolated root cause: `scripts/generate-news-seo.ts` (line 625) and `scripts/generate-video-seo.ts` (line 700) hardcode `path.join(distDir, 'index.html')` as their base template, which in M1 is now the static landing page. They overwrite post-build SPA routes and also poison `public/movie`, `public/animation`, `public/cinema`, `public/reddit`.
- [x] Formulated verdict: **REQUEST_CHANGES**
- [x] Write `handoff.md` (`.agents/teamwork/challenger_m1_2/handoff.md`)
- [x] Deliver report to parent orchestrator via `send_message`
