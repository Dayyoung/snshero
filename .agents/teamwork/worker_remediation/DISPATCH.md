## 2026-10-18T11:46:13Z
You are the Milestone 4 Remediation Worker for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_remediation/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/GATE_STATUS.md
- /Users/dayyoung/project/snshero/.agents/teamwork/reviewer_1/handoff.md
- /Users/dayyoung/project/snshero/.agents/teamwork/reviewer_2/handoff.md
- /Users/dayyoung/project/snshero/.agents/teamwork/challenger_1/handoff.md
- /Users/dayyoung/project/snshero/.agents/teamwork/challenger_2/handoff.md
- /Users/dayyoung/project/snshero/TEST_READY.md

Your Task:
Resolve the exact 12 failing E2E test assertions and 4 residual tokens identified during Gate Iteration 1 so that `python3 tests/e2e_design_system/run_all_e2e_tests.py` achieves 188 / 188 (100%) passing assertions:

1. `HomeView.tsx` (`T2.TOUCH.V01`):
   - Line 623: Fix `<button>` with `p-2` to add `min-h-[44px] min-w-[44px]`.
2. `MobileCardPlayScreen.tsx` (`T2.TOUCH.V02`, `T2.VIEWPORT.V02`, `T2.MODAL.02`):
   - Post-match settlement modal (around lines 2129–2418): Upgrade all 10 buttons to `min-h-[44px]`.
   - Add explicit top-layer `[x]` or `[SKIP]` dismiss button to the settlement modal frame.
   - Add `pb-32` to the root container (`#mobile-card-play-screen` or top-level wrapper) so it clears the bottom dock.
3. `MyDeckView.tsx` (`T2.TOUCH.V03`):
   - Comparison and filter modals (around lines 1918–2182): Upgrade all 7 sub-44px buttons to `min-h-[44px]`.
4. `PlayGameView.tsx` (`T2.TOUCH.V04`):
   - Upgrade the 26 sub-44px buttons in modal/story/in-game bars to `min-h-[44px]`.
   - Remove `rounded-full` (lines 3618, 11878), `rounded-[10px]` (line 10776), `rounded-[2rem]` (line 11860).
   - Line 12021: Fix unconstrained `min-w-[900px]` to `max-w-full overflow-x-auto` to eliminate mobile horizontal bleed.
5. Bottom Dock Padding (`pb-28` to `pb-36`):
   - `ShopView.tsx` (`T2.VIEWPORT.V05`): Ensure root container has `pb-32`.
   - `NovelView.tsx` (`T2.VIEWPORT.V07`): Ensure root container has `pb-32`.
   - `RankingView.tsx` (`T2.VIEWPORT.V09`): Ensure root container has `pb-32`.
   - `RedditCommunityView.tsx` (`T2.VIEWPORT.V13`): Ensure root container has `pb-32`.
6. Modal Dismiss Controls:
   - `RankingView.tsx` (`T2.MODAL.06`): Ensure match history and nearby search dialogs have explicit top-layer `[x]` buttons.
7. Surface Tokens:
   - `RedditCommunityView.tsx` (`T3.THEME.01`): Ensure root container declares `bg-[#fdfcfc] text-[#201d1d]` or `bg-[#090d16] text-[#fdfcfc]`.
8. Residual `rounded-lg`:
   - `ProfileView.tsx:380`: Replace `rounded-lg` with `rounded-sm`.
   - `SettingView.tsx:762`: Replace `rounded-lg` with `rounded-sm`.
   - `SettingView.tsx:1404`: Replace `rounded-lg` with `rounded-sm`.
   - `App.tsx:7382`: Replace `rounded-lg` with `rounded-sm`.

Verification Requirements:
- Run `python3 tests/e2e_design_system/run_all_e2e_tests.py` and confirm **188 / 188 Passing (100.0%)** with exit code 0!
- Run `npx tsc --noEmit` and confirm 0 TypeScript errors!
- Run `npm run build` and confirm clean production build!
- Commit locally with a descriptive git message (DO NOT git push).
- Update WORK_LOGS.md and submit the Google Form report via `python3 skills/report-ex/scripts/submit_report.py`.
- Write your handoff report in `/Users/dayyoung/project/snshero/.agents/teamwork/worker_remediation/handoff.md`.
- Send a message to parent reporting completion and test results.
