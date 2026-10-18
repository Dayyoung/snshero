# DISPATCH: test_writer_e2e

- **Role**: E2E Testing Track Writer
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/`
- **Scope**: E2E Test Suite Creation for DESIGN.md Terminal-Flat Visual Unification
- **Inputs**:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (specifically ## 2026-10-18T10:08:37Z)
  - `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/TEST_INFRA.md`
  - `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md`
  - `/Users/dayyoung/project/snshero/DESIGN.md`
- **Exclusive Write Ownership**:
  - `tests/e2e_design_system/*`
  - `/Users/dayyoung/project/snshero/TEST_READY.md`
- **Output Requirements**:
  - Create comprehensive 4-Tier test suite in `tests/e2e_design_system/` (Tier 1: Feature Coverage, Tier 2: Boundary & Corner, Tier 3: Pairwise Combinations, Tier 4: Real-World Scenarios)
  - Create runnable runner script `tests/e2e_design_system/run_all_e2e_tests.py`
  - Publish `/Users/dayyoung/project/snshero/TEST_READY.md` with coverage summary and run command
  - Write handoff report in `/Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/handoff.md`

## 2026-10-18T10:25:54Z
You are the E2E Testing Track Writer for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/TEST_INFRA.md
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/DISPATCH.md

Your Exclusive Write Ownership:
- `tests/e2e_design_system/*`
- `/Users/dayyoung/project/snshero/TEST_READY.md`

Your Task:
1. Build the complete, autonomous, requirement-driven opaque-box E2E test harness under `tests/e2e_design_system/`:
   - `tier1_feature_coverage.py`: Category-Partition test suite covering all 22+ views. Verifies 0 banned classes (`bg-gradient-to-`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `animate-ping`, `animate-bounce`), strict monospace typography (`font-mono`, 0 `font-sans`), 2-tier border radius, and flat surfaces with 1px hairlines. (>=50 assertions).
   - `tier2_boundary_corner.py`: Boundary Value Analysis. Verifies minimum 44px touch target height (`min-h-[44px]`) on all interactive buttons, tabs, pagination, and header CTAs; verifies every modal/drawer exposes a visible top-layer `[x]` / `[SKIP]` button; verifies 375px mobile viewport overflow resilience (0 horizontal scroll overflow). (>=50 assertions).
   - `tier3_cross_feature.py`: Pairwise Combinatorial Testing. Verifies view transitions between Battle, Deck, Shop, Ranking, Novel, and Settings; verifies LocalStorage key persistence (`hero_*`); verifies 100% `safeLazy` dynamic glob imports in `App.tsx` with zero directory index imports. (>=10 composite assertions).
   - `tier4_realworld_workload.py`: Real-World Workload Testing. Simulates end-to-end player journeys across all 6 real-world scenarios from `TEST_INFRA.md`, verifying zero viewport intrusion over active game boards/canvases/media and zero console errors.
   - `run_all_e2e_tests.py`: Master test runner that runs all 4 tiers, formats results with clear colored CLI reports, and returns exit code 0 when all tests pass.
2. Publish `/Users/dayyoung/project/snshero/TEST_READY.md` at project root with runner command, tier breakdown, and feature checklist.
3. Write your handoff report in `/Users/dayyoung/project/snshero/.agents/teamwork/test_writer_e2e/handoff.md`.
4. Send a message to parent reporting completion and pointing to `TEST_READY.md` and `handoff.md`.

HARD CONSTRAINT: You write tests and test infra only. DO NOT modify application source code in `src/`.
