# Milestone 1 Handoff Report: Hash Routing Core & Idle Auto-Play

- **Worker**: `worker_m1_9`
- **Milestone**: M1 (Hash Route Navigation Core, Legacy Route Elimination & Global 15s Idle Auto-Play Transition)
- **Status**: Completed (Hard Handoff)
- **Date**: 2026-11-02T08:20:00Z

---

## 1. Observation

1. **Hash Routing Core**:
   - `src/landing/index.ts`: Implemented `parseRoute()`, `navigateTo()`, and `renderSectionContent()` with `isProgrammaticRouting` mutex lock to avoid infinite loops between `hashchange` and `popstate`. Selective slot replacement (`landing-main-slot`, `landing-header-slot`, `landing-sidebar-slot`) prevents whole-page DOM thrashing.
   - `src/landing/types.ts`: Updated `TOP_NAV_ITEMS` and `SIDE_NAV_ITEMS` replacing `'미션'` with `'카드'`. Exported `RouteOptions`.
   - `src/routes.ts`: Updated `VIEW_ROUTES` core entries (`home`, `main`, `mydeck`, `play`, `shop`) to canonical hash paths (`#home`, `#deck`, `#play`, `#card`, `#shop`) and added `card` route with full metadata and aliases. Updated `getViewPath()` and `getViewFromPath()` prioritizing hash anchor parsing over pathname strings.
   - `src/App.tsx`: Added `case 'card':` to the main view renderer and updated hidden `#seo-links` navigation links from `/home`, `/deck`, `/play`, `/shop` to `#home`, `#deck`, `#play`, `#card`, `#shop`.

2. **Legacy Route Elimination & 3-Layer Redirect Architecture**:
   - Grep verification across `src/landing/` confirmed **0 matches** for `href="/home"`.
   - Exactly 7 hardcoded `href="/home"` links were identified and migrated:
     - `src/landing/components/Header.tsx:97`: `<a href="#play" data-nav="play">게임 시작 →</a>`
     - `src/landing/components/Sidebar.tsx:140`: `<a href="#play" data-nav="play">게임 시작하기 →</a>`
     - `src/landing/components/Footer.tsx:50`: `<a href="#play" data-nav="play"><span>[→] 원클릭 웹게임 바로가기</span></a>`
     - `src/landing/components/Modals.tsx:161`: `<a href="#play" data-nav="play">게스트로 게임 시작하기 →</a>`
     - `src/landing/views/HomeSection.tsx:41`: `<a href="#play" data-nav="play">웹게임 즉시 시작 →</a>`
     - `src/landing/views/MyDeckSection.tsx:131`: `<a href="#play" data-nav="play">웹게임 출격 →</a>`
     - `src/landing/views/MyDeckSection.tsx:398`: `<a href="#play" data-nav="play">실전 배틀 출격 →</a>`
   - `vite.config.ts`: Added dev (`configureServer`) and preview (`configurePreviewServer`) HTTP 302 redirects intercepting `/home`, `/deck`, `/play`, `/main`, `/card`, `/shop` and forwarding to `/#...`.
   - `scripts/post-build.js`: Generated clean HTML redirect stubs for all legacy routes in `dist/` (e.g. `dist/deck/index.html`, `dist/play/index.html`, `dist/card/index.html`) using `<meta http-equiv="refresh">` and `location.replace`.
   - `index.html` & `home.html`: Added early inline `<script>` in `<head>` that immediately inspects `pathname` and `hash`, normalizing empty or `#` URLs to `/#home` via `history.replaceState` without polluting the browser back-stack.

