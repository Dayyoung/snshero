# Handoff Report — M3-It2 Element Normalization Explorer (`explorer_m3_it2_1`)
**Role**: Explorer (Element Normalization & Drop-in Fix Designer)  
**Parent Conversation ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Verdict**: **INVESTIGATION_COMPLETE (Ready for Worker Patch)**

---

## 1. Observation

### 1.1 Verbatim Defect Details
- **Target File**: `/Users/dayyoung/project/snshero/src/landing/views/PlaySection.tsx`
- **Lines 879–892**:
  ```ts
  const elements = [
    { key: 'all', label: '전체 (All)' },
    { key: 'water', label: '물 (Water)' },
    { key: 'fire', label: '불 (Fire)' },
    { key: 'wind', label: '바람 (Wind)' },
    { key: 'earth', label: '땅 (Earth)' },
    { key: 'human', label: '인간 (Human)' },
    { key: 'undead', label: '언데드 (Undead)' },
    { key: 'elf', label: '엘프 (Elf)' },
    { key: 'dwarf', label: '호빗 (Hobbit)' },
    { key: 'monster', label: '야수 (Beast)' },
    { key: 'robot', label: '메카 (Mecha)' },
    { key: 'dragon', label: '드래곤 (Dragon)' },
  ];
  ```
- **Lines 896–912**:
  ```ts
  for (let id = 1; id <= 110; id++) {
    const card = CARD_DATABASE[id];
    if (!card) continue;

    const el = card.element?.toLowerCase() || 'water';
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;

    if (titleMatch && elMatch) {
      filteredGames.push({
        id,
        title: card.title || `Hero ${id}`,
        element: el,
        power: (card.top || 2) + (card.right || 2) + (card.bottom || 2) + (card.left || 2),
      });
    }
  }
  ```

### 1.2 Database Field Observation
- **File**: `/Users/dayyoung/project/snshero/src/cardDatabase.ts`
- **Lines 43–54**:
  Cards 21 through 30 (`Zephyros`, `Sylph`, `Sylphid`, `Harpy`, `Aeolus`, `Tempest`, `Cyclone`, `Zeusphere`, `Raijin`, `Wind God Toram`):
  ```ts
  21: { id: 21, ..., rarity: 'bronze', element: 'air', ... },
  22: { id: 22, ..., rarity: 'bronze', element: 'air', ... },
  23: { id: 23, ..., rarity: 'bronze', element: 'air', ... },
  24: { id: 24, ..., rarity: 'bronze', element: 'air', ... },
  25: { id: 25, ..., rarity: 'bronze', element: 'air', ... },
  26: { id: 26, ..., rarity: 'silver', element: 'air', ... },
  27: { id: 27, ..., rarity: 'silver', element: 'air', ... },
  28: { id: 28, ..., rarity: 'silver', element: 'air', ... },
  29: { id: 29, ..., rarity: 'gold', element: 'air', ... },
  30: { id: 30, ..., rarity: 'gold', element: 'air', title: '바람신 토람', title_en: 'Wind God Toram', ... },
  ```
  All 10 wind-tier cards have `element: 'air'`, whereas the other 10 factions match their chip keys directly (`water`, `fire`, `earth`, `human`, `undead`, `elf`, `dwarf`, `monster`, `robot`, `dragon`).

### 1.3 Verbatim Test Failure Reproduction
- **Command**: `npx tsx tests/challenger_m3_9_2_empirical_stress.ts`
- **Exit Code**: 1
- **Failure Output**:
  ```
  --- Suite 2: Search Query Narrowing & Elemental Chip Filters ---
    [FAIL] [CHAL.FILTER.1] [Element Filters] All 11 factions each contain exactly 10 cards summing to 110 with 0 overlaps
           Expected: 11 factions x 10 = 110 cards, 0 overlaps | Actual: Total: 100, Overlap: false, Counts: {"water":10,"fire":10,"wind":0,"earth":10,"human":10,"undead":10,"elf":10,"dwarf":10,"monster":10,"robot":10,"dragon":10}
  ```

### 1.4 Codebase Precedents for Air/Wind Equivalence
- `src/views/PlayGameView.tsx:13567`:
  `if (selectedElementFilter === 'wind' && elem !== 'air' && elem !== 'wind') return false;`
- `src/views/MyDeckView.tsx:1548`:
  `(target === 'wind' && (rawEl === 'air' || rawEl === 'wind'))`
- `src/landing/services/assetCatalog.ts:64`:
  `if (cardId <= 30) return 'wind';`

---

## 2. Logic Chain

