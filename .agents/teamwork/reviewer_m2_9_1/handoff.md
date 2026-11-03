# Review & Adversarial Audit Report — Milestone 2 (Home Logos & Deck Editing Parity)

- **Reviewer**: reviewer_m2_9_1 (Reviewer & Adversarial Critic)
- **Target Work Product**: Milestone 2 Implementation by `worker_m2_9` (Commit `5ef885aa5`)
- **Review Date**: 2026-11-02T09:41:00Z
- **Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Direct Source Code Observations
1. **Home Section (`src/landing/views/HomeSection.tsx`)**:
   - Lines 93–106: Official SNS Hero graphic logo `/logo-ko.png` rendered within accessible anchor `<a href="#home" data-nav="home" class="inline-flex items-center cursor-pointer bg-transparent transition-opacity hover:opacity-90 min-h-[44px]" aria-label="눈히어로.com 공식 로고">` with `loading="eager"`.
   - Lines 166–277: Cool Card Deck showcase section (`#home-deck-showcase`, `data-testid="cool-card-deck"`).
   - Lines 180: Total Deck CP / TP calculation displayed dynamically: `<strong class="text-base font-black text-[#201d1d]">${deckTP} CP</strong> (${deckTP} TP)`.
   - Lines 185–195: Win streak flame badge rendered dynamically: `<div ... title="${winStreak}연승 질주 중!"><span class="text-amber-400">🔥</span><span>${winStreak}연승 질주</span></div>` (fallback to `🔥 7연승 도전 중`).
   - Lines 196–204: Seamless navigation anchor to `#deck`: `<a href="#deck" data-nav="deck" class="... min-h-[44px] ...">[덱 편집]</a>`.
   - Lines 208–270: 5-card fan-folded squad preview. Symmetric rotational transforms:
     ```typescript
     const centerOffset = index - 2; // -2, -1, 0, 1, 2
     const rotation = centerOffset * 6; // -12deg, -6deg, 0deg, 6deg, 12deg
     ```
     With rarity glow classes: `rarity-glow-gold`, `rarity-glow-silver`, `rarity-glow-bronze`.
     Attributes: `data-fan-card="true"`, `data-deck-preview-card="true"`, `data-action="inspect-home-card"`, `data-card-id="${cardId}"`.
   - Lines 473–569: Click-to-inspect card popup modal (`#home-card-inspect-modal`). Displays official 7-head full-body cutout (`inspectedAsset.cutoutUrl`), 4 compass stats (N, E, S, W), special ability description, and close button (`data-action="close-home-card-inspector"`, `min-h-[44px] min-w-[44px]`).
   - Lines 383–438: 4 Core Media Pillars preserved: 웹소설 (40부작 공식 웹소설), 웹게임 (원클릭 AI 카드 웹게임), 웹툰 (840컷+ 비주얼 웹툰), 애니메이션 (시네마틱 애니메이션).
   - Lines 293–368: 3 Official External Serialization Links preserved with `[절찬 연재중]` badges:
     - Naver Web Novel: `http://novel.naver.com/challenge/list?novelId=1250635` + `[절찬 연재중]`
     - Naver Webtoon: `https://comic.naver.com/challenge/list?titleId=856677` + `[절찬 연재중]`
     - Munpia Novel: `https://nlink.munpia.com/link/munpia/novel/616551` + `[절찬 연재중]`

