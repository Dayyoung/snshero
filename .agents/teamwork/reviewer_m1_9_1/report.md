# Milestone 1 Quality & Adversarial Review Report

**Reviewer**: `reviewer_m1_9_1`  
**Worker Under Review**: `worker_m1_9`  
**Milestone**: M1 (Hash Route Navigation Core, Legacy Route Elimination & Global 15s Idle Auto-Play Transition)  
**Date**: 2026-11-02T08:31:00Z  

---

## Review Summary

**Verdict**: **REQUEST_CHANGES**

Worker `worker_m1_9` implemented an impressive, authentic, and high-quality foundation for the Milestone 1 requirements:
- The **Global 15-Second Idle Auto-Play Manager** (`src/landing/services/idleAutoPlayManager.ts`) is exceptionally well-engineered with dual-timestamp validation, 250ms throttling, tab visibility awareness, and storage persistence.
- The **Hash Routing Core** in `src/landing/index.ts` is robustly structured with mutex locking (`isProgrammaticRouting`), clean event delegation, and zero DOM collisions.
- All JSX elements with `href="/home"` were completely eliminated from `src/landing/components/` and `src/landing/views/` (0 occurrences verified).
- Both `npx tsc --noEmit` (0 errors) and `npm run build` succeed with exit code 0, and all 16 M1 E2E tests and 26 unit tests pass.

**HOWEVER, an adversarial audit revealed a CRITICAL defect in `scripts/post-build.js` that causes massive functional regression across the production build**:
`scripts/post-build.js` unintentionally overwrites Vite's master SPA template file `dist/home.html` with a 16-line redirect stub. Because subsequent build generators (`scripts/generate-video-seo.ts` and `scripts/generate-news-seo.ts`) and `dist/404.html` use `dist/home.html` as their base template, **all 80 movie/cinema episode pages (`dist/movie/ep-1..40`, `dist/cinema/ep-1..40`), all 120 news pages, and `dist/404.html` have their React SPA player completely stripped and replaced with an immediate redirect to `/#home`**. Any user clicking on an episode or news link from search results is unable to watch or read the content. In addition, `src/routes.ts` contains an unreachable route branch where `/play?ep=...` is shadowed by an earlier unconditional `/play` match.

Because of this build pipeline corruption, changes are requested before M1 can be certified for release.

---

## Findings

### [Critical] Finding 1: `scripts/post-build.js` overwrites `dist/home.html`, corrupting all Movie, Cinema, Reddit, News, and 404 pages in the production build

- **What**: In `scripts/post-build.js`, the loop handling legacy routes writes a 16-line redirect stub (`<meta http-equiv="refresh" content="0; url=/#home">`) to `dist/home.html`.
- **Where**: `scripts/post-build.js:250-258` and lines `301-325`.
- **Why**: 
  1. Vite's production build produces two primary HTML files: `dist/index.html` (the standalone static landing page) and `dist/home.html` (the full React SPA application with `#root`, vendor chunks, and full routing).
  2. When `scripts/post-build.js` iterates over `routes` (which starts with `'home'`), it treats `home` as a legacy route and writes the redirect stub to `path.join(distDir, 'home.html')`.
  3. Consequently, `dist/home.html` is destroyed and replaced with the 16-line redirect stub.
  4. Immediately after this in `scripts/post-build.js`:
     - Line 301: `dist/404.html` is created by copying `dist/home.html` (now a redirect stub).
     - Line 310: `scripts/generate-news-seo.ts` is called with `--template dist/home.html`. It injects article schemas into the redirect stub, wiping out the React app from all 120 news articles and Reddit views (`dist/reddit/index.html`).
     - Line 320: `scripts/generate-video-seo.ts` is called with `--template dist/home.html`. It injects video schemas into the redirect stub, wiping out the video player from all 80 movie & cinema pages (`dist/movie/index.html`, `dist/cinema/index.html`, `dist/movie/ep-1` through `ep-40`, and `dist/cinema/ep-1` through `ep-40`).
  5. Furthermore, `scripts/post-build.js` loses idempotency: running `node scripts/post-build.js` a second time destroys ALL 60 static routes in `dist/` because `spaTemplatePath` (`dist/home.html`) is already corrupted.
- **Suggestion**:
  - In `scripts/post-build.js`, the redirect for legacy `/home` should ONLY be written to `dist/home/index.html` (which handles `/home` and `/home/` requests).
  - Do NOT overwrite `dist/home.html`! Add a guard:
    ```javascript
    if (route !== 'home') {
      fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
    }
    ```
  - Note: `home.html` already contains the client-side redirect in its `<head>` (`lines 34-63`), so direct access to `/home.html` is already handled gracefully by client-side JavaScript without needing to destroy the compiled React SPA template.

---

### [Major] Finding 2: Unreachable route branch in `src/routes.ts` shadows `/play?ep=...` query routes

- **What**: `/play?ep=1`, `/play?episode=40`, `/play?ch=5` query parameters intended to route to the `main` RPG view are shadowed by an earlier unconditional match that returns `'play'`.
- **Where**: `src/routes.ts:486` vs `src/routes.ts:497-502`.
- **Why**: 
  - Line 486:
    ```typescript
    if (cleanPath === '/play' || cleanPath === '/main') return 'play';
    ```
  - Lines 497-502:
    ```typescript
    if (
      cleanPath === '/play' &&
      (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter'))
    ) {
      return 'main';
    }
    ```
  - Because line 486 executes before lines 497-502, `cleanPath === '/play'` matches and returns `'play'` immediately. Lines 497-502 can never be executed (dead code).
