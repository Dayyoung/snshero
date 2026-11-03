# Milestone 4 Investigation & Implementation Blueprint: Owned Cards Gating & Free EXP Removal

**Date**: 2026-11-02  
**Agent**: `explorer_m4_9_1`  
**Target Milestone**: Milestone 4 (`#card` Nurturing & Repeat Hunting, Features 13, 14, 15)  
**Target Files**:
- `/Users/dayyoung/project/snshero/src/landing/views/CardSection.tsx`
- `/Users/dayyoung/project/snshero/src/landing/services/cardNurtureStore.ts`
- `/Users/dayyoung/project/snshero/src/landing/index.ts`

---

## 1. Observation

### 1.1 Cheat EXP Buttons in `src/landing/views/CardSection.tsx`
Direct inspection of `src/landing/views/CardSection.tsx` revealed explicit cheat buttons granting arbitrary free EXP on lines 257–282:
```html
256:                 <!-- Nurture Buttons -->
257:                 <div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
258:                   <button
259:                     type="button"
260:                     data-action="nurture-card"
261:                     data-card-id="${selectedCard.cardId}"
262:                     data-exp="50"
263:                     ${selectedCard.level >= 100 ? 'disabled' : ''}
264:                     class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
265:                       selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
266:                     }"
267:                   >
268:                     ${selectedCard.level >= 100 ? '최대 레벨 도달 (Lv.100 MAX)' : '카드 육성하기 (+50 EXP)'}
269:                   </button>
270:                   <button
271:                     type="button"
272:                     data-action="nurture-card"
273:                     data-card-id="${selectedCard.cardId}"
274:                     data-exp="500"
275:                     ${selectedCard.level >= 100 ? 'disabled' : ''}
276:                     class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer ${
277:                       selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
278:                     }"
279:                   >
280:                     10회 연속 육성 (+500 EXP)
281:                   </button>
282:                 </div>
```

### 1.2 Event Listener in `src/landing/index.ts`
In `src/landing/index.ts` lines 342–348, an event delegation block handles `action === 'nurture-card'`:
```typescript
342:   } else if (action === 'nurture-card') {
343:     const cardId = Number(target.getAttribute('data-card-id'));
344:     const expGain = Number(target.getAttribute('data-exp') || '50');
345:     if (cardId) {
346:       cardNurtureStore.nurtureCard(cardId, expGain);
347:       renderApp();
348:     }
```

### 1.3 Missing Ownership Guards in `src/landing/services/cardNurtureStore.ts`
1. `nurtureCard` (lines 226–267) does NOT call `this.isCardOwned(cardId)`:
```typescript
226:   nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
227:     let card = this.cards[cardId];
...
```
2. `allocateStat` (lines 272–285) does NOT call `this.isCardOwned(cardId)`:
```typescript
272:   allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
273:     const card = this.cards[cardId];
274:     if (!card || card.statPoints <= 0) {
275:       return false;
276:     }
...
```
3. `hasUnspentPoints` (lines 289–292) does NOT check `this.isCardOwned(cardId)`:
```typescript
289:   hasUnspentPoints(cardId: number): boolean {
290:     const card = this.cards[cardId];
291:     return !!card && card.statPoints > 0;
292:   }
```

### 1.4 Missing Inspector Gating in `CardSection.tsx`
In `src/landing/views/CardSection.tsx` lines 69–78 and 206–420, `selectedCard` is retrieved as `cardNurtureStore.cards[localState.selectedCardId]`. Since `cardNurtureStore.initDefaultCards()` populates cards 1..110 by default, `selectedCard` is non-null for unowned cards. The inspector panel fails to check `cardNurtureStore.isCardOwned(localState.selectedCardId)` and exposes nurture and stat enhancement controls for all 110 cards regardless of ownership.

### 1.5 LocalStorage Persistence State
- Key `hero_card_nurturing`: Contains `{ cards, ownedCardIds, deckCardIds, activeDeckIds, updatedAt }`.
- Key `hero_deck`: Contains JSON array of 5 active card IDs.
- Key `hero_inventory`: Stores inventory record map (`Record<string, { cardIndex?: number, id?: number, quantity: number, rarity?: string }>`). Currently, `cardNurtureStore.addCard()` only updates `this.ownedCardIds` and does not dual-write to `hero_inventory`.

