# BRIEFING — 2026-11-02T13:36:00Z

## Mission
Design the architectural fix to completely eliminate test doubles from `tests/e2e/helpers.ts` and bridge to genuine production code in `src/landing/`.

## 🔒 My Identity
- Archetype: explorer
- Roles: E2E Helper & Production Import Architecture Explorer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_1/
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 6 Iteration 2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Analyze tests/e2e/helpers.ts lines 80-570
- Map test double methods to genuine production counterparts in src/landing/
- Formulate replacement diffs/strategy for worker
- Keep parent informed via send_message

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T13:36:00Z

## Investigation State
- **Explored paths**:
  - `tests/e2e/helpers.ts` (lines 80-576 containing all 5 Reference test double classes)
  - `src/landing/services/cardNurtureStore.ts`
  - `src/landing/views/ShopSection.tsx`
  - `src/landing/services/adsenseManager.ts`
  - `src/landing/services/idleAutoPlayManager.ts`
  - `src/landing/index.ts`
  - `tests/e2e/tier1_feature_coverage.ts`, `tier2_boundary_corner.ts`, `tier3_cross_feature.ts`, `tier4_realworld_workload.ts`
  - `tests/adversarial_challenger_m4_empirical.ts` (line 466 tautology)
  - `auditor_m6_master/handoff.md`
- **Key findings**:
  - All 5 Reference classes in `helpers.ts` (lines 87-576) can be completely deleted.
  - `src/landing/` modules already contain 95% of the genuine production code; only minor production exports/methods need to be added (`normalizeHashRoute`, `purchaseCardPack`, `getShopBalances`, `IdleAutoPlayManager.tick`).
  - `tests/e2e/helpers.ts` should re-export genuine production deliverables and provide headless browser initialization.
  - All 4 tiers (`tier1`..`tier4`) can be rewired cleanly from `Reference*` to genuine production imports.
  - Tautological `assert(..., true)` in `adversarial_challenger_m4_empirical.ts:466` mapped to empirical condition `toggleCount === 1000 && !toggleDeadlock`.
- **Unexplored areas**: None (investigation complete).

## Key Decisions Made
- Recommending clean architecture: delete all Reference test doubles from `helpers.ts`, export bridge/re-exports in `helpers.ts`, and rewire test files directly to production names.

## Artifact Index
- DISPATCH.md — incoming dispatch instructions
- BRIEFING.md — persistent situational awareness
- progress.md — liveness heartbeat
- handoff.md — final comprehensive architectural handoff report
