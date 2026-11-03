## 2026-11-02T11:38:54Z
You are worker_m4_9, the Milestone 4 Worker.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m4_9/
Your parent conversation ID is: 21826d14-7bc9-4995-866c-cbb42a941789

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY CONSTRAINTS:
1. Read the authoritative user request at `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`.
2. Read the master project plan at `/Users/dayyoung/project/snshero/PROJECT.md`.
3. Read the three Explorer handoff reports:
   - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_1/handoff.md`
   - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_2/handoff.md`
   - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_3/handoff.md`
4. NEVER run `git push`. Only local commits (`git commit`) are permitted.
5. Adhere 100% to OpenCode.ai terminal flat design: font-mono, 0px/4px border radius, single flat surfaces, >=44px touch targets.
6. LocalStorage only (`hero_xxx`).

OBJECTIVE:
Implement Milestone 4: `#card` Character Nurturing Strictly Restricted to Owned Characters, Elimination of Free EXP Cheat Buttons, Battle Victory EXP Hook (+50 EXP to active deck cards on battle victory), and Repeat Hunting (`[🔁 반복 사냥]`) Auto-Loop.

FILES YOU EXCLUSIVELY OWN AND MUST MODIFY/CREATE:
1. `src/landing/services/cardNurtureStore.ts`:
   - In `nurtureCard(cardId: number, expGain: number = 50)`:
     Add strict ownership and bounds validation:
     ```typescript
     if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110 || !this.isCardOwned(cardId)) {
       return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
     }
     ```
   - In `allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left')`:
     Add ownership and direction validation:
     ```typescript
     if (!this.isCardOwned(cardId) || !['top', 'right', 'bottom', 'left'].includes(direction)) {
       return false;
     }
     ```
   - In `hasUnspentPoints(cardId: number)`:
     Add ownership guard: `if (!this.isCardOwned(cardId)) return false;`
   - Implement first-class `awardBattleVictoryExp` directly on `CardNurtureStore` class:
     ```typescript
     awardBattleVictoryExp(expGain: number = 50): { expAwarded: number; deckCount: number; updatedCards: number[] } {
       this.ensureValidDeck();
       const updatedCards: number[] = [];
       for (const cardId of this.activeDeckIds) {
         if (this.isCardOwned(cardId)) {
           this.nurtureCard(cardId, expGain);
           updatedCards.push(cardId);
         }
       }
       this.saveToStorage();
       return { expAwarded: expGain, deckCount: this.activeDeckIds.length, updatedCards };
     }
     ```
   - Implement `setRepeatHunting(enabled: boolean)` and `isRepeatHuntingActive(): boolean` (synced to `localStorage.setItem('hero_repeat_hunting', enabled ? 'true' : 'false')`).
   - In `loadFromStorage()`: Ensure integer validation on `ownedCardIds`:
     ```typescript
     .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 110)
     ```
   - In `addCard(cardId: number)`: Ensure newly acquired cards are dual-written to `hero_inventory` via `syncCardToHeroInventory(cardId)`.

2. `src/landing/views/CardSection.tsx`:
   - Gated UI based on ownership:
     `const isSelectedCardOwned = localState.selectedCardId ? cardNurtureStore.isCardOwned(localState.selectedCardId) : false;`
   - Render clear `[보유]` (emerald) / `[미보유]` (stone) badges on card list items and detail view.
   - For unowned cards in card portrait: apply grayscale styling (`grayscale opacity-60`).
   - COMPLETELY ELIMINATE all free EXP cheat buttons:
     Remove `data-action="nurture-card"`, `data-exp="50"`, `카드 육성하기 (+50 EXP)`.
     Remove `data-exp="500"`, `10회 연속 육성 (+500 EXP)`.
   - Replace with clean terminal-flat battle victory guide notice:
     ```html
     <!-- Battle Victory EXP Guide Notice -->
     <div class="pt-2">
       <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-600 flex items-center gap-2">
         <span class="text-emerald-700 font-bold">[EXP 획득 가이드]</span>
         <span>경험치는 카드 배틀 승리 시 덱 출격 카드 5장에 자동 지급됩니다 (+50 EXP).</span>
         <a href="#play" class="ml-auto px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm hover:opacity-90 transition-opacity">배틀하러 가기</a>
       </div>
     </div>
     ```
   - For unowned cards: display locked guidance notice with link to `#shop` (`상점에서 카드 팩을 구매하여 영웅을 영입하세요`).
   - For unowned cards: disable the 4-way stat allocation buttons (`disabled class="... opacity-50 cursor-not-allowed"` with label `미보유 (강화 불가)`), and omit `data-action="allocate-stat"`.

3. `src/landing/index.ts`:
   - Remove or guard `action === 'nurture-card'` click handler so arbitrary DOM clicks or script injections cannot grant free EXP.
   - In `action === 'allocate-stat'`, check `if (!cardNurtureStore.isCardOwned(cardId)) return;`.

4. `src/landing/services/playRpgEngine.ts`:
   - In `finishBattleAndAwardExp()` and `finalizeBattle()`, call `cardNurtureStore.awardBattleVictoryExp(50)`.
   - When victory occurs and `playRpgState.repeatHunting` is true, auto-schedule battle restart (`setTimeout(() => initBattle(), 1500)`).
   - In `toggleRepeatHunting()`, delegate to `cardNurtureStore.setRepeatHunting(playRpgState.repeatHunting)`.

5. `src/views/MobileCardPlayScreen.tsx`:
   - Integrate `isRepeatHunting` state synced with `hero_repeat_hunting`.
   - On player victory, call `cardNurtureStore.awardBattleVictoryExp(50)`.
   - On battle result overlay, render `[🔁 반복 사냥]` toggle button; if active, automatically restart battle after match without manual clicks.

6. Deploy test file:
   - Copy `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m4_9_3/proposed_tests_adversarial_m4_card_nurturing.ts` to `/Users/dayyoung/project/snshero/tests/adversarial_m4_card_nurturing.ts`.

REQUIRED VERIFICATION SUITES:
Execute and verify 100% pass:
1. `npx tsx tests/adversarial_m4_card_nurturing.ts` (All 44 assertions must PASS)
2. `npx tsx tests/e2e/run_all.ts` (All 76 assertions across Tiers 1-4 must PASS)
3. `npx tsx tests/adversarial_m1_build_pipeline.ts`
4. `npx tsx tests/adversarial_m2_user_interaction.ts`
5. `npx tsx tests/adversarial_m3_play_game_loop.ts`
6. `npx tsx tests/challenger_m3_9_2_empirical_stress.ts`
7. `npx tsc --noEmit` (0 errors)
8. `npm run build` (bundle size < 50 KB, zero React runtime)
9. Local git commit (`git commit -m "feat: implement Milestone 4 owned-only nurturing, battle EXP gating, and repeat hunting"`)
10. Submit Google Form report:
    `python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[Milestone 4] #card Nurturing Restricted to Owned Characters, Removal of Free EXP, Battle Victory EXP Hook, and Repeat Hunting" --status "작업완료" --details "All 44 adversarial assertions passed, 76/76 E2E passed, zero free EXP buttons, owned-only nurturing enforced, repeat hunting auto-loop enabled."`

## 2026-11-02T11:49:24Z
**Context**: Milestone 4 Implementation Status Check
**Content**: Heartbeat check on Milestone 4 implementation progress.
**Action**: Please provide a quick update on which files have been modified, current test execution status, and estimated time to completion.