---

## 2. Logic Chain

1. **Premise**: PROJECT.md Feature 13 and `ORIGINAL_REQUEST.md` (Approved Task Prompt R1) mandate:
   - "Character nurturing is restricted strictly to owned characters."
   - "Nurturing requires EXP earned exclusively by winning card battles."
   - "Eliminate free EXP buttons; strictly restrict leveling and stat points to owned characters."
   - "For owned cards: allow stat point allocation (N, E, S, W compass stats if unspent points exist), but EXP must NOT be directly grantable via free buttons."
   - "For unowned cards: display `[미보유]` badge, disable or hide all nurturing interaction, allow only read-only stat inspection."

2. **Deduction on Cheat Removal**:
   - The buttons `카드 육성하기 (+50 EXP)` and `10회 연속 육성 (+500 EXP)` at `CardSection.tsx:257–282` directly violate Feature 13 and R1.
   - Deleting these buttons and replacing them with a battle victory guidance notice (`경험치는 플레이(Play) 모드의 카드 배틀 승리 시 자동 획득됩니다. (+50 EXP/승리)`) with a link to `#play` eliminates free EXP while preserving game loop clarity.
   - Removing or neutralizing `action === 'nurture-card'` in `src/landing/index.ts` ensures no manual/DOM injection bypass is possible.

3. **Deduction on Store Ownership Gating**:
   - In `cardNurtureStore.ts`, adding `if (!this.isCardOwned(cardId)) return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };` guarantees that unowned cards can never gain EXP or level up through programmatic calls.
   - Adding `if (!this.isCardOwned(cardId)) return false;` to `allocateStat` guarantees unowned cards cannot spend stat points.
   - Adding `if (!this.isCardOwned(cardId)) return false;` to `hasUnspentPoints` guarantees unowned cards never trigger the red dot indicator.

4. **Deduction on Inspector UI Gating in `CardSection.tsx`**:
   - By checking `const isSelectedCardOwned = localState.selectedCardId ? cardNurtureStore.isCardOwned(localState.selectedCardId) : false;`:
     - **Owned cards**: Render `[보유]` badge, current level (`Lv.X / 100`), EXP progress bar, battle victory notice, and interactive 4-way stat allocation matrix (enabled if `statPoints > 0`, disabled if 0).
     - **Unowned cards**: Render `[미보유]` badge, `grayscale opacity-75` portrait, `미보유 (Lv.1 대기 중)` status, locked banner with link to `#shop` (`상점에서 카드팩 뽑기 ➔`), and read-only 4-way base stats (`CARD_DATABASE` values) with disabled buttons (`미보유 (강화 불가)`) omitting `data-action="allocate-stat"`.

5. **Deduction on Persistence Dual-Write**:
   - `cardNurtureStore.addCard(cardId)` must call `syncCardToHeroInventory(cardId)` to ensure cards acquired in `#shop` or via rewards are reflected in `hero_inventory`, satisfying Feature 17 and legacy view compatibility.
   - `loadFromStorage()` must inspect `hero_inventory` so existing cards are added to `ownedCardIds`.

---

## 3. Caveats

1. **Item Pack in Shop**: `ShopSection.tsx` line 181 has `itemId === 'item_pack'` which grants 250 EXP to cards 1..5 (`cardNurtureStore.nurtureCard(id, 250)`). This is a paid shop item (500 SNS coins) for starter cards, which is legitimate. However, with `nurtureCard` guarded by `isCardOwned`, cards 1..5 will safely receive EXP only because they are owned.
2. **Battle Victory Hook**: In `src/landing/services/playRpgEngine.ts`, `finishBattleAndAwardExp()` calls `awardBattleVictoryExp(50)`. Currently `playRpgEngine.ts` monkey-patches `awardBattleVictoryExp` onto `cardNurtureStore` if missing. Implementing `awardBattleVictoryExp` directly on `CardNurtureStore` makes this first-class and prevents dependency on monkey-patching.
3. **No Caveats on Design System**: All proposed UI changes strictly comply with `DESIGN.md` (`font-mono`, `rounded-none` containers, `rounded-sm` buttons, `1px` hairline borders, and `min-h-[44px]` touch targets).

---

## 4. Conclusion & Drop-In Implementation Blueprint

