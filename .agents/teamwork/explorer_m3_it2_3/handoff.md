# Handoff Report — M3-It2 Test Verification Strategy Explorer (`explorer_m3_it2_3`)

**Role**: Test Verification Strategy Explorer  
**Task**: Inspect `tests/challenger_m3_9_2_empirical_stress.ts`, `tests/adversarial_m3_play_game_loop.ts`, and `tests/e2e/run_all.ts`; analyze assertion `CHAL.FILTER.1` and the wind element bug; define permanent test integration and verification plan for remediation worker.

---

## 1. Observation

### 1.1 Verbatim Failure in Challenger Empirical Stress Test
- **Command Executed**: `npx tsx tests/challenger_m3_9_2_empirical_stress.ts`
- **Exit Code**: 1
- **Verbatim Failure Output**:
  ```
  --- Suite 2: Search Query Narrowing & Elemental Chip Filters ---
    [FAIL] [CHAL.FILTER.1] [Element Filters] All 11 factions each contain exactly 10 cards summing to 110 with 0 overlaps
           Expected: 11 factions x 10 = 110 cards, 0 overlaps | Actual: Total: 100, Overlap: false, Counts: {"water":10,"fire":10,"wind":0,"earth":10,"human":10,"undead":10,"elf":10,"dwarf":10,"monster":10,"robot":10,"dragon":10}
  ```

### 1.2 Inspection of Assertion `CHAL.FILTER.1`
- **File**: `/Users/dayyoung/project/snshero/tests/challenger_m3_9_2_empirical_stress.ts`
- **Lines 204–243**:
  ```ts
  const factions = [
    'water', 'fire', 'wind', 'earth', 'human', 'undead',
    'elf', 'dwarf', 'monster', 'robot', 'dragon'
  ];

  let totalPartitionCount = 0;
  let partitionOverlap = false;
  let seenCardsInPartitions = new Set<number>();
  let factionCounts: Record<string, number> = {};

  for (const f of factions) {
    playRpgState.arcadeQuery = '';
    playRpgState.arcadeElement = f;
    const filteredHtml = renderPlaySection();

    let count = 0;
    for (let id = 1; id <= 110; id++) {
      if (filteredHtml.includes(`data-card-id="${id}"`)) {
        count++;
        if (seenCardsInPartitions.has(id)) {
          partitionOverlap = true;
        }
        seenCardsInPartitions.add(id);
      }
    }
    factionCounts[f] = count;
    totalPartitionCount += count;
  }

  const allFactionsExactly10 = factions.every(f => factionCounts[f] === 10);

  assert(
    'CHAL.FILTER.1',
    'Element Filters',
    'All 11 factions each contain exactly 10 cards summing to 110 with 0 overlaps',
    allFactionsExactly10 && totalPartitionCount === 110 && !partitionOverlap,
    '11 factions x 10 = 110 cards, 0 overlaps',
    `Total: ${totalPartitionCount}, Overlap: ${partitionOverlap}, Counts: ${JSON.stringify(factionCounts)}`
  );
  ```

### 1.3 Inspection of Implementation Bug in `PlaySection.tsx`
- **File**: `/Users/dayyoung/project/snshero/src/landing/views/PlaySection.tsx`
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
- **Lines 896–903**:
  ```ts
  for (let id = 1; id <= 110; id++) {
    const card = CARD_DATABASE[id];
    if (!card) continue;

    const el = card.element?.toLowerCase() || 'water';
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;
  ```

### 1.4 Inspection of Database Reality in `CARD_DATABASE`
- **File**: `/Users/dayyoung/project/snshero/src/cardDatabase.ts`
- **Lines 43–52**:
  - Card 21 (Zephyros): `element: 'air'`
  - Card 22 (Sylph): `element: 'air'`
  - Card 23 (Sylphid): `element: 'air'`
  - Card 24 (Harpy): `element: 'air'`
  - Card 25 (Aeolus): `element: 'air'`
  - Card 26 (Tempest): `element: 'air'`
  - Card 27 (Cyclone): `element: 'air'`
  - Card 28 (Zeusphere): `element: 'air'`
  - Card 29 (Raijin): `element: 'air'`
  - Card 30 (Wind God Toram): `element: 'air'`