3. **Global 15-Second Idle Auto-Play Transition**:
   - `src/landing/services/idleAutoPlayManager.ts`: Created production singleton `IdleAutoPlayManager`.
   - Monitored input events: All 8 required events (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`) registered on `window` using `{ capture: true, passive: true }`.
   - Event throttling: 250ms throttle with dual-timestamp validation (`lastActivityTime` vs `lastResetTime`) ensuring exact 15,000ms idle threshold.
   - User interaction: Any interaction immediately resets the countdown.
   - Expiration actions: Sets `hero_kadan_rpg_auto_mode = 'true'`, `hero_kadan_rpg_auto_mode_season1 = 'true'`, `hero_auto_battle = 'true'`, `hero_auto_loop_mode = 'true'`, dispatches `hero_kadan_rpg_auto_mode_updated` (`detail: { autoMode: true }`) and `snshero_idle_autoplay_triggered`.
   - Guard against redundant reloads: If the user is already viewing `#play` and auto-play is already running, page reloads are bypassed, seamlessly restarting the timer. If on `#play` with auto-play inactive, it activates in-place with zero page reload.
   - Navigation target: Transitions to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` (with local relative fallback `#play` for offline/localhost environments).
   - Bootstrap integration: Initialized in `src/landing/index.ts` (`mountLanding()`) and `src/main.tsx` (`if (!isApiRoute)`). Global handle exposed on `window.__SNSHERO_IDLE_AUTOPLAY__`.

4. **Build, Test & Audit Verification**:
   - `npx tsc --noEmit`: 0 errors (exit code 0).
   - `npm run build`: Production bundle succeeded with exit code 0 (`dist/index.html` built, 60 static route fallbacks and SEO assets generated).
   - `npx tsx tests/e2e/run_all.ts --milestone M1`: 16/16 assertions PASS (100.0%).
   - `npx tsx tests/unit_m1_idle_autoplay.ts`: 26/26 assertions PASS (100.0%).
   - Local git commits: `9d9011bb1` and `ecc34ad2f` created. (No `git push`).
   - Mandatory Google Form report: submitted successfully via `skills/report-ex/scripts/submit_report.py`.
   - `WORK_LOGS.md`: Appended completion log.

---

## 2. Logic Chain

1. **From Requirements to Implementation**:
   - The user request mandated full client-side hash routing (`#home`, `#deck`, `#play`, `#card`, `#shop`) and the total elimination of standalone routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`).
   - By creating the centralized `parseRoute()` and `navigateTo()` controllers in `src/landing/index.ts` and updating `src/routes.ts`, any route resolution defaults cleanly to `#home` or the appropriate hash view.
   - By introducing `isProgrammaticRouting`, programmatically triggered hash modifications do not trigger reentrant `hashchange` or `popstate` loops.
   - By replacing all 7 hardcoded `href="/home"` links with `href="#play"` / `data-nav="play"`, users never escape the static SPA landing shell into legacy standalone pages.
   - By implementing the 3-layer redirect strategy (Vite dev/preview 302 -> static post-build HTML stubs -> `<head>` replaceState), direct URL hits to `/deck`, `/play`, etc. cleanly normalize to `/#deck`, `/#play`, etc.
   - By constructing `IdleAutoPlayManager` with `{ capture: true, passive: true }` over all 8 primary interaction vectors, user activity is reliably detected even within deeply nested modals or custom canvas views. The 250ms throttle prevents GC stutter on high-polling devices while guaranteeing the exact 15,000ms inactivity countdown.

2. **From Implementation to Verification**:
   - Running `npx tsc --noEmit` verifies strict TypeScript type-checking across all modified files.
   - Running `npm run build` verifies Vite bundling, Rollup code splitting, and `scripts/post-build.js` static fallback generation without warnings or errors.
   - Running `npx tsx tests/e2e/run_all.ts --milestone M1` executes all 16 M1 test assertions across Tiers 1 through 4, confirming feature contracts, boundary cases, pairwise state transitions, and real-world workloads.
   - Running `tests/unit_m1_idle_autoplay.ts` directly exercises the genuine runtime logic of `IdleAutoPlayManager` and hash routing functions.

---

## 3. Caveats

- Milestone 1 establishes the hash routing core, legacy route elimination, and idle auto-play manager. The specific visual enhancements for Milestone 2 (`#home` logos, Cool Card Deck fan-fold preview, `#deck` slot editing) and Milestone 3 (`#play` tile adventure & battle loop) will be further developed in subsequent milestones as planned in `PROJECT.md`.
- No other caveats; all Milestone 1 requirements are fully met.

---

## 4. Conclusion

Milestone 1 is **100% complete, verified, and ready for audit**:
- Canonical hash routing (`#home`, `#deck`, `#play`, `#card`, `#shop`) is active and operational.
- All legacy `/home` links in the landing UI are eliminated.
- 3-layer redirect system for legacy standalone routes is deployed.
- Global 15-second idle auto-play transition is fully functional with storage persistence and event dispatching.
- TypeScript check (`npx tsc --noEmit`), production build (`npm run build`), and E2E test runner (`tests/e2e/run_all.ts --milestone M1`) all pass with 0 errors and 100% pass rate.
- Changes are committed locally (`9d9011bb1`, `ecc34ad2f`), Google Form report submitted, and `WORK_LOGS.md` updated.

---

## 5. Verification Method

To independently reproduce and verify this work:

```bash
# 1. Type-check verification (0 errors expected)
npx tsc --noEmit

# 2. Production build verification (exit code 0 expected)
npm run build

# 3. Dedicated unit test verification (26/26 PASS expected)
npx tsx tests/unit_m1_idle_autoplay.ts

# 4. Master E2E runner for Milestone 1 (16/16 PASS expected)
npx tsx tests/e2e/run_all.ts --milestone M1

# 5. Verify zero instances of href="/home" in src/landing
git grep 'href="/home"' src/landing/

# 6. Verify static redirect stubs generated in dist/
cat dist/deck/index.html
cat dist/play/index.html
```
