## 2026-11-02T11:08:02Z

You are `worker_m3_it2`, Milestone 3 Remediation Worker.
Working directory: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3_it2/`
Parent Conversation ID: `21826d14-7bc9-4995-866c-cbb42a941789`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mandatory Pre-Work Reading (Read these files thoroughly before writing code):
1. `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (Mandatory verbatim reading)
2. `/Users/dayyoung/project/snshero/PROJECT.md`
3. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_it2_1/handoff.md` (Detailed drop-in blueprint for PlaySection.tsx)
4. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_it2_2/handoff.md` (Census of all 110 cards & element mapping analysis)
5. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_it2_3/handoff.md` (Test integration blueprint for ADV.M3.ARCADE.5 & T1.PLAY.5)
6. `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m3_9_2/handoff.md` (Reproduction of CHAL.FILTER.1 defect)

Your Tasks:
1. Target File 1: `/Users/dayyoung/project/snshero/src/landing/views/PlaySection.tsx`
   In `renderArcadeView()` around line 900:
   Normalize `card.element`:
   ```ts
   const rawEl = card.element?.toLowerCase() || 'water';
   const el = rawEl === 'air' ? 'wind' : rawEl;
   const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
   const elMatch = selectedElement === 'all' || el === selectedElement;
   ```
   And in `filteredGames.push(...)`:
   `element: el` (or `normalizedEl`).
   Ensure cards 21..30 (air in CARD_DATABASE) match the `wind` filter chip, so all 11 factions each return exactly 10 cards (summing to 110, 0 overlap).

2. Target File 2: `/Users/dayyoung/project/snshero/tests/adversarial_m3_play_game_loop.ts`
   - Add imports: `import { playRpgState, setActiveTab } from '../src/landing/services/playRpgEngine';`
   - Upgrade `ADV.M3.ARCADE.2` to exercise rendered output with `playRpgState.arcadeQuery = '카단'`.
   - Add `ADV.M3.ARCADE.5` testing the 11-faction partition invariant across all 110 cards via `renderPlaySection()`.
   Ensure state is reset to `arcadeElement = 'all'`, `arcadeQuery = ''`, `setActiveTab('adventure')` after the test.

3. Target File 3: `/Users/dayyoung/project/snshero/tests/e2e/tier1_feature_coverage.ts`
   - In `T1.PLAY.5`, add assertion checking that `PlaySection.tsx` handles the `'air'`/`'wind'` synonym for cards 21..30.

4. Run all verification test suites:
   - `npx tsx tests/challenger_m3_9_2_empirical_stress.ts` (all 21 must PASS)
   - `npx tsx tests/adversarial_m3_play_game_loop.ts` (all 28 must PASS)
   - `npx tsx tests/adversarial_challenger_m3_landing.ts` (all 22 must PASS)
   - `npx tsx tests/adversarial_challenger_m3_1_verification.ts` (all 34 must PASS)
   - `npx tsx tests/e2e/run_all.ts` (all 76 must PASS)
   - `npx tsc --noEmit` (0 errors)
   - `npm run build` (exit code 0, bundle size < 50 KB)

5. Local Git Commit:
   `git commit -m "fix(play): normalize air to wind element filter in arcade catalog and strengthen regression tests"`
   (DO NOT `git push`!)

6. Mandatory Google Form Report:
   ```bash
   python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[M3-It2] #play 아케이드 110선 바람/공기 원소 필터 정상화 및 회귀 검증 강화" --status "작업완료" --details "[M3 Iteration 2] PlaySection.tsx 내 CARD_DATABASE 21..30번 카드(air)를 wind 필터 칩에 매핑 정상화(11진영 각 10장, 총 110장 0오버랩). ADV.M3.ARCADE.5 11진영 분할 불변식 테스트 추가, T1.PLAY.5 검증 강화. 6개 테스트 스위트 전원 통과, 빌드 45KB 검증 완료"
   ```

7. Write comprehensive 5-component `handoff.md` report in `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3_it2/handoff.md` and send message to parent with summary and file path.