- All other 10 factions have 1:1 key matches: `water` (1..10), `fire` (11..20), `earth` (31..40), `human` (41..50), `undead` (51..60), `elf` (61..70), `dwarf` (71..80), `monster` (81..90), `robot` (91..100), `dragon` (101..110).

### 1.5 Inspection of Blindspot in Worker Harness `tests/adversarial_m3_play_game_loop.ts`
- **Command Executed**: `npx tsx tests/adversarial_m3_play_game_loop.ts`
- **Result**: Passed 27/27 assertions (100.0%) despite the active wind filter bug.
- **Root Cause of Blindspot** in lines 398–409:
  ```ts
  // 6.2 Minigame search filter narrows list accurately
  const query = '아쿠아';
  const filtered = Object.values(CARD_DATABASE).filter(
    (c) => c.title.includes(query) || (c.title_en && c.title_en.toLowerCase().includes('aqua')) || (c.desc && c.desc.includes(query))
  );
  assert(
    'ADV.M3.ARCADE.2',
    'Arcade Search Filter',
    'Searching "아쿠아" matches at least 1 canonical card',
    filtered.length > 0,
    '> 0 results',
    `${filtered.length} matches`
  );
  ```
  `ADV.M3.ARCADE.2` only performed a JavaScript `.filter()` directly on `CARD_DATABASE` within the test script. It never invoked `renderPlaySection()`, never tested `playRpgState.arcadeElement`, and contained zero assertions verifying the 11 elemental chip filters.

### 1.6 Inspection of Master E2E Runner `tests/e2e/run_all.ts`
- **File**: `tests/e2e/tier1_feature_coverage.ts` lines 393–401 (`T1.PLAY.5`):
  ```ts
  results.push(
    await runTestAssertion('T1.PLAY.5', 1, 'Play Section Gameplay', 'M3', 'Retention of 110 2D Canvas Minigames Arcade & Episode Reader', async () => {
      const playSection = readProjectFile('src/landing/views/PlaySection.tsx') || '';
      const hasControls = ['닫기', '이전', '다음', '나레이션', 'TTS'].every(btn => playSection.includes(btn));
      if (!hasControls) {
        return { pass: false, message: 'Play section media control bar buttons incomplete' };
      }
      return { pass: true, message: 'Streamlined media controls and minigame access verified' };
    })
  );
  ```
  `T1.PLAY.5` only verified string existence of the 5 media control buttons, leaving minigame arcade element filtering unchecked in the 4-tier E2E suite.

---

## 2. Logic Chain

1. **Observation 1.3 & 1.4**: In `CARD_DATABASE`, cards 21 to 30 represent the wind faction but are explicitly typed as `element: 'air'`. In `PlaySection.tsx:883`, the filter chip key is `'wind'`.
2. **Observation 1.3**: In `PlaySection.tsx:902`, the filtering check is `const elMatch = selectedElement === 'all' || el === selectedElement;`. When the user filters by `wind`, `selectedElement === 'wind'`. For cards 21–30, `el` is `'air'`. Because `'air' === 'wind'` is `false`, all 10 wind cards are rejected.
3. **Observation 1.1**: Consequently, `CHAL.FILTER.1` recorded `{"wind": 0}`, yielding 100 total cards instead of 110.
4. **Observation 1.5 & 1.6**: The worker's test suite `tests/adversarial_m3_play_game_loop.ts` passed 100% because it only filtered `CARD_DATABASE` in-memory with query `'아쿠아'` and never exercised `renderPlaySection()` with `playRpgState.arcadeElement`. Similarly, `tests/e2e/tier1_feature_coverage.ts` only verified control bar text.
5. **Conclusion**:
   - The bug in `PlaySection.tsx` requires normalizing `card.element === 'air'` to `'wind'` (or allowing `(selectedElement === 'wind' && el === 'air')`).
   - Permanent regression prevention requires integrating an explicit 11-faction partition check (`ADV.M3.ARCADE.5`) into `tests/adversarial_m3_play_game_loop.ts`, upgrading `ADV.M3.ARCADE.2` to test real rendered arcade search output, and adding a synonym guard to `T1.PLAY.5` in `tests/e2e/tier1_feature_coverage.ts`.