1. **Observation 1.1 & 1.2**: In `PlaySection.tsx:883`, the filter chip definition uses `key: 'wind'`. When the user clicks `[바람 (Wind)]`, `playRpgState.arcadeElement` becomes `'wind'`.
2. **Observation 1.1**: Inside `renderArcadeView()`, `selectedElement` is `'wind'`.
3. **Observation 1.2**: In `CARD_DATABASE`, cards 21 to 30 have `card.element === 'air'`.
4. **Observation 1.1**: Line 902 performs `elMatch = selectedElement === 'all' || el === selectedElement`. For cards 21..30, this evaluates `'air' === 'wind'`, which is strictly `false`. For all other cards (1..20, 31..110), their element is not `'wind'`.
5. **Observation 1.3**: Consequently, filtering by `'wind'` matches 0 cards (`"wind": 0`). The total cards across all 11 element chips is 100 instead of 110, failing invariant assertion `CHAL.FILTER.1`.
6. **Inference & Solution**: Introducing `const normalizedEl = el === 'air' ? 'wind' : el;` normalizes `'air'` to `'wind'`. Then `normalizedEl === selectedElement` evaluates `'wind' === 'wind'` (`true`) for cards 21..30 and `false` for cards of other factions.
7. **Empirical Verification**: Testing this logic across all 11 factions yields:
   ```json
   {
     "total": 110,
     "overlap": false,
     "counts": {
       "water": 10,
       "fire": 10,
       "wind": 10,
       "earth": 10,
       "human": 10,
       "undead": 10,
       "elf": 10,
       "dwarf": 10,
       "monster": 10,
       "robot": 10,
       "dragon": 10
     }
   }
   ```
   All 11 factions contain exactly 10 cards, sum to 110, and have 0 overlaps.

---

## 3. Caveats

- **Scope Isolation**: No other files in `src/landing/` suffer from this bug because `CardSection.tsx` filters by `asset.faction` (which maps card IDs <= 30 to `'wind'` via `assetCatalog.ts`). The defect is strictly isolated to `PlaySection.tsx:900-910`.
- **Card Tag UI**: In `PlaySection.tsx:908`, `element: el` displayed `AIR` on the hero card chip. Updating to `element: normalizedEl` will render `WIND` instead of `AIR`, aligning with the filter chip label and faction palette. Both `element: normalizedEl` and `element: el` satisfy the test suite (the test checks `data-card-id="${id}"`), but `element: normalizedEl` is recommended for UI consistency.
- **Read-Only Explorer Constraint**: As an explorer subagent, this agent has NOT modified `src/landing/views/PlaySection.tsx`. The patch is ready for direct application by the worker.

---

## 4. Conclusion

The defect in `src/landing/views/PlaySection.tsx` is completely understood, reproduced, and verified.
The required fix is a clean, 2-line drop-in replacement at lines 900–903 of `src/landing/views/PlaySection.tsx`.

### Actionable Drop-in Fix for Worker

#### Location
- File: `/Users/dayyoung/project/snshero/src/landing/views/PlaySection.tsx`
- Lines: 900–903 (and optionally 908)

#### Replacement Diff
```diff
--- a/src/landing/views/PlaySection.tsx
+++ b/src/landing/views/PlaySection.tsx
@@ -900,4 +900,5 @@ function renderArcadeView(): string {
     const el = card.element?.toLowerCase() || 'water';
+    const normalizedEl = el === 'air' ? 'wind' : el;
     const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
-    const elMatch = selectedElement === 'all' || el === selectedElement;
+    const elMatch = selectedElement === 'all' || normalizedEl === selectedElement;

     if (titleMatch && elMatch) {
       filteredGames.push({
         id,
         title: card.title || `Hero ${id}`,
-        element: el,
+        element: normalizedEl,
         power: (card.top || 2) + (card.right || 2) + (card.bottom || 2) + (card.left || 2),
       });
```

#### Exact Replacement Block (Lines 896–912)
```ts
  // 110 Games Filter
  const filteredGames: { id: number; title: string; element: string; power: number }[] = [];
  for (let id = 1; id <= 110; id++) {
    const card = CARD_DATABASE[id];
    if (!card) continue;

    const el = card.element?.toLowerCase() || 'water';
    const normalizedEl = el === 'air' ? 'wind' : el;
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || normalizedEl === selectedElement;

    if (titleMatch && elMatch) {
      filteredGames.push({
        id,
        title: card.title || `Hero ${id}`,
        element: normalizedEl,
        power: (card.top || 2) + (card.right || 2) + (card.bottom || 2) + (card.left || 2),
      });
    }
  }
```

---

## 5. Verification Method

Once the worker applies the patch, independently verify via the following commands:

1. **Empirical Adversarial Stress Suite**:
   ```bash
   npx tsx tests/challenger_m3_9_2_empirical_stress.ts
   ```
   - **Expected**: 21/21 assertions PASS (100.0%). `CHAL.FILTER.1` passes with Wind count: 10, Total: 110, Overlap: false.
2. **Worker Adversarial Suite**:
   ```bash
   npx tsx tests/adversarial_m3_play_game_loop.ts
   ```
   - **Expected**: 27/27 assertions PASS (100.0%).
3. **Landing Adversarial Suite**:
   ```bash
   npx tsx tests/adversarial_challenger_m3_landing.ts
   ```
   - **Expected**: 22/22 assertions PASS (100.0%).
4. **Full E2E Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   - **Expected**: 76/76 assertions PASS (100.0%).
5. **Type Checking & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   - **Expected**: Exit code 0, 0 TypeScript errors, bundle size < 50 KB.