2. **MyDeck Section (`src/landing/views/MyDeckSection.tsx`)**:
   - Lines 384–472: Active 5 deck slots grid (`SLOT 01` through `SLOT 05`).
   - Lines 444–451: Directional compass stats displayed:
     `북(N): ${stats.top}`, `서(W): ${stats.left}`, `동(E): ${stats.right}`, `남(S): ${stats.bottom}`.
   - Lines 401–405: Unspent stat point indicator: `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm">+${stats.statPoints} pt</span>`.
   - Lines 460–467: `[영웅 교체]` button: `<button type="button" data-action="open-deck-swap-drawer" data-slot-index="${index}" class="... min-h-[44px] ..."><span>🔄</span><span>영웅 교체</span></button>`.
   - Lines 118–254: Interactive Owned Card Replacement Drawer (`#deck-swap-drawer-backdrop`).
     - Populated via `cardNurtureStore.getOwnedCards()`.
     - Active squad cards disabled with `[SLOT 0X 출격 중 (중복 불가)]` (`cursor-not-allowed`, `disabled`).
     - Current slot card disabled with `[현재 슬롯 장착 중]`.
     - Eligible cards provide swap button: `<button type="button" data-action="swap-deck-card" data-slot-index="${editingSlot}" data-card-id="${card.cardId}" class="... min-h-[44px] ...">이 영웅으로 교체 (EQUIP) →</button>`.
   - Lines 323–364: 3-tier metrics dashboard displaying real-time Deck TP (`cardNurtureStore.getDeckTP()`), Total TP (`cardNurtureStore.getTotalTP()`), and slot capacity (5 / 5 SLOTS).
   - Lines 477–621: Detailed selected card inspection panel showing 7-head cutout, level, EXP bar, unspent stat points warning, and 4-way compass stats breakdown.

3. **Store & LocalStorage Sync (`src/landing/services/cardNurtureStore.ts`)**:
   - Lines 37–54: Active squad tracked via `activeDeckIds` (default `[1, 2, 3, 4, 5]`) with alias getter/setter `deckCardIds`.
   - Lines 148–158: `getDeckTP()` dynamically calculates sum of `basePower + totalBonus` for active 5 cards.
   - Lines 176–204: `setDeckCard(slotIndex, cardId)` validates integer slot (0..4), card ID (1..110), ownership via `isCardOwned(cardId)`, and performs slot-swapping deduplication:
     ```typescript
     const existingIndex = currentDeck.indexOf(cardId);
     if (existingIndex !== -1 && existingIndex !== slotIndex) {
       currentDeck[existingIndex] = currentDeck[slotIndex];
     }
     currentDeck[slotIndex] = cardId;
     this.activeDeckIds = currentDeck;
     ```
     Strictly preserving `Set(activeDeckIds).size === 5`.
   - Lines 328–347: `saveToStorage()` synchronizes state to `hero_card_nurturing` and dual-writes active squad to `hero_deck`.
   - Lines 352–391: `syncToLegacyDeck()` writes `hero_deck_${season}` and `hero_deck_guest_${season}` in legacy `CardData[]` object format with `typeof window !== 'undefined'` guard.
   - Lines 397–495: `loadFromStorage()` & `bootstrapDeckFromLegacy()` gracefully recover corrupted JSON and support dual-format loading (number array `[1, 2, 3, 4, 5]` and legacy object array `[{ id: 1, ... }]`).

4. **Event Wiring & Modals (`src/landing/index.ts`)**:
   - Lines 269–309: Handlers for `inspect-home-card`, `close-home-card-inspector`, `open-deck-swap-drawer`, `close-deck-swap-drawer`, `swap-deck-card`, and `select-deck-card`.
   - Lines 360–371: Global ESC keydown handling dismisses open inspector or deck swap drawer in clean LIFO order.

5. **Styling & Design Tokens (`src/landing/styles/landing.css`)**:
   - Lines 231–261: `.fan-deck-card`, `.fan-card` hover/focus transforms (`scale(1.08)` and `z-index: 50`) and glowing rarity classes (`.rarity-glow-bronze`, `.rarity-glow-silver`, `.rarity-glow-gold`, `.rarity-glow-boss`).
   - Zero occurrences of prohibited decorative classes (`rounded-lg/xl/2xl/3xl/full`, `bg-gradient-to-*`, `animate-ping`, `animate-bounce`) across target views. All interactive touch targets are verified `>= 44px`.

### 1.2 Independent Verification Execution Results
- `npx tsc --noEmit`: Exited with code 0 (0 TypeScript errors).
- `npm run build`: Exited with code 0 (4,346 modules transformed, 60 static route fallbacks generated, post-build complete).
- `npx tsx tests/adversarial_m2_home_deck.ts`: 28 of 28 assertions passed (100.0%).
- `npx tsx tests/challenger_m2_adversarial.ts`: 30 of 30 assertions passed (100.0%).
- `npx tsx tests/e2e/run_all.ts --milestone M2`: 11 of 11 assertions passed (100.0%).
- `npx tsx tests/adversarial_route_edge_cases.ts`: 76 of 76 assertions passed (100.0%).
- `npx tsx tests/adversarial_m1_build_pipeline.ts`: 64 of 64 assertions passed (100.0%).