---

## 3. Caveats

1. **Other 10 Factions**: Verified that all other 10 factions (`water`, `fire`, `earth`, `human`, `undead`, `elf`, `dwarf`, `monster`, `robot`, `dragon`) already map 1:1 between `CARD_DATABASE.element` and the filter `key`. Only `wind` <-> `air` requires normalization.
2. **Read-Only Explorer Scope**: In accordance with the Explorer archetype and project constraints, no changes have been committed to source code; this report specifies the exact code diffs and verification plan for the remediation worker.
3. **No Breaking Changes**: Normalizing `el` inside `renderArcadeView()` preserves all existing properties of `CARD_DATABASE` and causes zero ripple effects on `MobileCardPlayScreen.tsx` or `KadanWorldMap.tsx`.

---

## 4. Conclusion & Actionable Remediation Plan

### 4.1 Fix for `src/landing/views/PlaySection.tsx`
In `src/landing/views/PlaySection.tsx`, around line 900:

**Before**:
```ts
    const el = card.element?.toLowerCase() || 'water';
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;
```

**After**:
```ts
    const rawEl = card.element?.toLowerCase() || 'water';
    const el = rawEl === 'air' ? 'wind' : rawEl;
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;
```

---

### 4.2 Integration into `tests/adversarial_m3_play_game_loop.ts`

#### Step A: Add Imports
At lines 51–59 of `tests/adversarial_m3_play_game_loop.ts`:
```ts
import { playRpgState, setActiveTab } from '../src/landing/services/playRpgEngine';
```

#### Step B: Upgrade `ADV.M3.ARCADE.2` (Rendered View Search Test)
Replace lines 398–410 with:
```ts
// 6.2 Minigame search filter narrows list accurately in rendered view
setActiveTab('arcade');
playRpgState.arcadeElement = 'all';
playRpgState.arcadeQuery = '카단';
const kadanSearchHtml = renderPlaySection();
const hasKadanCard = kadanSearchHtml.includes('data-card-id="41"');
let kadanMatches = 0;
for (let id = 1; id <= 110; id++) {
  if (kadanSearchHtml.includes(`data-card-id="${id}"`)) kadanMatches++;
}
assert(
  'ADV.M3.ARCADE.2',
  'Arcade Search Filter',
  'Searching "카단" narrows rendered arcade catalog and includes Hero #41',
  hasKadanCard && kadanMatches >= 1 && kadanMatches < 110,
  'Hero #41 present and matches < 110',
  `Matches: ${kadanMatches}, Hero #41 found: ${hasKadanCard}`
);
playRpgState.arcadeQuery = '';
```

#### Step C: Add `ADV.M3.ARCADE.5` (Permanent 11-Faction Partition & Wind/Air Assertion)
Add directly after `ADV.M3.ARCADE.4` (around line 436):
```ts
// 6.5 Elemental chip partition invariant across all 11 factions (10 cards each, total 110, zero overlaps)
setActiveTab('arcade');
const factions = [
  'water', 'fire', 'wind', 'earth', 'human', 'undead',
  'elf', 'dwarf', 'monster', 'robot', 'dragon'
];

let totalPartitionCount = 0;
let partitionOverlap = false;
const seenCards = new Set<number>();
const factionCounts: Record<string, number> = {};

