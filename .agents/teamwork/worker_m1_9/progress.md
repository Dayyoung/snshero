# Progress — worker_m1_9

Last visited: 2026-11-02T08:19:40Z

- [x] Initialized workspace and briefing
- [x] Read ORIGINAL_REQUEST.md, PROJECT.md, and 3 Explorer reports
- [x] Inspect existing routing, HTML headers, views, types, and idle manager
- [x] Implement Hash Routing Core (#home, #deck, #play, #card, #shop) in `src/landing/index.ts` & `src/routes.ts`
- [x] Eliminate all hardcoded `href="/home"` links across `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `Modals.tsx`, `HomeSection.tsx`, `MyDeckSection.tsx`, `App.tsx`
- [x] Implement Global 15s Idle Auto-Play Transition in `src/landing/services/idleAutoPlayManager.ts`
- [x] Add `<head>` URL normalizer in `index.html` and update SEO links
- [x] Add `<head>` URL normalizer in `home.html`
- [x] Update `vite.config.ts` dev/preview rewrite to redirect legacy routes to `/#...`
- [x] Update `scripts/post-build.js` static fallback stubs to redirect cleanly to hash routes
- [x] Run build and test verification (`npx tsc --noEmit`, `npm run build`, `npx tsx tests/e2e/run_all.ts --milestone M1`)
- [x] Commit locally (commits `9d9011bb1` and `ecc34ad2f`), submit Google Form report, and write handoff
