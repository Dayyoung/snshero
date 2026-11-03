# BRIEFING — 2026-11-02T08:19:30Z

## Mission
Implement Milestone 1 (M1): Client-side Hash Routing Core, Legacy Route Elimination & Link Migration, and Global 15-Second Idle Auto-Play Transition.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_9/
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: M1 (Milestone 1)

## 🔒 Key Constraints
- DO NOT CHEAT: Genuine implementations only, real state, no dummy/facade implementations, no hardcoded test verifications.
- Follow Korean reply constraint for user communications.
- Only local git commit; NO `git push` unless explicitly requested.
- LocalStorage only for persistence.
- Design guidelines: terminal flat aesthetic, 0px rounded modals/containers, 4px buttons/inputs, font-mono.
- All M1 tests in `tests/e2e/run_all.ts --milestone M1` must pass cleanly.
- Mandatory Google Form report submission upon completion.

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T08:19:30Z

## Task Summary
- **What to build**:
  1. Hash Routing Core (#home, #deck, #play, #card, #shop) in `src/landing/index.ts` & `src/routes.ts` with pre-bundle normalizer, mutex lock, and renaming '미션'->'카드'.
  2. Legacy Route Elimination & Link Migration: Replace 7 hardcoded `href="/home"` with `href="#play"` / `data-nav="play"`, update `vite.config.ts`, and update `scripts/post-build.js`.
  3. Global 15s Idle Auto-Play Transition: `src/landing/services/idleAutoPlayManager.ts` with 8 input events, 250ms throttling, 15s countdown, storage flag, custom event, redirect.
- **Success criteria**:
  - `npx tsc --noEmit` passes (Verified: 0 errors)
  - `npm run build` passes (Verified: 0 errors)
  - `npx tsx tests/e2e/run_all.ts --milestone M1` passes with code 0 (Verified: 16/16 PASS)
  - `npx tsx tests/unit_m1_idle_autoplay.ts` passes with code 0 (Verified: 26/26 PASS)
  - Local git commit created (commits 9d9011bb1 and ecc34ad2f)
  - Mandatory Google Form report submitted (Verified)
- **Interface contracts**: `PROJECT.md`, `ORIGINAL_REQUEST.md`, Explorer reports
- **Code layout**: `src/landing/`, `src/routes.ts`, `vite.config.ts`, `scripts/post-build.js`, `index.html`, `home.html`

## Change Tracker
- **Files modified**:
  - `src/landing/types.ts`: Renamed '미션' -> '카드' in `TOP_NAV_ITEMS` and `SIDE_NAV_ITEMS`, added `RouteOptions`.
  - `src/routes.ts`: Updated `VIEW_ROUTES` core paths to hash (#home, #deck, #play, #card, #shop), updated `getViewPath` and `getViewFromPath`.
  - `src/landing/components/Header.tsx`: Renamed '미션' -> '카드', migrated `/home` -> `#play` (`data-nav="play"`).
  - `src/landing/components/Sidebar.tsx`: Renamed '미션' -> '카드', migrated `/home` -> `#play` (`data-nav="play"`).
  - `src/landing/components/Footer.tsx`: Migrated `/home` -> `#play` (`data-nav="play"`).
  - `src/landing/components/Modals.tsx`: Migrated `/home` -> `#play` (`data-nav="play"`).
  - `src/landing/views/HomeSection.tsx`: Migrated `/home` -> `#play` (`data-nav="play"`).
  - `src/landing/views/MyDeckSection.tsx`: Migrated both `/home` links -> `#play` (`data-nav="play"`).
  - `src/landing/services/idleAutoPlayManager.ts`: Implemented 15-second inactivity detector with 8 input events, 250ms throttling, storage persistence, and Tailscale `#play` transition.
  - `src/landing/index.ts`: Centralized `parseRoute`, `navigateTo`, `renderSectionContent`, selective slot update, mutex lock, idle manager bootstrap.
  - `index.html`: Early route normalizer script in `<head>`, updated crawler links.
  - `home.html`: Early route normalizer script in `<head>`.
  - `src/App.tsx`: Added `card` view handling, updated SEO crawl links to hash routes.
  - `src/main.tsx`: Initialized `initIdleAutoPlay` for SPA routes.
  - `vite.config.ts`: Added HTTP 302 redirects for legacy routes in dev & preview middlewares.
  - `scripts/post-build.js`: Added static redirect HTML stubs for legacy standalone routes.
  - `WORK_LOGS.md`: Recorded completion log.
  - `tests/unit_m1_idle_autoplay.ts`: Unit test suite verifying M1 logic.
- **Build status**: PASS (`tsc --noEmit` and `npm run build` 100% clean)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (E2E 16/16 PASS, Unit 26/26 PASS)
- **Lint status**: Clean
- **Tests added/modified**: `tests/unit_m1_idle_autoplay.ts`

## Loaded Skills
None

## Key Decisions Made
- Implemented 3-layer redirect architecture (Layer 1: Vite dev/preview 302, Layer 2: Static post-build stubs, Layer 3: Head script replaceState).
- Selective DOM slot updates in landing engine to prevent destructive full-page re-renders.
- 8-event capture-phase passive event listener in `idleAutoPlayManager` to guarantee capture without interfering with user interaction.

## Artifact Index
- `.agents/teamwork/worker_m1_9/DISPATCH.md` — Dispatch message
- `.agents/teamwork/worker_m1_9/BRIEFING.md` — Working memory
- `.agents/teamwork/worker_m1_9/progress.md` — Liveness & task progress
- `.agents/teamwork/worker_m1_9/handoff.md` — 5-component handoff report