### 4.1 Changes to `src/landing/views/CardSection.tsx`

#### Blueprint A: Ownership Detection in State (Lines 69–78)
```typescript
<<<<
  const selectedCard = localState.selectedCardId
    ? cardNurtureStore.cards[localState.selectedCardId]
    : null;
  const selectedAsset = localState.selectedCardId
    ? getCharacterAsset(localState.selectedCardId)
    : null;
  const selectedDbCard = localState.selectedCardId
    ? CARD_DATABASE[localState.selectedCardId]
    : null;
====
  const selectedCard = localState.selectedCardId
    ? cardNurtureStore.cards[localState.selectedCardId]
    : null;
  const selectedAsset = localState.selectedCardId
    ? getCharacterAsset(localState.selectedCardId)
    : null;
  const selectedDbCard = localState.selectedCardId
    ? CARD_DATABASE[localState.selectedCardId]
    : null;
  const isSelectedCardOwned = localState.selectedCardId
    ? cardNurtureStore.isCardOwned(localState.selectedCardId)
    : false;
>>>>
```

#### Blueprint B: Selected Card Inspector Header & Badges (Lines 210–240)
```typescript
<<<<
              <!-- Card Portrait -->
              <div class="relative w-36 h-48 sm:w-44 sm:h-56 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-center overflow-hidden">
                <img
                  src="${selectedAsset.bustPngUrl}"
                  alt="${selectedAsset.nameKo}"
                  class="max-w-full max-h-full object-contain"
                  onerror="this.src='${selectedAsset.seatUrl}'; this.onerror=null;"
                />
                ${cardNurtureStore.hasUnspentPoints(selectedCard.cardId) ? `
                  <span class="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm shadow-none">
                    스탯 UP!
                  </span>
                ` : ''}
              </div>

              <!-- Card Details & EXP Progression -->
              <div class="space-y-3 text-center sm:text-left">
                <div class="inline-flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
                    ${selectedAsset.code}
                  </span>
                  <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm uppercase">
                    ${selectedAsset.faction} · ${selectedAsset.rarity}
                  </span>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#201d1d] m-0">
                  ${selectedAsset.nameKo} (${selectedAsset.nameEn})
                </h2>
                <div class="text-xs text-stone-600">
                  현재 레벨: <strong class="text-sm text-[#201d1d]">Lv.${selectedCard.level} / 100</strong>
                </div>
====
              <!-- Card Portrait -->
              <div class="relative w-36 h-48 sm:w-44 sm:h-56 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-center overflow-hidden">
                <img
                  src="${selectedAsset.bustPngUrl}"
                  alt="${selectedAsset.nameKo}"
                  class="max-w-full max-h-full object-contain ${isSelectedCardOwned ? '' : 'grayscale opacity-75'}"
                  onerror="this.src='${selectedAsset.seatUrl}'; this.onerror=null;"
                />
                ${isSelectedCardOwned && cardNurtureStore.hasUnspentPoints(selectedCard.cardId) ? `
                  <span class="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm shadow-none">
                    스탯 UP!
                  </span>
                ` : ''}
              </div>

              <!-- Card Details & EXP Progression -->
              <div class="space-y-3 text-center sm:text-left">
                <div class="inline-flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
                    ${selectedAsset.code}
                  </span>
                  <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm uppercase">
                    ${selectedAsset.faction} · ${selectedAsset.rarity}
                  </span>
                  <span class="px-2 py-0.5 ${
                    isSelectedCardOwned
                      ? 'bg-emerald-700 text-[#fdfcfc]'
                      : 'bg-stone-300 text-stone-700'
                  } text-[10px] font-bold rounded-sm">
                    ${isSelectedCardOwned ? '[보유]' : '[미보유]'}
                  </span>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#201d1d] m-0">
                  ${selectedAsset.nameKo} (${selectedAsset.nameEn})
                </h2>
                <div class="text-xs text-stone-600">
                  ${isSelectedCardOwned ? `
                    현재 레벨: <strong class="text-sm text-[#201d1d]">Lv.${selectedCard.level} / 100</strong>
                  ` : `
                    상태: <strong class="text-sm text-stone-500">미보유 (Lv.1 대기 중)</strong>
                  `}
                </div>
>>>>
```

