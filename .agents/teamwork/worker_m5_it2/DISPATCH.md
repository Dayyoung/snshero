## 2026-11-02T12:55:39Z
You are worker_m5_it2, the Milestone 5 Remediation Worker.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m5_it2/
Your parent conversation ID is: 21826d14-7bc9-4995-866c-cbb42a941789

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY CONSTRAINTS:
1. Read the authoritative user request at `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`.
2. Read the master project plan at `/Users/dayyoung/project/snshero/PROJECT.md`.
3. Read the FULL FORENSIC AUDIT FAILURE REPORT at `/Users/dayyoung/project/snshero/.agents/teamwork/auditor_m5_9_1/handoff.md`.
4. Read the three Iteration 2 Explorer handoff reports:
   - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m5_it2_1/handoff.md`
   - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m5_it2_2/handoff.md`
   - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m5_it2_3/handoff.md`
5. NEVER run `git push`. Only local commits (`git commit`) are permitted.

OBJECTIVE:
Remediate `tests/adversarial_m5_shop_adsense.ts` to address all specific integrity violations identified by the Forensic Auditor:
1. Purge all test doubles (`ReferenceShopManager`, `ReferenceAdSenseManager`, `ReferenceNurtureStore`) from `tests/adversarial_m5_shop_adsense.ts`.
2. Directly import genuine production functions from:
   - `../src/landing/views/ShopSection` (`executeShopPurchase`, `renderPackRevealModal`, `closePackRevealModal`, `exchangeGoldForSns`, `debitUserCoins`, `renderShopSection`, `getUserCoins`, `getUserGold`, `setUserCoins`, `setUserGold`)
   - `../src/landing/services/adsenseManager` (`isAdRemoved`, `getAdPlacements`, `renderDesktopLeftGutter`, `renderDesktopRightGutter`, `renderMobileTopBanner`, `pushAdSenseTags`)
   - `../src/landing/services/cardNurtureStore` (`cardNurtureStore`, `CardNurtureStore`)
3. In Suite 1: completely eliminate `renderMockPackRevealModal` and test actual `renderPackRevealModal()` and `closePackRevealModal()`.
4. In `ADV-M5-GOLD-05`: eliminate the tautological check `typeof hasFreeFaucetButton === 'boolean'` and replace with strict invariant assertion `hasFreeFaucetButton === false` scanning both `ShopSection.tsx` and `index.ts`.
5. You may use `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m5_it2_3/proposed_adversarial_m5_shop_adsense.ts` which has already been prepared, validated, and verified passing 38/38 (100.0%) against genuine production files!

REQUIRED VERIFICATION SUITES:
Execute and verify 100% pass:
1. `npx tsx tests/adversarial_m5_shop_adsense.ts` (All 38 assertions must PASS directly against production imports)
2. `npx tsx tests/e2e/run_all.ts` (All 76 assertions across Tiers 1-4 must PASS)
3. `npx tsx tests/adversarial_m1_build_pipeline.ts`
4. `npx tsx tests/adversarial_m2_user_interaction.ts`
5. `npx tsx tests/adversarial_m3_play_game_loop.ts`
6. `npx tsx tests/adversarial_m4_card_nurturing.ts`
7. `npx tsx tests/challenger_m4_9_1_empirical_invariants.ts`
8. `npx tsx tests/challenger_m4_9_2_empirical_stress.ts`
9. `npx tsx tests/challenger_m5_9_1_empirical_invariants.ts`
10. `npx tsx tests/challenger_m5_9_2_empirical_currency_adsense.ts`
11. `npx tsc --noEmit` (0 errors)
12. `npm run build` (bundle size <= 50 KB, zero React runtime)
13. Local git commit (`git commit -m "fix: remediate Milestone 5 adversarial test harness to directly import production modules and eliminate mock facades"`)
14. Submit Google Form report:
    `python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[Milestone 5 Remediation] Production Imports and Elimination of Mock Facades in tests/adversarial_m5_shop_adsense.ts" --status "작업완료" --details "..."`
