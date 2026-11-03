## 2026-11-02T06:40:00Z
# Dispatch Assignment: worker_m4_1 (Milestone 4 Adversarial Fix & Hardening)

## Mission
Apply the 3 defensive input guards identified by `challenger_m4_tier5_1` during Milestone 4 Tier 5 Adversarial Hardening.

## Reference Handoff Reports
- `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m4_tier5_1/handoff.md` (Detailed gap analysis and exact 1-line mitigations)
- `/Users/dayyoung/project/snshero/tests/adversarial_tier5_m4_suite.ts` (Adversarial test suite)
- `/Users/dayyoung/project/snshero/tests/adversarial_tier5_dom_assets_challenger2.ts` (DOM/Asset test suite)
- `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/dayyoung/project/snshero/PROJECT.md`
- `/Users/dayyoung/project/snshero/TEST_INFRA.md`

## Required Code Edits
1. `src/landing/services/cardNurtureStore.ts`:
   In `addCard(cardId: number)`:
   Ensure `cardId` is validated with `!Number.isInteger(cardId)` so `NaN` or non-integer floats (e.g. `1.5`) are immediately rejected:
   ```typescript
   if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
   ```
2. `src/landing/views/PlaySection.tsx`:
   In `setEpisode(epNum: number)`:
   Ensure `if (typeof epNum !== 'number' || isNaN(epNum)) epNum = 1;` before clamping with `Math.max(1, Math.min(40, Math.floor(epNum)))`.
   In `setScene(sceneIdx: number)`:
   Ensure `if (typeof sceneIdx !== 'number' || isNaN(sceneIdx)) sceneIdx = 0;` before clamping with `Math.max(0, Math.min(totalScenes - 1, Math.floor(sceneIdx)))`.
3. `src/landing/views/ShopSection.tsx`:
   In `getUserCoins()`:
   Ensure `const val = parseInt(raw, 10); return isNaN(val) ? 1000 : Math.max(0, val);` so pre-existing negative values in localStorage are clamped to 0.

## Verification Steps
- Run `npx tsc --noEmit` -> Must pass with 0 errors.
- Run `npm run build` -> Clean build, bundle size of `dist/index.html` must remain < 50 KB.
- Run `npx tsx tests/adversarial_tier5_m4_suite.ts` -> All 23 assertions must PASS (100.0%).
- Run `npx tsx tests/adversarial_tier5_dom_assets_challenger2.ts` -> All 25 assertions must PASS (100.0%).
- Run `npx tsx tests/e2e/run_all.ts` -> All 69 assertions must PASS (100.0%).
- Submit Google Form report:
  `python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[M4 하드닝] Tier 5 화이트박스 방어 코드 보강 및 최종 검증" --status "작업완료" --details "cardNurtureStore addCard NaN 가드, PlaySection setEpisode/setScene NaN 방어, ShopSection getUserCoins 음수 클램핑 완료. 23/23 M4 적대적 테스트 및 69/69 마스터 E2E 100% 통과."`
- Local git commit: `git commit` (commit only, NO push!).
- Write `handoff.md` and message parent.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