#### Blueprint C: EXP Section & Free EXP Buttons Removal (Lines 242–282)
Replace cheat buttons with battle victory notice for owned cards, and locked notice for unowned cards:
```typescript
<<<<
                <!-- EXP Progress Bar -->
                <div class="w-full sm:w-64 space-y-1">
                  <div class="flex justify-between text-[10px] text-stone-500">
                    <span>경험치 (EXP)</span>
                    <span>${selectedCard.exp} / ${selectedCard.expToNext}</span>
                  </div>
                  <div class="w-full bg-[#f1eeee] h-2 rounded-sm overflow-hidden">
                    <div
                      class="bg-emerald-600 h-full transition-all duration-300"
                      style="width: ${selectedCard.level >= 100 ? 100 : Math.min(100, Math.floor((selectedCard.exp / selectedCard.expToNext) * 100))}%"
                    ></div>
                  </div>
                </div>

                <!-- Nurture Buttons -->
                <div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    data-action="nurture-card"
                    data-card-id="${selectedCard.cardId}"
                    data-exp="50"
                    ${selectedCard.level >= 100 ? 'disabled' : ''}
                    class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
                    }"
                  >
                    ${selectedCard.level >= 100 ? '최대 레벨 도달 (Lv.100 MAX)' : '카드 육성하기 (+50 EXP)'}
                  </button>
                  <button
                    type="button"
                    data-action="nurture-card"
                    data-card-id="${selectedCard.cardId}"
                    data-exp="500"
                    ${selectedCard.level >= 100 ? 'disabled' : ''}
                    class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
                    }"
                  >
                    10회 연속 육성 (+500 EXP)
                  </button>
                </div>
====
                ${isSelectedCardOwned ? `
                  <!-- EXP Progress Bar (Owned) -->
                  <div class="w-full sm:w-64 space-y-1">
                    <div class="flex justify-between text-[10px] text-stone-500">
                      <span>경험치 (EXP)</span>
                      <span>${selectedCard.exp} / ${selectedCard.expToNext}</span>
                    </div>
                    <div class="w-full bg-[#f1eeee] h-2 rounded-sm overflow-hidden">
                      <div
                        class="bg-emerald-600 h-full transition-all duration-300"
                        style="width: ${selectedCard.level >= 100 ? 100 : Math.min(100, Math.floor((selectedCard.exp / selectedCard.expToNext) * 100))}%"
                      ></div>
                    </div>
                  </div>

                  <!-- Legitimate Battle EXP Guidance (Zero Free EXP Buttons) -->
                  <div class="pt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div class="px-3 py-2 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs text-stone-700 flex items-center gap-2">
                      <span class="text-emerald-700 font-bold">⚔️ 전투 육성:</span>
                      <span>경험치는 플레이(Play) 모드의 카드 배틀 승리 시 자동 획득됩니다. (+50 EXP/승리)</span>
                    </div>
                    <a
                      href="#play"
                      class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center no-underline cursor-pointer"
                    >
                      전투하러 가기 ➔
                    </a>
                  </div>
                ` : `
                  <!-- Nurturing Locked Notice (Unowned) -->
                  <div class="p-3 bg-[#f8f7f7] border border-dashed border-stone-300 rounded-none text-xs text-stone-600 space-y-1.5 max-w-md">
                    <div class="font-bold text-[#201d1d] flex items-center gap-1.5">
                      <span>🔒 미보유 카드 (육성 잠김)</span>
                    </div>
                    <div>
                      아직 획득하지 않은 영웅 카드입니다. 육성(경험치 획득 및 4방향 스탯 강화)은 카드 획득 후 진행할 수 있습니다.
                    </div>
                    <div class="pt-1">
                      <a
                        href="#shop"
                        class="inline-flex items-center justify-center px-3 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 no-underline min-h-[44px] cursor-pointer"
                      >
                        상점에서 카드팩 뽑기 ➔
                      </a>
                    </div>
                  </div>
                `}
>>>>
```