---

## 2. Logic Chain

1. **Integrity & Authenticity Audit**:
   - A codebase-wide scan was conducted for test bypasses, hardcoded return mocks, facade classes, or cheating strings.
   - Result: Zero mocks, zero cheating strings found. The implementation executes real calculations against `CARD_DATABASE` (IDs 1–110), updates real in-memory and `localStorage` states, and generates clean HTML without simulated responses.
2. **Branding & Parity Logic**:
   - Official logo `/logo-ko.png` physically exists in `public/` (PNG magic bytes `89 50 4E 47`, 1268x716 px) and renders in `HomeSection.tsx` inside an anchor targeting `#home` with accessible alt branding and `min-h-[44px]`.
   - The 5-card fan deck displays the 5 cards from `cardNurtureStore.getDeckCardIds()` with symmetric -12° to +12° rotations (`rotation = centerOffset * 6`), correct rarity glow borders, card name, stats, and Total Deck CP.
   - The 4 core media pillars and 3 external serialization links (`novel.naver.com`, `comic.naver.com`, `munpia.com`) are fully preserved with `[절찬 연재중]` badges.
3. **Deck Editing & Deduplication Invariant**:
   - In `MyDeckSection.tsx`, 5 active slots are rendered with compass stats (N, E, S, W) and unspent point red dot indicators (`+pt`).
   - The card swap drawer only allows selecting owned cards and disables cards already in other squad slots.
   - When a card already in the squad is assigned to another slot via `setDeckCard(slotIndex, cardId)`, the store swaps the two slot positions rather than duplicating, strictly maintaining `Set(activeDeckIds).size === 5`.
   - Updating any active card's stats via `allocateStat()` immediately increments `cardNurtureStore.getDeckTP()` by +1 in real time.
4. **Adversarial Edge-Case Stress Testing**:
   - Negative, out-of-bounds, floating-point, and NaN slot indices (`-1`, `5`, `1.5`, `NaN`) are rejected with `false` without state mutation.
   - Unowned card IDs are strictly rejected with `false`.
   - Corrupted `localStorage` data (`hero_deck = '<<<INVALID>>>'`) is safely caught and falls back to default 5 cards without crashing.
   - In environments where `localStorage` is completely undefined (SSR/Node), `cardNurtureStore` operates safely in-memory without throwing runtime errors.

---

## 3. Caveats

- Milestone 2 is strictly scoped to `#home` logos/fan-deck preview and `#deck` slot editing parity. Milestones 3 (`#play`), 4 (`#card`), and 5 (`#shop` & AdSense) are scheduled for subsequent iterations.
- In accordance with the repository's strict git push policy, no remote `git push` was performed.

---

## 4. Conclusion

- The implementation for Milestone 2 (#home Logos & #deck Editing Parity) satisfies all functional requirements, visual standards (`DESIGN.md`), ergonomics standards (44px+ touch targets), fault-tolerance constraints, and integrity requirements.
- **Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce this verification:

```bash
# 1. TypeScript & Build verification
npx tsc --noEmit
npm run build

# 2. Milestone 2 Adversarial Test Harness (28 assertions)
npx tsx tests/adversarial_m2_home_deck.ts

# 3. Challenger M2 Stress Suite (30 assertions)
npx tsx tests/challenger_m2_adversarial.ts

# 4. Milestone 2 E2E Suite (11 assertions)
npx tsx tests/e2e/run_all.ts --milestone M2

# 5. Route Edge Cases Suite (76 assertions)
npx tsx tests/adversarial_route_edge_cases.ts

# 6. Build Pipeline & Post-Build Integrity Suite (64 assertions)
npx tsx tests/adversarial_m1_build_pipeline.ts
```
