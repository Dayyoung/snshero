## 2026-11-02T08:01:04Z
You are the Worker subagent for Milestone 1 (worker_m1_9).
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_9/

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.
Also read /Users/dayyoung/project/snshero/PROJECT.md and the three Explorer reports:
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_1/report.md (Hash Routing Core)
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_2/report.md (Route Elimination & Links)
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_3/report.md (Idle Auto-Play Manager)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Milestone 1 Scope:
1. Implement client-side Hash Routing Core (#home, #deck, #play, #card, #shop) in `src/landing/index.ts` and `src/routes.ts`:
   - Pre-bundle URL normalizer in `<head>` of `index.html` (and `home.html`) normalizing empty or # to #home without polluting history.
   - Centralized `parseRoute()`, `navigateTo()`, and `renderSectionContent()` in `src/landing/index.ts` to swap views without full DOM thrashing.
   - Mutex lock (`isProgrammaticRouting`) preventing infinite render loops between `hashchange` and `popstate`.
   - Update `src/landing/types.ts`: Rename '미션' to '카드' in `TOP_NAV_ITEMS` and `SIDE_NAV_ITEMS`.
2. Implement Legacy Route Elimination & Link Migration:
   - Eliminate all 7 hardcoded `href="/home"` links across `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `Modals.tsx`, `HomeSection.tsx`, `MyDeckSection.tsx`, replacing with `href="#play"` / `data-nav="play"`.
   - Update `vite.config.ts` dev/preview rewrite to redirect legacy routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) to `/#...`.
   - Update `scripts/post-build.js` so generated static fallback stubs cleanly redirect to hash routes.
3. Implement Global 15-Second Idle Auto-Play Transition in `src/landing/services/idleAutoPlayManager.ts`:
   - Listen to 8 user input events (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`) with `{ capture: true, passive: true }`.
   - 250ms throttling with exact 15,000ms idle timer.
   - Any user interaction resets the countdown.
   - On expiration: Set `hero_kadan_rpg_auto_mode = 'true'`, dispatch `hero_kadan_rpg_auto_mode_updated`, navigate to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` (with local relative fallback).
   - If already on `#play` and auto-play is running, avoid redundant reloads.
   - Initialize in `src/landing/index.ts` and export singleton instance.
4. Build & Test Verification:
   - Run `npx tsc --noEmit` and `npm run build`
   - Run `npx tsx tests/e2e/run_all.ts --milestone M1`
   - Ensure all M1 tests pass cleanly with exit code 0.
   - Local git commit for Milestone 1 changes.
5. Write your handoff report to /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1_9/handoff.md and notify the orchestrator.

## 2026-11-02T08:12:41Z
**Context**: Milestone 1 Implementation Status Check
**Content**: Please provide an update on your current step and progress regarding the M1 implementation (Hash Routing, Route Elimination, Idle Manager).
**Action**: Update your progress.md with current progress and reply with your status.

