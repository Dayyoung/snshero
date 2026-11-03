# Milestone 1 Handoff Report: Global 15-Second Idle Auto-Play Transition Architecture

- **Author**: explorer_m1_9_3 (Explorer 3 for Milestone 1)
- **Target Recipient**: Parent Orchestrator (21826d14-7bc9-4995-866c-cbb42a941789)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_3/`
- **Handoff Type**: Hard Handoff (Investigation & Architecture Design Complete)

---

## 1. Observation

1. **Bootstrap Architecture & Entrypoint Separation**:
   - `index.html` (lines 723–726) loads `/src/landing/index.ts` and renders into `<div id="landing-root"></div>`.
   - `src/landing/index.ts` (lines 30–55) manages `state.activeView` across `['home', 'deck', 'play', 'card', 'shop']` via `renderApp()` and hash listener (`window.addEventListener('hashchange', ...)`).
   - `home.html` (line 778) loads `/src/main.tsx` and mounts React `<App />` into `<div id="root"></div>`.
   - `src/landing/services/idleAutoPlayManager.ts` currently **does not exist**; `src/landing/services/` contains only `assetCatalog.ts`, `cardNurtureStore.ts`, and `webtoonCatalog.ts`.

2. **Auto-Play State & Event Infrastructure**:
   - `src/hooks/useKadanRpgProgress.ts` (lines 352–367): Listens to `window.addEventListener('hero_kadan_rpg_auto_mode_updated', handleAutoModeUpdated)`.
   - `src/views/KadanRpgView.tsx` (lines 259–281): Reads `localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true'` to activate `isAutoPlayActive` and progresses chapters hands-free.
   - `src/App.tsx` (lines 5697–5698) and `src/components/Navbar.tsx` (lines 130–131): Sets `localStorage.setItem('hero_kadan_rpg_auto_mode', 'true')` and dispatches `CustomEvent('hero_kadan_rpg_auto_mode_updated', { detail: { autoMode: true } })`.

3. **URL & Navigation Contracts**:
   - In `PROJECT.md` (lines 68–72, 80–84):
     `Trigger action: Sets localStorage.setItem('hero_kadan_rpg_auto_mode', 'true') and executes window.location.href = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play'`.
   - In `tests/e2e/types.ts` (lines 80–84):
     `export const IDLE_AUTO_PLAY_CONFIG = { timeoutMs: 15000, targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play', autoModeStorageKey: 'hero_kadan_rpg_auto_mode' } as const;`.
   - In `tests/e2e/helpers.ts` (lines 131–180): Reference implementation `ReferenceIdleAutoPlayManager` exists in test helpers, confirming the interface contract.

---

## 2. Logic Chain

1. **Detection Guarantee (Capture Phase)**:
   - If event listeners are registered with standard bubbling on `window`, any component that invokes `event.stopPropagation()` (such as nested card modals, drawer sidebars, or dialogue choices) prevents the event from reaching the window, falsely triggering the idle countdown during active user play.
   - Therefore, all 8 input events (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`) must be attached to `window` with `{ capture: true, passive: true }`.

2. **Performance & GC Optimization (Throttling)**:
   - Modern gaming mice and high-refresh trackpads fire up to 1000 event ticks/sec. Canceling and reallocating `setTimeout` at 1000Hz causes severe main-thread garbage collection and stutter.
   - A 250ms throttle threshold with dual-timestamp tracking (`lastResetTime` vs `lastActivityTime`) ensures timer reschedule occurs at most 4 times per second, while post-timeout elapsed verification guarantees exact 15,000ms idle accuracy.

3. **Idempotency on `#play`**:
   - If a player is already watching auto-play on `#play`, triggering `window.location.href = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play'` would disrupt the ongoing battle and reload the view.
   - By verifying `isCurrentlyOnPlayScreen()` and `hero_kadan_rpg_auto_mode === 'true'`, redundant navigations are bypassed, simply refreshing the idle timer.
   - Conversely, if the user is on `#play` with auto-play paused, reaching 15s idle engages auto-play in-place with zero page reload.

4. **Universal Multi-Host Navigation**:
   - While production runs on `https://dayyoung-macbookpro.tail3717a4.ts.net/#play`, developers run on `localhost:3000` and automated test runners run headless.
   - By detecting `localhost` / `127.0.0.1`, the manager gracefully falls back to relative hash navigation (`#play`), preventing broken cross-network redirects during test suites.

---

## 3. Caveats

1. **Background Tab Throttling**:
   - Browsers throttle or freeze `setTimeout` when tabs are inactive (`document.hidden === true`). The manager must listen to `visibilitychange` so that returning to the tab resets the 15-second timer rather than instantly triggering an idle redirect upon focus.
2. **Device-Specific Pointer Events**:
   - On stylus/pen devices, `pointerdown` and `pointermove` may fire without standard mouse events. Listening to `pointerdown` alongside `touchstart` and `mousedown` guarantees 100% device coverage.

---

## 4. Conclusion

The specification for `src/landing/services/idleAutoPlayManager.ts` is complete and fully reconciled with both the static landing (`index.html`) and SPA app (`home.html` / `App.tsx`):
- Singleton architecture with `initIdleAutoPlay(options?: IdleAutoPlayOptions)`.
- Listens to 8 required input events with `{ capture: true, passive: true }`.
- Throttles reset execution to 250ms while preserving exact 15,000ms precision.
- Writes 4 LocalStorage flags (`hero_kadan_rpg_auto_mode`, `hero_kadan_rpg_auto_mode_season1`, `hero_auto_battle`, `hero_auto_loop_mode`) and dispatches `hero_kadan_rpg_auto_mode_updated`.
- Prevents redundant reloads when already on `#play` with auto-mode active.
- Navigates to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` with relative hash fallback for local test harnesses.
- Wireable directly into `src/landing/index.ts` (`mountLanding()`) and `src/main.tsx`.

---

## 5. Verification Method

To verify the design once implemented:

1. **Unit Test Verification**:
   - Run the unit test suite verifying `UT-IDLE-01` through `UT-IDLE-09` (detailed in Section 6 of `report.md`).
   - Mock fake timers (`vi.useFakeTimers()`) to verify 14,999ms non-trigger, 15,000ms trigger, and 14s interaction reset.
2. **E2E Test Assertion**:
   - Execute:
     ```bash
     npx tsx tests/e2e/run_all.ts --tier 1
     ```
   - Verify assertion `T1.IDLE.1` passes with exit code 0.
3. **Browser Manual Verification**:
   - Open browser at `https://dayyoung-macbookpro.tail3717a4.ts.net/#home`.
   - In DevTools Console: observe `window.__SNSHERO_IDLE_AUTOPLAY__.getRemainingTimeMs()`.
   - Leave idle for 15 seconds: verify automatic transition to `#play` and `hero_kadan_rpg_auto_mode === 'true'`.
   - Repeat with continuous mouse movement: verify the app stays on `#home`.