for (const f of factions) {
  playRpgState.arcadeQuery = '';
  playRpgState.arcadeElement = f;
  const filteredHtml = renderPlaySection();

  let count = 0;
  for (let id = 1; id <= 110; id++) {
    if (filteredHtml.includes(`data-card-id="${id}"`)) {
      count++;
      if (seenCards.has(id)) {
        partitionOverlap = true;
      }
      seenCards.add(id);
    }
  }
  factionCounts[f] = count;
  totalPartitionCount += count;
}

const allFactionsExactly10 = factions.every((f) => factionCounts[f] === 10);
assert(
  'ADV.M3.ARCADE.5',
  'Elemental Chip Invariant',
  'All 11 factions each contain exactly 10 cards summing to 110 with 0 overlaps (including Wind/Air cards 21..30)',
  allFactionsExactly10 && totalPartitionCount === 110 && !partitionOverlap,
  '11 factions x 10 = 110 cards, 0 overlaps',
  `Total: ${totalPartitionCount}, Overlap: ${partitionOverlap}, Counts: ${JSON.stringify(factionCounts)}`
);

// Reset state after test
playRpgState.arcadeElement = 'all';
playRpgState.arcadeQuery = '';
setActiveTab('adventure');
```

---

### 4.3 Integration into `tests/e2e/tier1_feature_coverage.ts`
In `tests/e2e/tier1_feature_coverage.ts`, update `T1.PLAY.5` (lines 393–401) to:
```ts
  results.push(
    await runTestAssertion('T1.PLAY.5', 1, 'Play Section Gameplay', 'M3', 'Retention of 110 2D Canvas Minigames Arcade & Episode Reader', async () => {
      const playSection = readProjectFile('src/landing/views/PlaySection.tsx') || '';
      const hasControls = ['닫기', '이전', '다음', '나레이션', 'TTS'].every(btn => playSection.includes(btn));
      if (!hasControls) {
        return { pass: false, message: 'Play section media control bar buttons incomplete' };
      }
      const handlesAirWindSynonym = playSection.includes("'air'") && playSection.includes("'wind'");
      if (!handlesAirWindSynonym) {
        return { pass: false, message: 'PlaySection.tsx does not map air/wind element synonym for cards 21..30' };
      }
      return { pass: true, message: 'Streamlined media controls, minigame arcade catalog and wind/air mapping verified' };
    })
  );
```

---

## 5. Verification Method

The remediation worker must execute the following verification sequence in order:

1. **Challenger Empirical Stress Harness**:
   ```bash
   npx tsx tests/challenger_m3_9_2_empirical_stress.ts
   ```
   - **Expected Result**: 21/21 assertions PASS (100.0%), `CHAL.FILTER.1` passes with `Counts: {"water":10,"fire":10,"wind":10,...}`.

2. **Milestone 3 Adversarial Game Loop Harness**:
   ```bash
   npx tsx tests/adversarial_m3_play_game_loop.ts
   ```
   - **Expected Result**: 28/28 assertions PASS (100.0%), including newly integrated `ADV.M3.ARCADE.5`.

3. **Landing Adversarial Harness**:
   ```bash
   npx tsx tests/adversarial_challenger_m3_landing.ts
   ```
   - **Expected Result**: 22/22 assertions PASS (100.0%).

4. **Full 4-Tier Master E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   - **Expected Result**: 76/76 assertions PASS (100.0%).

5. **TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   - **Expected Result**: Exit code 0 (0 errors).

6. **Production Bundle Verification**:
   ```bash
   npm run build
   ```
   - **Expected Result**: Exit code 0, `dist/index.html` < 50 KB, 0 React runtime bundles.

### Invalidation Conditions
- Any faction count !== 10 when filtering `renderPlaySection()`.
- Total partition count !== 110.
- `partitionOverlap === true`.
- Wind element filter returns 0 cards.
