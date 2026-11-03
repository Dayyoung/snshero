# Handoff Report — Milestone 1: Hash Route Navigation Core & History State

- **Subagent ID**: `explorer_m1_9_1`
- **Milestone**: Milestone 1 (Hash Route Navigation Core & History State)
- **Handoff Type**: Hard (Task Complete)
- **Date**: 2026-11-02T07:55:00Z
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_1/`

---

## 1. Observation

1. **`index.html:723–726`**:
   `index.html` loads `<script type="module" src="/src/landing/index.ts"></script>` into `<div id="landing-root"></div>`. There is no inline normalizer script in `<head>`, so requests with empty hash or legacy paths remain unnormalized until the script bundle finishes loading.
2. **`index.html:780–808`**:
   The static SEO crawler links directly reference legacy routes: `<a href="https://snshero.com/deck">`, `<a href="https://snshero.com/play">`, `<a href="https://snshero.com/shop">`.
3. **`src/routes.ts:12–65, 422–506`**:
   `VIEW_ROUTES` maps views to pathname strings (`path: '/home'`, `path: '/deck'`, `path: '/play'`, `path: '/shop'`). There is no entry for `card` in `VIEW_ROUTES`. `getViewPath` returns absolute paths, never hashes. `getViewFromPath` checks only `pathname` and `search`, completely ignoring `window.location.hash`.
4. **`src/landing/index.ts:57–89`**:
   `renderApp()` replaces the entire root element (`root.innerHTML = ...`), blowing away the full DOM tree on every tab click.
5. **`src/landing/index.ts:91–106`**:
   `handleEventDelegation` updates `state.activeView = nav; window.location.hash = nav; renderApp();` without calling `event.preventDefault()` on navigation elements.
6. **`src/landing/index.ts:193–230`**:
   `mountLanding()` attempts basic hash parsing (`window.location.hash.replace('#', '')`) without handling `#`, `#/`, query parameters, or legacy pathnames (`/home`, `/deck`, `/play`). It does not normalize the URL in-place.
7. **`src/landing/types.ts:10–11`**:
   `TOP_NAV_ITEMS` and `SIDE_NAV_ITEMS` contain `'미션'` instead of the mandated `'카드'`.
8. **Hardcoded `/home` Links in Landing Elements**:
   A grep scan reveals 7 active instances of `href="/home"` in `src/landing/`:
   - `Header.tsx:97`: `<a href="/home">게임 시작 (/home) →</a>`
   - `Sidebar.tsx:140`: `<a href="/home">게임 시작하기 (/home) →</a>`
   - `HomeSection.tsx:41`: `<a href="/home">웹게임 즉시 시작 (/home) →</a>`
   - `MyDeckSection.tsx:131, 398`: `<a href="/home">웹게임 출격 (/home) →</a>` and `실전 배틀 출격 (/home)`
   - `Footer.tsx:50`: `<a href="/home"><span>[→] 원클릭 웹게임 바로가기</span></a>`
   - `Modals.tsx:161`: `<a href="/home">게스트로 게임 시작하기 (/home) →</a>`
   Clicking any of these triggers a full browser reload navigating to the legacy route `/home`.
9. **TypeScript Build Status**:
   `npx tsc --noEmit` executed cleanly with exit code 0 and 0 errors.

---

## 2. Logic Chain

1. **Root Cause of Standalone Route Dependency**:
   Because `Header.tsx`, `Sidebar.tsx`, `HomeSection.tsx`, `MyDeckSection.tsx`, `Footer.tsx`, and `Modals.tsx` hardcode `href="/home"` (Observation 8), users clicking any primary "게임 시작" action are forced out of the SPA into the legacy `/home` route.
   *(Directly references Observation 8)*
2. **Root Cause of URL Desynchronization on Initial Visit**:
   `index.html` has no pre-bundle normalizer (Observation 1), and `mountLanding()` in `src/landing/index.ts` only reads `window.location.hash.replace('#', '')` (Observation 6). When a user visits `https://snshero.com/` or `https://snshero.com/#`, the hash is empty or `#`, neither of which matches `validViews`. Thus, the view defaults to `'home'`, but the browser URL stays `https://snshero.com/` without `#home`.
   *(Directly references Observations 1 and 6)*
