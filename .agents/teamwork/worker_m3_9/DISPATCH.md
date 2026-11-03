## 2026-11-02T10:25:02Z
You are `worker_m3_9`, the Milestone 3 Worker.
Working directory: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3_9/`
Parent Conversation ID: `21826d14-7bc9-4995-866c-cbb42a941789`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Mandatory Pre-Work Reading:
Read the following authoritative documents before making changes:
1. `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (Mandatory verbatim reading)
2. `/Users/dayyoung/project/snshero/PROJECT.md`
3. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_9_1/handoff.md` (Tile Map, Controls & Dialogue Architecture)
4. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_9_2/handoff.md` (Dialogue-to-Battle Transition & Auto-Runner Loop)
5. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_9_3/handoff.md` (110 Poki Arcade Retention & Complete Test Specification)

### Your Exclusive Write Ownership:
- `src/landing/views/PlaySection.tsx`
- `src/landing/index.ts`
- `src/landing/services/playRpgEngine.ts` (if modular pure-TS helper is created)
- `tests/adversarial_m3_play_game_loop.ts` (Create this test suite per Explorer 3's complete specification)
- `PROJECT.md` (Update M3 milestone status to IN_PROGRESS / DONE)
- `.agents/teamwork/worker_m3_9/` (your own metadata)

### Mission Objectives:
1. Implement the 3-tab segmented architecture in `PlaySection.tsx`:
   - Tab 1: `adventure` (Default on initial `#play` load): Renders the 2D tile adventure map (`KadanWorldMap` 10x8 grid style), hero avatar at `heroTile` coordinates, encounter pins, region info, minimap coordinate badge, on-screen 4-way D-Pad (▲, ▼, ◀, ▶) with `min-h-[44px]`, direct tile tap navigation, and auto-play toggle.
   - Stepping on an event tile activates the episode dialogue overlay (`KadanNpcDialog` style) with character cutouts (`/anime-character-sheets/cutouts/...`), novel script prose, protagonist choices, and countdown timer.
   - Concluding dialogue (`[전투 시작]`) transitions into 3x3 tactical card battle (`MobileCardPlayScreen` style: 9 slots, player 5 cards vs opponent 5 cards, flip engine).
   - Match victory awards 50 EXP to active deck cards (`cardNurtureStore.awardBattleVictoryExp(50)`), supports repeat hunting (`[🔁 반복 사냥]`), and auto-play advances chapter by chapter.
   - Tab 2: `arcade`: 110 Poki minigames catalog (`CARD_DATABASE` IDs 1..110) with search bar, element filter pills, `[🎲 랜덤 플레이]` die roller, and full-screen 100dvh launch modal with 44px+ exit button.
   - Tab 3: `webtoon`: 40-episode webtoon player strictly preserving the exact 5-button control bar (`닫기`, `이전`, `다음`, `나레이션`, `TTS`) inside `<section ... aria-label="웹툰 컨트롤 바">` and `isTtsActive: false` default invariant to guarantee 100% test pass on `T1.PLAY.5` and `ADV.PLAY.1~6`.
2. Update `src/landing/index.ts`:
   - Route map and event delegation for `#play` actions: tab switching, tile step movement, D-Pad, dialogue choices/advance, battle triggers/victory, auto-mode toggle, arcade search/filters/launch.
   - Global keydown interception for Arrow keys and W/A/S/D to step hero when on `#play`.
3. Invariant constraints:
   - ZERO React runtime in `dist/index.html` (`ADV.BUILD.2`: no `vendor-react` or `react-dom` in `dist/index.html`, bundle size < 50 KB). All landing view markup must be pure TypeScript template strings.
   - `DESIGN.md` OpenCode Terminal Flat geometry: `rounded-none` or `rounded-sm`, 0 prohibited classes (`rounded-xl`, `rounded-2xl`, `rounded-3xl`, `animate-bounce`).
   - 44px+ touch targets (`min-h-[44px] min-w-[44px]`).
4. Create and run `tests/adversarial_m3_play_game_loop.ts` with all 7 suites and 26 assertions from Explorer 3's specification. Ensure 26/26 PASS.
5. Verification commands:
   - `npx tsx tests/adversarial_m3_play_game_loop.ts` (all 26 pass)
   - `npx tsx tests/e2e/run_all.ts` (all 76 pass)
   - `npx tsx tests/adversarial_challenger_m3_landing.ts` (all 22 pass)
   - `npx tsc --noEmit` (0 errors)
   - `npm run build` (success, dist/index.html < 50 KB)
6. Local git commit only (`git commit -m "feat(play): implement Milestone 3 2D tile game, battle loop, and Poki 110 arcade parity"`). NEVER git push!
7. Submit Google Form report:
   ```bash
   python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "Milestone 3 #play Tile Game, Battle Loop & Poki 110 Arcade Parity" --status "작업완료" --details "Implemented 2D tile map, episode dialogue trigger, 3x3 battle loop with 50 EXP reward, auto-play progression, 110 Poki arcade catalog, and preserved 5-button webtoon viewer. All 26 adversarial assertions and 76 E2E tests pass."
   ```
8. Write `handoff.md` in `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3_9/handoff.md` and send completion message back to parent.