- **Suggestion**:
  - Move the episode/chapter query parameter check (lines 497-502) ABOVE line 486, or structure it as:
    ```typescript
    if (cleanPath === '/play') {
      if (params.get('ep') || params.get('episode') || params.get('ch') || params.get('chapter')) {
        return 'main';
      }
      return 'play';
    }
    ```

---

## Adversarial Challenge Analysis

### Challenge 1: Timer Reschedule & Event Throttling Race Condition
- **Assumption**: A 250ms throttle on user inputs might allow the 15-second idle countdown to trigger prematurely if an event arrives near the 15,000ms boundary.
- **Attack Scenario**: User moves mouse at t=14,950ms. Since it is throttled, the timer might expire at t=15,000ms.
- **Audit Result**: **PASSED (Robust defense implemented)**.
  `IdleAutoPlayManager` implements a dual-timestamp mechanism: `lastActivityTime` is updated on EVERY event (even throttled ones). When the timer expires, `onTimerExpired` calculates `elapsed = now - lastActivityTime`. If `elapsed < 15000ms`, it reschedules for the remaining milliseconds instead of triggering. This completely prevents premature triggers.

### Challenge 2: Accidental Full Page Reload on Active Play Screen
- **Assumption**: Inactivity trigger while a player is already actively on `#play` could refresh the page and erase live battle state.
- **Attack Scenario**: Player is on `#play`, idling between turns. Timer fires.
- **Audit Result**: **PASSED (Robust defense implemented)**.
  `IdleAutoPlayManager.executeIdleTransition()` checks `isCurrentlyOnPlayScreen()` and `isAutoModeCurrentlyActive()`. If already on `#play`, it simply sets the auto-play flags and resets the timer in-place with zero page reload or URL navigation.

### Challenge 3: Post-Build Pipeline Idempotency & Downstream Generator Protection
- **Assumption**: `scripts/post-build.js` can be executed repeatedly in continuous integration or incremental build environments without corrupting output.
- **Attack Scenario**: Run `node scripts/post-build.js` twice in succession.
- **Audit Result**: **FAILED (CRITICAL)**.
  The first run overwrites `dist/home.html`. The second run uses the overwritten file as the SPA template, corrupting 100% of all generated SPA routes into 16-line redirect stubs.

---

## Verified Claims

| Claim from worker_m1_9 | Verification Method | Result | Notes |
|------------------------|---------------------|--------|-------|
| `npx tsc --noEmit` passes with 0 errors | Ran `npx tsc --noEmit` directly in repo | **PASS** | Strict TypeScript check passed |
| `npm run build` succeeds with exit code 0 | Ran `npm run build` directly in repo | **PASS** | Vite + Rollup bundled without error |
| 0 instances of `href="/home"` in `src/landing/` | `git grep 'href="/home"' src/landing/components/ src/landing/views/` | **PASS** | 0 JSX matches in components/views |
| Monitored input events count = 8 | Inspected `MONITORED_INPUT_EVENTS` in `idleAutoPlayManager.ts` | **PASS** | Exact 8 events registered with `{ capture: true, passive: true }` |
| Idle timeout default = 15,000ms | Inspected `IdleAutoPlayManager` state & constructor | **PASS** | Exact 15s default |
| Target URL = `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` | Inspected `IdleAutoPlayManager` configuration | **PASS** | Tailscale URL configured with `#play` fallback |
| Auto-play storage flags committed on idle | Unit test `tests/unit_m1_idle_autoplay.ts` & code inspection | **PASS** | `hero_kadan_rpg_auto_mode`, `hero_auto_battle`, etc. set |
| `tests/e2e/run_all.ts --milestone M1` passes | Ran `npx tsx tests/e2e/run_all.ts --milestone M1` | **PASS** | 16/16 assertions pass |
| `tests/unit_m1_idle_autoplay.ts` passes | Ran `npx tsx tests/unit_m1_idle_autoplay.ts` | **PASS** | 26/26 unit tests pass |
| Zero integrity violations (no mocks/facades) | Inspected source code for hardcoded output strings or facades | **PASS** | Implementation is authentic and genuine |
| Production build preserves Movie/Cinema/Reddit/404 | Inspected `dist/movie/ep-1/index.html`, `dist/reddit/index.html`, `dist/404.html` | **FAIL (CRITICAL)** | Corrupted into 16-line redirect stubs |
| Route query precedence for `/play?ep=1` | Inspected `src/routes.ts:486` vs `497` & tested probe | **FAIL (MAJOR)** | Dead code; returns `'play'` instead of `'main'` |

---

## Coverage Gaps

- None in reviewer scope. All 18 modified files, unit tests, E2E runner, build outputs, and runtime edge cases were inspected and tested.

## Unverified Items

- None.

---

## Recommendations for Worker

1. Fix `scripts/post-build.js`:
   - Change line 251 to ensure `flatHtmlPath` for `home` does not overwrite `dist/home.html`.
   - Ensure `spaTemplatePath` retains the full Vite React SPA HTML so `dist/404.html`, `generate-news-seo.ts`, and `generate-video-seo.ts` receive the real SPA bundle.
2. Fix `src/routes.ts`:
   - Move lines 497-502 (`/play?ep=...`) before line 486 so query parameters are evaluated prior to the static `/play` match.
3. Re-run `npm run build` and verify that `dist/movie/ep-1/index.html` contains `<div id="root"></div>` and the video player metadata.