3. **Prevention of History Stack Traps**:
   If the initial load were to normalize the URL by executing `window.location.hash = 'home'`, the browser would push a new entry onto the history stack. If the user then clicked "Back", the browser would return to the blank URL `https://snshero.com/`, which would re-trigger `mountLanding()` and push `#home` again, trapping the user in a history loop. Therefore, `window.history.replaceState({ view: 'home' }, '', '#home')` must be used.
   *(Directly references Observation 6)*
4. **Prevention of Infinite Render Loops**:
   In `src/landing/index.ts`, setting `window.location.hash` in `handleEventDelegation` fires a browser `hashchange` event (Observation 5). If the `hashchange` listener also invokes navigation logic without a state comparison guard and reentrancy mutex, an infinite re-render loop can be triggered. Implementing `isProgrammaticRouting` mutex lock and checking `if (state.activeView === targetView && window.location.hash === '#' + targetView) return;` guarantees zero infinite loops.
   *(Directly references Observations 4 and 5)*
5. **Smooth Section Switching**:
   Currently, `renderApp()` destroys the entire DOM on every navigation (Observation 4). Implementing `renderSectionContent(view)` to update only `#landing-main-slot` and the active classes of `#landing-header-slot` and `#landing-sidebar-slot` eliminates DOM thrashing, avoids scroll jitter, and provides instantaneous tab switching.
   *(Directly references Observation 4)*

---

## 3. Caveats

1. **Minigame & RPG Mode Scope (Milestones 2–5)**:
   This milestone focuses strictly on the Hash Routing Core and History State. While `#play` is mapped as a canonical hash route in `src/landing/index.ts` and `src/routes.ts`, full tile game integration (`KadanWorldMap`), movement episode triggers (`KadanNpcDialog`), and tactical battle loops (`MobileCardPlayScreen`) will be integrated into the `#play` view in Milestone 3.
2. **Card Nurturing EXP Hook (Milestone 4)**:
   `#card` routing and UI label renaming ('미션' -> '카드') are established here, but gating EXP exclusively to card battle victories will be implemented in Milestone 4.
3. **AdSense Gutters & Shop Modals (Milestone 5)**:
   AdSense responsive placements and pack reveal modals belong to Milestone 5.

---

## 4. Conclusion

The hash navigation blueprint detailed in `report.md` provides an exact, drop-in strategy for Milestone 1:
1. `index.html` receives an early `<head>` script normalizer for immediate legacy redirect and `#home` in-place normalization.
2. `src/routes.ts` is upgraded to support `#home`, `#deck`, `#play`, `#card`, `#shop` with alias handling.
3. `src/landing/types.ts` is updated to rename `'미션'` to `'카드'`.
4. `src/landing/index.ts` is refactored with `parseRoute()`, `navigateTo()`, `renderSectionContent()`, dual `hashchange`/`popstate` listeners, and `isProgrammaticRouting` reentrancy lock.
5. All 7 hardcoded `href="/home"` links across `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `HomeSection.tsx`, `MyDeckSection.tsx`, and `Modals.tsx` are migrated to `#play` (`data-nav="play"`).

This ensures 100% hash route parity, zero page reloads, zero infinite loops, and full compliance with `DESIGN.md`.

---

## 5. Verification Method

To independently verify the implementation after the Worker applies the blueprint:

1. **Static Analysis & Type Checking**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected: Exit code 0, 0 TypeScript errors.*

2. **Production Bundle Verification**:
   ```bash
   npm run build
   ```
   *Expected: Exit code 0, single production bundle generated in `dist/`.*

3. **Grep Verification for Legacy Standalone Route Elimination**:
   ```bash
   grep -rn 'href="/home"' src/landing/
   ```
   *Expected: 0 matches found.*

4. **Runtime Hash Navigation Test (Browser / Puppeteer / Preview)**:
   - Load `http://localhost:3000/` -> verify URL automatically normalizes in-place to `http://localhost:3000/#home` without adding extra history entries.
   - Load `http://localhost:3000/#` -> verify URL normalizes to `http://localhost:3000/#home`.
   - Load `http://localhost:3000/#deck` -> verify `MyDeckSection` mounts directly.
   - Load `http://localhost:3000/#play` -> verify `PlaySection` mounts directly.
   - Load `http://localhost:3000/#card` -> verify `CardSection` mounts directly with title "카드 도감 및 육성".
   - Load `http://localhost:3000/#shop` -> verify `ShopSection` mounts directly.
   - Click navigation tabs in Header -> verify instant section swap without page reload.
   - Click Browser Back/Forward buttons -> verify `popstate` smoothly restores previous section.