#### Blueprint D: 4-Way Directional Stat Matrix Gating (Lines 297–418)
```typescript
<<<<
          <!-- 4-Way Directional Stat Enhancement Matrix -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[rgba(15,0,0,0.08)]">
              <div>
                <span class="text-[11px] text-stone-500 uppercase tracking-wider">4방향 스탯 인핸스먼트</span>
                <h3 class="text-base font-bold text-[#201d1d] m-0">방향별 능력치 배분</h3>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-600">미분배 스탯 포인트:</span>
                <span class="px-2.5 py-1 ${
                  selectedCard.statPoints > 0 ? 'bg-red-600 text-white' : 'bg-[#f1eeee] text-[#201d1d]'
                } text-xs font-bold rounded-sm">
                  ${selectedCard.statPoints} P
                </span>
              </div>
            </div>
...
====
          <!-- 4-Way Directional Stat Matrix -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[rgba(15,0,0,0.08)]">
              <div>
                <span class="text-[11px] text-stone-500 uppercase tracking-wider">
                  ${isSelectedCardOwned ? '4방향 스탯 인핸스먼트' : '기본 능력치 정보 (도감 조회)'}
                </span>
                <h3 class="text-base font-bold text-[#201d1d] m-0">
                  ${isSelectedCardOwned ? '방향별 능력치 배분' : '4방향 기본 능력치'}
                </h3>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-600">미분배 스탯 포인트:</span>
                <span class="px-2.5 py-1 ${
                  isSelectedCardOwned && selectedCard.statPoints > 0
                    ? 'bg-red-600 text-white'
                    : 'bg-[#f1eeee] text-[#201d1d]'
                } text-xs font-bold rounded-sm">
                  ${isSelectedCardOwned ? `${selectedCard.statPoints} P` : '0 P (미보유)'}
                </span>
              </div>
            </div>

            ${isSelectedCardOwned && selectedCard.statPoints > 0 ? `
              <div class="p-3 bg-[#fff7ed] border border-amber-300 rounded-none text-xs text-amber-800">
                [!] 보유 중인 스탯 포인트(${selectedCard.statPoints}P)가 있습니다. 원하는 방향의 [+] 버튼을 눌러 스탯을 강화하세요.
              </div>
            ` : !isSelectedCardOwned ? `
              <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-600">
                [안내] 미보유 카드는 기본 능력치 조회가 가능하며, 상점에서 카드 획득 후 스탯 포인트 분배가 가능합니다.
              </div>
            ` : ''}

            <!-- 4-Way Grid Layout -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Top (N) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">상단 (Top / N)</span>
                  <span class="text-xs font-semibold text-emerald-700">
                    ${isSelectedCardOwned ? `+${selectedCard.bonusStats.top} 보너스` : '기본'}
                  </span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${isSelectedCardOwned ? (selectedDbCard?.top || 0) + selectedCard.bonusStats.top : (selectedDbCard?.top || 0)}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.top || 0})</span>
                </div>
                ${isSelectedCardOwned ? `
                  <button
                    type="button"
                    data-action="allocate-stat"
                    data-card-id="${selectedCard.cardId}"
                    data-direction="top"
                    ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                    class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                    }"
                  >
                    + 상단(N) 강화
                  </button>
                ` : `
                  <button
                    type="button"
                    disabled
                    class="w-full py-2 bg-stone-200 text-stone-400 text-xs font-semibold rounded-sm opacity-60 cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  >
                    미보유 (강화 불가)
                  </button>
                `}
              </div>

              <!-- Right (E) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">우측 (Right / E)</span>
                  <span class="text-xs font-semibold text-emerald-700">
                    ${isSelectedCardOwned ? `+${selectedCard.bonusStats.right} 보너스` : '기본'}
                  </span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${isSelectedCardOwned ? (selectedDbCard?.right || 0) + selectedCard.bonusStats.right : (selectedDbCard?.right || 0)}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.right || 0})</span>
                </div>
                ${isSelectedCardOwned ? `
                  <button
                    type="button"
                    data-action="allocate-stat"
                    data-card-id="${selectedCard.cardId}"
                    data-direction="right"
                    ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                    class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                    }"
                  >
                    + 우측(E) 강화
                  </button>
                ` : `
                  <button
                    type="button"
                    disabled
                    class="w-full py-2 bg-stone-200 text-stone-400 text-xs font-semibold rounded-sm opacity-60 cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  >
                    미보유 (강화 불가)
                  </button>
                `}
              </div>

              <!-- Bottom (S) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">하단 (Bottom / S)</span>
                  <span class="text-xs font-semibold text-emerald-700">
                    ${isSelectedCardOwned ? `+${selectedCard.bonusStats.bottom} 보너스` : '기본'}
                  </span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${isSelectedCardOwned ? (selectedDbCard?.bottom || 0) + selectedCard.bonusStats.bottom : (selectedDbCard?.bottom || 0)}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.bottom || 0})</span>
                </div>
                ${isSelectedCardOwned ? `
                  <button
                    type="button"
                    data-action="allocate-stat"
                    data-card-id="${selectedCard.cardId}"
                    data-direction="bottom"
                    ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                    class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                    }"
                  >
                    + 하단(S) 강화
                  </button>
                ` : `
                  <button
                    type="button"
                    disabled
                    class="w-full py-2 bg-stone-200 text-stone-400 text-xs font-semibold rounded-sm opacity-60 cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  >
                    미보유 (강화 불가)
                  </button>
                `}
              </div>

              <!-- Left (W) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">좌측 (Left / W)</span>
                  <span class="text-xs font-semibold text-emerald-700">
                    ${isSelectedCardOwned ? `+${selectedCard.bonusStats.left} 보너스` : '기본'}
                  </span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${isSelectedCardOwned ? (selectedDbCard?.left || 0) + selectedCard.bonusStats.left : (selectedDbCard?.left || 0)}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.left || 0})</span>
                </div>
                ${isSelectedCardOwned ? `
                  <button
                    type="button"
                    data-action="allocate-stat"
                    data-card-id="${selectedCard.cardId}"
                    data-direction="left"
                    ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                    class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                    }"
                  >
                    + 좌측(W) 강화
                  </button>
                ` : `
                  <button
                    type="button"
                    disabled
                    class="w-full py-2 bg-stone-200 text-stone-400 text-xs font-semibold rounded-sm opacity-60 cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  >
                    미보유 (강화 불가)
                  </button>
                `}
              </div>
            </div>
          </div>
>>>>
```

