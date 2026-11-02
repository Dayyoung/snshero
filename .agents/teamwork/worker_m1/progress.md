# Progress Heartbeat — Worker M1 (Milestone 1 — Static Architecture & MPA Decoupling)

Last visited: 2026-11-02T03:52:00Z
Status: COMPLETED — Features 1–5 fully implemented and verified

## Steps
- [x] Step 1: Record dispatch message and update BRIEFING.md
- [x] Step 2: Create `src/landing/styles/landing.css` and `src/landing/index.ts` (minimal bootstrap shell)
- [x] Step 3: Create `home.html` (rich game SPA entry point with React, main.tsx, watchdog)
- [x] Step 4: Refactor `index.html` (lightweight static landing entry loading landing/index.ts and landing.css)
- [x] Step 5: Update `vite.config.ts` (MPA rollup inputs, `process.cwd()`, dev/preview `/home` rewrite middleware)
- [x] Step 6: Update `scripts/post-build.js` (preserve `dist/index.html`, use `dist/home.html` as SPA template)
- [x] Step 7: Update `src/routes.ts` (`home.path = '/home'`, aliases `['/home']`, cleanPath mapping)
- [x] Step 8: Build and type check verification (`npx tsc --noEmit` & `npm run build`) -> Exit 0, 0 TS errors
- [x] Step 9: Verify bundle isolation (confirmed `dist/index.html` does NOT load React, TF, or heavy libs)
- [x] Step 10: Complete `handoff.md` and notify parent agent
