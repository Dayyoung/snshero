## 2026-11-02T06:02:00Z
# Dispatch Assignment: worker_m3_1

## Mission
Implement Milestone 3: Core Sections & Card Nurturing System (Features 12–17) based on the comprehensive findings, specifications, and code proposals from `explorer_m3_1`, `explorer_m3_2`, and `explorer_m3_3`.

## Reference Explorer Handoff Reports (READ FIRST)
1. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_1/handoff.md` (HomeSection 4 media pillars & MyDeckSection 5-card slot TP architecture)
2. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_2/handoff.md` (PlaySection 5 buttons, strict TTS contract, webtoonCatalog 40 episodes)
3. `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_3/handoff.md` (CardSection 110-card grid, cardNurtureStore 1~100Lv EXP & 4-way stat allocation, ShopSection 8 fixed items)
4. `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (Original user requirements)
5. `/Users/dayyoung/project/snshero/PROJECT.md` (Global project specifications & interface contracts)
6. `/Users/dayyoung/project/snshero/TEST_INFRA.md` (Master test suite architecture)

## Deliverables & Write Ownership
You have exclusive write ownership over the following 8 files:
1. `src/landing/services/cardNurtureStore.ts` (Card nurture engine, 1~100Lv, EXP, stat points, red dot, LocalStorage persistence)
2. `src/landing/services/webtoonCatalog.ts` (40-episode webtoon catalog and scene resolvers)
3. `src/landing/views/HomeSection.tsx` (4 media pillars: novel, game, webtoon, anime + '[절찬 연재중]' external links)
4. `src/landing/views/MyDeckSection.tsx` (5-card active deck, N+E+S+W Deck TP, Total TP, 3-tier assets, slot inspection)
5. `src/landing/views/PlaySection.tsx` (5 buttons [닫기, 이전, 다음, 나레이션, TTS], strict TTS default OFF, 40-ep webtoon scene viewer)
6. `src/landing/views/CardSection.tsx` ('카드' naming, collection rate XX/110, 110-card grid, red dot, 4-way stat allocation inspector)
7. `src/landing/views/ShopSection.tsx` (Exact 8 fixed items, zero prohibited clutter, card pack acquisition sync, hero_sns coin balance)
8. `src/landing/index.ts` (Unified routing, view mount, and document-level event delegation)

## Strict Rules & Verification Criteria
1. **ZERO REACT RUNTIME IN STATIC LANDING**:
   - `src/landing/` must remain pure TypeScript DOM/template-string renderers.
   - Do NOT import React, Three.js, or heavyweight libraries in `src/landing/`.
   - `dist/index.html` bundle must remain ultra-lightweight (< 50 KB, target < 36 KB).
2. **OpenCode Terminal-Flat Aesthetics**:
   - Monospace typography (`font-mono`) everywhere.
   - Border radius: `0px` (`rounded-none`) on containers, cards, frames, modals; max `4px` (`rounded-sm`) on buttons, inputs, badges.
   - No prohibited classes: `bg-gradient-to-*`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` (except mini dots/avatars), `animate-ping`, `animate-bounce`.
   - All interactive touch targets must have `min-h-[44px]` and `box-sizing: border-box`.
3. **Card Nurturing Math & Storage**:
   - `expToNext = level * 100` for level 1..99; cap at level 100.
   - 1 stat point per level gained.
   - 4-way stat allocation: top, right, bottom, left.
   - Red dot indicator: `hasUnspentPoints(cardId)`.
   - Deck TP: sum of active 5 cards' ($Top+Right+Bottom+Left$). Default initial is 80 TP ($11+12+17+18+22$).
   - Total TP: sum of all owned cards' power. Default initial is 80 TP.
   - LocalStorage key: `hero_card_nurturing` auto-persisted, resilient against corrupted JSON.
4. **Play Section 5 Buttons & TTS Contract**:
   - Exact 5 buttons: `['닫기', '이전', '다음', '나레이션', 'TTS']`.
   - Initial TTS state: `isTtsActive: false`. Audio playback triggers ONLY upon explicit user click.
   - Scene stepping (`prevScene`, `nextScene`) preserves TTS OFF state.
5. **Shop Section 8 Fixed Items**:
   - Exact 8 items: `'일반 카드팩'`, `'매직 카드팩'`, `'희귀 카드팩'`, `'아이템 팩'`, `'광고 제거'`, `'공식 소설'`, `'공식 동영상'`, `'코인 충전'`.
   - Prohibited clutter items strictly forbidden: `['행운의 룰렛', 'VIP 패스', '보물상자']`.
6. **Verification Steps**:
   - Run `npx tsc --noEmit` -> Must pass with 0 errors.
   - Run `npm run build` -> Must succeed cleanly and bundle size of `dist/index.html` must remain < 50 KB.
   - Run `npx tsx tests/e2e/run_all.ts --milestone M3` -> All Milestone 3 assertions must PASS (100%).
   - Run `npx tsx tests/e2e/run_all.ts --milestone M1` and `run_all.ts --milestone M2` -> No regressions.
   - Run `python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[M3 구현] 핵심 5대 화면 및 카드 육성 시스템 완성" --status "작업완료" --details "..."` to submit mandatory Google Form.
   - Run `git commit` (commit only, NO push!).

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