---

### 4.2 Changes to `src/landing/services/cardNurtureStore.ts`

#### Blueprint E: Ownership Guards in `nurtureCard`, `allocateStat`, `hasUnspentPoints`
```typescript
<<<<
  nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    let card = this.cards[cardId];
====
  nurtureCard(cardId: number, expGain: number = 50): { expGained: number; leveledUp: boolean; newLevel: number } {
    if (!this.isCardOwned(cardId)) {
      return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
    }
    let card = this.cards[cardId];
>>>>
```

```typescript
<<<<
  allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    const card = this.cards[cardId];
    if (!card || card.statPoints <= 0) {
      return false;
    }
====
  allocateStat(cardId: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    if (!this.isCardOwned(cardId)) {
      return false;
    }
    const card = this.cards[cardId];
    if (!card || card.statPoints <= 0) {
      return false;
    }
>>>>
```

```typescript
<<<<
  hasUnspentPoints(cardId: number): boolean {
    const card = this.cards[cardId];
    return !!card && card.statPoints > 0;
  }
====
  hasUnspentPoints(cardId: number): boolean {
    if (!this.isCardOwned(cardId)) {
      return false;
    }
    const card = this.cards[cardId];
    return !!card && card.statPoints > 0;
  }
>>>>
```

#### Blueprint F: Official `awardBattleVictoryExp`, `getCard`, `repeatHunting`
```typescript
  /**
   * Battle Victory EXP Hook (Feature 14):
   * On player victory, awards EXP (default 50) exclusively to active deck cards that are owned.
   */
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

  /**
   * Safe getter for card nurture data
   */
  getCard(cardId: number): CardNurtureData {
    return (
      this.cards[cardId] || {
        cardId,
        level: 1,
        exp: 0,
        expToNext: 100,
        statPoints: 0,
        bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
        totalBonus: 0,
      }
    );
  }

  /**
   * Repeat Hunting Loop (Feature 15)
   */
  setRepeatHunting(enabled: boolean): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('hero_repeat_hunting', enabled ? 'true' : 'false');
  }

  isRepeatHuntingActive(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('hero_repeat_hunting') === 'true';
  }
```

