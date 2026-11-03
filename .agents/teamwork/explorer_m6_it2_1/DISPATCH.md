## 2026-11-02T13:27:28Z
You are `explorer_m6_it2_1`, Milestone 6 Iteration 2 Explorer 1 (E2E Helper & Production Import Architecture Explorer).
Your working directory is: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_1/`

MANDATORY FIRST STEP: Read the user request at:
`/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
Also read:
- `/Users/dayyoung/project/snshero/PROJECT.md`
- Full evidence report from the Forensic Auditor at:
  `/Users/dayyoung/project/snshero/.agents/teamwork/auditor_m6_master/handoff.md`
- Inspect `tests/e2e/helpers.ts` lines 80–570 (containing `ReferenceHashRouter`, `ReferenceIdleAutoPlayManager`, `ReferenceNurtureStore`, `ReferenceShopManager`, `ReferenceAdSenseManager`)
- Inspect production files:
  - `src/landing/services/cardNurtureStore.ts`
  - `src/landing/views/ShopSection.tsx`
  - `src/landing/services/adsenseManager.ts`
  - `src/landing/services/idleAutoPlayManager.ts`
  - `src/landing/index.ts`

YOUR TASK:
Design the architectural fix to completely eliminate test doubles from `tests/e2e/helpers.ts`:
1. Analyze how `tests/e2e/helpers.ts` should re-export or bridge to genuine production code, or how the reference classes should be deleted in favor of directly importing from `../../src/landing/`.
2. Map every method currently called on `ReferenceHashRouter`, `ReferenceIdleAutoPlayManager`, `ReferenceNurtureStore`, `ReferenceShopManager`, and `ReferenceAdSenseManager` to its genuine production counterpart in `src/landing/`.
3. Provide concrete code replacements / diffs for `tests/e2e/helpers.ts`.
4. Write your detailed analysis and recommended strategy to `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_1/handoff.md` and send a message back to parent. Do NOT implement the fix directly — formulate the strategy for the worker.
