## 2026-11-02T13:37:51Z

You are `worker_m6_it2`, Milestone 6 Iteration 2 Worker (E2E Test Double Purge & Production Direct Integration).
Your working directory is: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m6_it2/`

MANDATORY FIRST STEP: Read the user request at:
`/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
Also read:
- `/Users/dayyoung/project/snshero/PROJECT.md`
- Forensic Auditor Evidence Report:
  `/Users/dayyoung/project/snshero/.agents/teamwork/auditor_m6_master/handoff.md`
- Explorer handoff blueprints:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_1/handoff.md`
  - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_2/handoff.md`
  - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m6_it2_3/handoff.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

YOUR TASKS:
1. Production Router Service:
   - Create `src/landing/services/hashRouter.ts` extracting pure routing tables and helpers (`VALID_VIEWS`, `HASH_ROUTES`, `LEGACY_ROUTES`, `HASH_VIEW_MAP`, `LEGACY_PATH_MAP`, `LEGACY_ROUTE_MAPPING`, `parseRoute`, `normalizeHashRoute`, `isLegacyRoute`, `getLegacyRedirect`).
   - In `src/landing/index.ts`, re-export `* from './services/hashRouter'` to keep production behavior and exports intact.
2. Production IdleAutoPlayManager Simulation Methods:
   - In `src/landing/services/idleAutoPlayManager.ts`, add `currentIdleMs`, `isAutoPlayActive`, and methods `tick(deltaMs)`, `handleUserInteraction()`, `getIdleTime()`, `isTriggered()`.
3. Purge Test Doubles from `tests/e2e/helpers.ts`:
   - Completely delete `ReferenceHashRouter`, `ReferenceIdleAutoPlayManager`, `ReferenceNurtureStore`, `ReferenceShopManager`, `ReferenceAdSenseManager` (lines 88–576).
   - Add `setupTestEnvironment()` to initialize `globalThis.localStorage`, `globalThis.window`, `globalThis.document`, `globalThis.CustomEvent`.
4. Rewire All 4 Master E2E Tiers:
   - In `tests/e2e/tier1_feature_coverage.ts`, `tier2_boundary_corner.ts`, `tier3_cross_feature.ts`, and `tier4_realworld_workload.ts`:
   - Replace reference class imports with genuine imports from `src/landing/services/cardNurtureStore`, `src/landing/views/ShopSection`, `src/landing/services/adsenseManager`, `src/landing/services/idleAutoPlayManager`, `src/landing/services/hashRouter`.
   - Update assertions per the blueprint in `explorer_m6_it2_2/handoff.md`.
5. Fix Tautological Assertion:
   - In `tests/adversarial_challenger_m4_empirical.ts:466`, replace literal `true` with empirical validation of loop completion (`togglesCompleted === 1000 && !toggleDeadlock && activeMode === false && activeTimersPreCleanup === 1`).
6. Execute Verification:
   - `npx tsx tests/e2e/run_all.ts` (all 76 assertions PASS against real production)
   - `npx tsx tests/adversarial_challenger_m4_empirical.ts` (34/34 PASS)
   - `npx tsx tests/adversarial_m1_build_pipeline.ts` (64/64 PASS)
   - `npx tsx tests/adversarial_m2_user_interaction.ts` (18/18 PASS)
   - `npx tsx tests/adversarial_m3_play_game_loop.ts` (28/28 PASS)
   - `npx tsx tests/adversarial_m4_card_nurturing.ts` (44/44 PASS)
   - `npx tsx tests/adversarial_m5_shop_adsense.ts` (38/38 PASS)
   - `npx tsc --noEmit` (0 errors)
   - `npm run build` (bundle <= 50 KB, 0% React in index.html)
7. Create local git commits (`git commit`) with descriptive messages. DO NOT execute `git push`.
8. Submit Google Form report:
   ```bash
   python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[Milestone 6 Remediation] E2E Reference Test Double 전면 제거 및 프로덕션 모듈 직접 연동 완료" --status "작업완료" --details "tests/e2e/helpers.ts 5개 Reference* 테스트 더블 전면 제거, 4-Tier 76개 전수 E2E 테스트 프로덕션 직접 연동, 항진성 단언문 교체, 빌드 및 전수 테스트 100% 통과"
   ```
9. Write your detailed handoff report to `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m6_it2/handoff.md` and send a message back to parent.