#### Blueprint G: Dual-Write to `hero_inventory` on `addCard` & Safe Load
```typescript
<<<<
  addCard(cardId: number): boolean {
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
    if (!this.ownedCardIds.includes(cardId)) {
      this.ownedCardIds.push(cardId);
      this.ownedCardIds.sort((a, b) => a - b);
      this.ensureValidDeck();
      this.saveToStorage();
      this.dispatchUpdateEvent(cardId);
      return true;
    }
    return false;
  }
====
  addCard(cardId: number): boolean {
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
    let added = false;
    if (!this.ownedCardIds.includes(cardId)) {
      this.ownedCardIds.push(cardId);
      this.ownedCardIds.sort((a, b) => a - b);
      this.ensureValidDeck();
      added = true;
    }
    this.syncCardToHeroInventory(cardId);
    this.saveToStorage();
    this.dispatchUpdateEvent(cardId);
    return added;
  }

  private syncCardToHeroInventory(cardId: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const rawInv = localStorage.getItem('hero_inventory');
      const inv: Record<string, any> = rawInv ? JSON.parse(rawInv) : {};
      const key = String(cardId);
      if (!inv[key]) {
        inv[key] = {
          cardIndex: cardId,
          id: cardId,
          quantity: 1,
          rarity: CARD_DATABASE[cardId]?.rarity || 'bronze',
        };
      } else {
        inv[key].quantity = (inv[key].quantity || 0) + 1;
      }
      const serialized = JSON.stringify(inv);
      localStorage.setItem('hero_inventory', serialized);
      localStorage.setItem(`hero_inventory_${season}`, serialized);
      localStorage.setItem(`hero_inventory_guest_${season}`, serialized);
    } catch (e) {
      console.warn('Failed to sync to hero_inventory:', e);
    }
  }
>>>>
```

---

### 4.3 Changes to `src/landing/index.ts`
```typescript
<<<<
  } else if (action === 'nurture-card') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const expGain = Number(target.getAttribute('data-exp') || '50');
    if (cardId) {
      cardNurtureStore.nurtureCard(cardId, expGain);
      renderApp();
    }
  } else if (action === 'allocate-stat') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const direction = target.getAttribute('data-direction') as 'top' | 'right' | 'bottom' | 'left';
    if (cardId && direction) {
      cardNurtureStore.allocateStat(cardId, direction);
      renderApp();
    }
====
  } else if (action === 'nurture-card') {
    // Prohibited: free EXP buttons completely eliminated in M4.
    // Ignored to prevent cheat injection.
  } else if (action === 'allocate-stat') {
    const cardId = Number(target.getAttribute('data-card-id'));
    const direction = target.getAttribute('data-direction') as 'top' | 'right' | 'bottom' | 'left';
    if (cardId && direction && cardNurtureStore.isCardOwned(cardId)) {
      cardNurtureStore.allocateStat(cardId, direction);
      renderApp();
    }
>>>>
```

---

## 5. Verification Method

1. **Compilation Check**:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with code 0 without any TypeScript type errors.

2. **Automated E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   Verify all 76 assertions across Tiers 1–4 pass 100%, specifically:
   - `[T1.CARD.1] [M4] '카드' Section Naming & 110-Card Comprehensive Grid`
   - `[T1.CARD.2] [M4] Strict Owned-Only Nurturing Restriction (isCardOwned Guard)`
   - `[T1.CARD.3] [M4] Complete Elimination of Free EXP Buttons in Nurturing Interface`
   - `[T1.CARD.4] [M4] Battle Victory EXP Gating Hook (50 EXP per Victory)`
   - `[T1.CARD.5] [M4] Repeat Hunting (반복 사냥) Auto-Loop Match Completion Flag`
   - `[T1.CARD.6] [M4] 1~100Lv EXP Curve & 4-Way Stat Point Allocation`
   - `[T2.B2.1] [M4] Unowned Card Nurturing Rejection & Zero EXP Leakage`

3. **Production Build Verification**:
   ```bash
   npm run build
   ```
   Must generate clean static bundles with 0 Vite errors.

4. **Invalidation Conditions**:
   - Any recurrence of free EXP buttons (`+50 EXP`, `+500 EXP`) in `CardSection.tsx`.
   - Any ability of an unowned card to gain EXP or allocate stat points via UI or direct store invocation.
   - Red dot indicator appearing on an unowned card.
   - Missing `[미보유]` badge on unowned card inspector or card grid.
