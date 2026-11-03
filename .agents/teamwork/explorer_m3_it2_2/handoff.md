# Handoff Report — Full Element Catalog Audit (`explorer_m3_it2_2`)
**Role**: M3-It2 Full Element Catalog Audit Explorer  
**Verdict**: **AUDIT_COMPLETE (Discrepancy Confirmed & Resolution Path Documented)**

---

## 1. Observation

### 1.1 Complete Card ID 1..110 to Element Mapping in `CARD_DATABASE`
Every card ID from 1 to 110 was audited directly in `/Users/dayyoung/project/snshero/src/cardDatabase.ts`. All 110 card objects exist, are well-formed, and contain a non-empty `element` property.

| ID Range | Faction / Element (`CARD_DATABASE`) | Card Titles (KO / EN) Sample | Count |
|---|---|---|---|
| **1..10** | `water` | #1 아쿠아리스 (Aquaris) .. #10 포세이돈 (Poseidon) | 10 |
| **11..20** | `fire` | #11 이그니스 (Ignis) .. #20 이그니시우스 (Ignisius) | 10 |
| **21..30** | `air` | #21 제피로스 (Zephyros) .. #30 바람신 토람 (Wind God Toram) | 10 |
| **31..40** | `earth` | #31 가이아 (Gaia) .. #40 콜로서스 (Colossus) | 10 |
| **41..50** | `human` | #41 카단 (Kadan) .. #50 알렉산다르 (Aleksandar) | 10 |
| **51..60** | `undead` | #51 워커 (Walker) .. #60 데스나이트 아르투스 (Death Knight Artus) | 10 |
| **61..70** | `elf` | #61 루시안 (Lucian) .. #70 에일라 (Aila) | 10 |
| **71..80** | `dwarf` | #71 발보 (Balbo) .. #80 아이언포지 (Ironforge) | 10 |
| **81..90** | `monster` | #81 펜릴 (Fenrir) .. #90 페가수스 (Pegasus) | 10 |
| **91..100** | `robot` | #91 스파이더봇 (Spiderbot) .. #100 오메가 웨폰 (Omega Weapon) | 10 |
| **101..110** | `dragon` | #101 드레이크 (Drake) .. #110 드레드윙 (Dreadwing) | 10 |

#### Full Itemized 110-Card Catalog:
```
ID   1: element='water', title='아쿠아리스' (Aquaris), rarity='bronze', level=1
ID   2: element='water', title='나이아드' (Naiad), rarity='bronze', level=2
ID   3: element='water', title='운디네' (Undine), rarity='bronze', level=3
ID   4: element='water', title='켈피' (Kelpie), rarity='bronze', level=4
ID   5: element='water', title='아쿠아로드' (Aqualord), rarity='bronze', level=5
ID   6: element='water', title='레비아탄' (Leviathan), rarity='silver', level=6
ID   7: element='water', title='가르간티아' (Gargantia), rarity='silver', level=7
ID   8: element='water', title='캐스케이드' (Cascade), rarity='silver', level=8
ID   9: element='water', title='크라켄' (Kraken), rarity='gold', level=9
ID  10: element='water', title='포세이돈' (Poseidon), rarity='gold', level=10
ID  11: element='fire', title='이그니스' (Ignis), rarity='bronze', level=1
ID  12: element='fire', title='샐러맨더' (Salamander), rarity='bronze', level=2
ID  13: element='fire', title='벨페고르' (Belphegor), rarity='bronze', level=3
ID  14: element='fire', title='파이로' (Pyro), rarity='bronze', level=4
ID  15: element='fire', title='발록' (Balrog), rarity='bronze', level=5
ID  16: element='fire', title='무스펠' (Muspel), rarity='silver', level=6
ID  17: element='fire', title='이바르' (Ivar), rarity='silver', level=7
ID  18: element='fire', title='불사신 아셀' (Ashel the Immortal), rarity='silver', level=8
ID  19: element='fire', title='피닉스' (Phoenix), rarity='gold', level=9
ID  20: element='fire', title='이그니시우스' (Ignisius), rarity='gold', level=10
ID  21: element='air', title='제피로스' (Zephyros), rarity='bronze', level=1
ID  22: element='air', title='실프' (Sylph), rarity='bronze', level=2
ID  23: element='air', title='실피드' (Sylphid), rarity='bronze', level=3
ID  24: element='air', title='하피' (Harpy), rarity='bronze', level=4
ID  25: element='air', title='에올루스' (Aeolus), rarity='bronze', level=5
ID  26: element='air', title='템페스트' (Tempest), rarity='silver', level=6
ID  27: element='air', title='사이클론' (Cyclone), rarity='silver', level=7
ID  28: element='air', title='제우스피어' (Zeusphere), rarity='silver', level=8
ID  29: element='air', title='뇌신' (Raijin), rarity='gold', level=9
ID  30: element='air', title='바람신 토람' (Wind God Toram), rarity='gold', level=10
ID  31: element='earth', title='가이아' (Gaia), rarity='bronze', level=1
ID  32: element='earth', title='그놈' (Gnome), rarity='bronze', level=2
ID  33: element='earth', title='테라' (Terra), rarity='bronze', level=3
ID  34: element='earth', title='고르곤' (Gorgon), rarity='bronze', level=4
ID  35: element='earth', title='오벨리스크' (Obelisk), rarity='bronze', level=5
ID  36: element='earth', title='그랜드로크' (Grandrock), rarity='silver', level=6
ID  37: element='earth', title='록타' (Rokta), rarity='silver', level=7
ID  38: element='earth', title='오리하르콘' (Orihalcon), rarity='silver', level=8
ID  39: element='earth', title='아틀라스' (Atlas), rarity='gold', level=9
ID  40: element='earth', title='콜로서스' (Colossus), rarity='gold', level=10
ID  41: element='human', title='카단' (Kadan), rarity='bronze', level=1
ID  42: element='human', title='엘윈' (Elwin), rarity='bronze', level=1
ID  43: element='human', title='발리안' (Balian), rarity='bronze', level=2
ID  44: element='human', title='카제' (Kaze), rarity='bronze', level=3
ID  45: element='human', title='가웨인' (Gawain), rarity='bronze', level=4
ID  46: element='human', title='론돌' (Rondol), rarity='silver', level=5
ID  47: element='human', title='길가메시' (Gilgamesh), rarity='silver', level=6
ID  48: element='human', title='로비냐드' (Robinyard), rarity='silver', level=7
ID  49: element='human', title='헤르쿨' (Hercul), rarity='gold', level=8
ID  50: element='human', title='알렉산다르' (Aleksandar), rarity='gold', level=10
ID  51: element='undead', title='워커' (Walker), rarity='bronze', level=1
ID  52: element='undead', title='구울' (Ghoul), rarity='bronze', level=2
ID  53: element='undead', title='캐리언' (Carrion), rarity='bronze', level=2
ID  54: element='undead', title='아라크네' (Arachne), rarity='bronze', level=3
ID  55: element='undead', title='패치워크' (Patchwork), rarity='bronze', level=4
ID  56: element='undead', title='카르디스' (Cardis), rarity='silver', level=5
ID  57: element='undead', title='스톤가고일' (Stone Gargoyle), rarity='silver', level=6
ID  58: element='undead', title='사이드라고사' (Sidragosa), rarity='silver', level=7
ID  59: element='undead', title='켈투스' (Keltus), rarity='gold', level=8
ID  60: element='undead', title='데스나이트 아르투스' (Death Knight Artus), rarity='gold', level=10
ID  61: element='elf', title='루시안' (Lucian), rarity='bronze', level=1
ID  62: element='elf', title='실리아' (Celia), rarity='bronze', level=2
ID  63: element='elf', title='엘리아나' (Eliana), rarity='bronze', level=3
ID  64: element='elf', title='티타니아' (Titania), rarity='bronze', level=3
ID  65: element='elf', title='실바니아' (Sylvania), rarity='bronze', level=4
ID  66: element='elf', title='말퓨온' (Malfuon), rarity='silver', level=5
ID  67: element='elf', title='베작스' (Vezax), rarity='silver', level=6
ID  68: element='elf', title='캘토르' (Kaeltor), rarity='silver', level=7
ID  69: element='elf', title='간다르' (Gandar), rarity='gold', level=8
ID  70: element='elf', title='에일라' (Aila), rarity='gold', level=10
ID  71: element='dwarf', title='발보' (Balbo), rarity='bronze', level=1
ID  72: element='dwarf', title='프레도' (Fredo), rarity='bronze', level=2
ID  73: element='dwarf', title='샘와이' (Samwy), rarity='bronze', level=3
ID  74: element='dwarf', title='그림리' (Grimli), rarity='bronze', level=4
ID  75: element='dwarf', title='마그니스' (Magnis), rarity='bronze', level=4
ID  76: element='dwarf', title='브란디' (Brandy), rarity='silver', level=5
ID  77: element='dwarf', title='무라디' (Muradi), rarity='silver', level=6
ID  78: element='dwarf', title='토그림' (Thorgrim), rarity='silver', level=7
ID  79: element='dwarf', title='베리포지' (Berryforge), rarity='gold', level=8
ID  80: element='dwarf', title='아이언포지' (Ironforge), rarity='gold', level=10
ID  81: element='monster', title='펜릴' (Fenrir), rarity='bronze', level=1
ID  82: element='monster', title='미노타우로스' (Minotaur), rarity='bronze', level=2
ID  83: element='monster', title='요르문간드' (Jormungandr), rarity='bronze', level=3
ID  84: element='monster', title='그리폰' (Griffon), rarity='bronze', level=4
ID  85: element='monster', title='바이라' (Byra), rarity='bronze', level=5
ID  86: element='monster', title='레오나르' (Leonar), rarity='silver', level=6
ID  87: element='monster', title='바르가스트' (Barghest), rarity='silver', level=6
ID  88: element='monster', title='우르삭' (Ursoc), rarity='silver', level=7
ID  89: element='monster', title='메두사 고르고' (Medusa Gorgo), rarity='gold', level=8
ID  90: element='monster', title='페가수스' (Pegasus), rarity='gold', level=9
ID  91: element='robot', title='스파이더봇' (Spiderbot), rarity='bronze', level=1
ID  92: element='robot', title='크로노스' (Chronos), rarity='bronze', level=2
ID  93: element='robot', title='센티넬' (Sentinel), rarity='bronze', level=3
ID  94: element='robot', title='디바스터' (Devastator), rarity='bronze', level=4
ID  95: element='robot', title='골리앗' (Goliath), rarity='bronze', level=5
ID  96: element='robot', title='시즈엔진' (Siege Engine), rarity='silver', level=5
ID  97: element='robot', title='하이페리온 프라임' (Hyperion Prime), rarity='silver', level=6
ID  98: element='robot', title='아이언클래드' (Ironclad), rarity='silver', level=7
ID  99: element='robot', title='마기테크 골렘' (Magitech Golem), rarity='gold', level=8
ID 100: element='robot', title='오메가 웨폰' (Omega Weapon), rarity='gold', level=9
ID 101: element='dragon', title='드레이크' (Drake), rarity='silver', level=7
ID 102: element='dragon', title='와이버니' (Wyverny), rarity='silver', level=8
ID 103: element='dragon', title='네더드래곤' (Netherdragon), rarity='gold', level=9
ID 104: element='dragon', title='바하무트' (Bahamut), rarity='gold', level=9
ID 105: element='dragon', title='스파이크드래곤' (Spikedragon), rarity='gold', level=9
ID 106: element='dragon', title='어스드래곤 테라' (Earth Dragon Terra), rarity='gold', level=9
ID 107: element='dragon', title='이셀라' (Ysela), rarity='gold', level=9
ID 108: element='dragon', title='알렉스트라' (Alexstra), rarity='gold', level=10
ID 109: element='dragon', title='말리곤' (Malygon), rarity='gold', level=10
ID 110: element='dragon', title='드레드윙' (Dreadwing), rarity='gold', level=10
```

### 1.2 Comparison with Filter Chips in `PlaySection.tsx:879-903`
In `/Users/dayyoung/project/snshero/src/landing/views/PlaySection.tsx`:
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

### 1.3 Systematic Faction by Faction Filter Evaluation
When each chip is clicked (`selectedElement === key`), the filter evaluates:

| Filter Chip `key` | Chip Label | `CARD_DATABASE.element` | Direct Equality Match | Matched Count | Expected Count | Status |
|---|---|---|---|---|---|---|
| `all` | 전체 (All) | 1..110 | `selectedElement === 'all'` | **110** | 110 | PASS |
| `water` | 물 (Water) | IDs 1..10: `'water'` | `'water' === 'water'` | **10** | 10 | PASS |
| `fire` | 불 (Fire) | IDs 11..20: `'fire'` | `'fire' === 'fire'` | **10** | 10 | PASS |
| `wind` | 바람 (Wind) | IDs 21..30: `'air'` | `'air' === 'wind'` | **0** | 10 | **FAIL (0 matches)** |
| `earth` | 땅 (Earth) | IDs 31..40: `'earth'` | `'earth' === 'earth'` | **10** | 10 | PASS |
| `human` | 인간 (Human) | IDs 41..50: `'human'` | `'human' === 'human'` | **10** | 10 | PASS |
| `undead` | 언데드 (Undead) | IDs 51..60: `'undead'` | `'undead' === 'undead'` | **10** | 10 | PASS |
| `elf` | 엘프 (Elf) | IDs 61..70: `'elf'` | `'elf' === 'elf'` | **10** | 10 | PASS |
| `dwarf` | 호빗 (Hobbit) | IDs 71..80: `'dwarf'` | `'dwarf' === 'dwarf'` | **10** | 10 | PASS |
| `monster` | 야수 (Beast) | IDs 81..90: `'monster'` | `'monster' === 'monster'` | **10** | 10 | PASS |
| `robot` | 메카 (Mecha) | IDs 91..100: `'robot'` | `'robot' === 'robot'` | **10** | 10 | PASS |
| `dragon` | 드래곤 (Dragon) | IDs 101..110: `'dragon'` | `'dragon' === 'dragon'` | **10** | 10 | PASS |

- **Sum of All 11 Element Chips**: 100 cards (Missing IDs 21..30 due to `air` vs `wind`).
- **Overlaps**: 0.

### 1.4 Codebase-Wide Synonym & Naming Discrepancies Catalog
We scanned all occurrences across the entire repository (`src/`, `tests/`, `public/`):

1. **`wind` vs `air` (ACTIVE DISCREPANCY)**:
   - `CARD_DATABASE[21..30]`: strictly `element: 'air'`.
   - `CharacterFaction` (`src/types.ts:84`): strictly `'wind'`.
   - `CHARACTER_IP_PROFILES` (`src/content/characterIp.ts`): strictly `faction: 'wind'`.
   - `FACTION_DEFINITIONS` (`tests/e2e_character_assets/helpers.py:41`): strictly `'wind'`.
   - Sprite sheet: `public/character_sheet_wind.png`.
   - `src/views/PlayGameView.tsx:13567`: handles synonym explicitly: `if (selectedElementFilter === 'wind' && elem !== 'air' && elem !== 'wind') return false;`
   - `src/lib/utils.ts:415`: `if (norm === 'wind' || norm === 'air') return 'wind';`
   - `src/constants.ts:149`: `if (el === 'air') return 'wind';`
   - **Conclusion**: `CARD_DATABASE` uses `air`, while the rest of the application standardizes on `wind`. Unnormalized comparison `el === selectedElement` in `PlaySection.tsx:902` is the sole reason `[바람 (Wind)]` returns 0 cards.

2. **`earth` vs `land`**:
   - `CARD_DATABASE[31..40]`: strictly `element: 'earth'` (0 cards have `'land'`).
   - `PlaySection.tsx`: uses `key: 'earth'`.
   - `CardElement` type (`src/types.ts:76`): contains both `'earth'` and `'land'` for legacy battle tile engine compatibility (`MobileCardPlayScreen.tsx:2009`).
   - **Conclusion**: No discrepancy exists between `CARD_DATABASE` and `PlaySection.tsx`.

3. **`water` vs `aqua`**:
   - `CARD_DATABASE[1..10]`: strictly `element: 'water'` (0 cards have `'aqua'`).
   - `PlaySection.tsx`: uses `key: 'water'`.
   - Card names contain "아쿠아리스" (Aquaris) and "아쿠아로드" (Aqualord), but the element attribute is `'water'`.
   - **Conclusion**: No discrepancy.

4. **`fire` vs `flame`**:
   - `CARD_DATABASE[11..20]`: strictly `element: 'fire'` (0 cards have `'flame'`).
   - `PlaySection.tsx`: uses `key: 'fire'`.
   - **Conclusion**: No discrepancy.

5. **`dwarf` vs `hobbit` (UI Label Discrepancy Only)**:
   - `CARD_DATABASE[71..80]`: strictly `element: 'dwarf'`.
   - `PlaySection.tsx`: `key: 'dwarf'`, `label: '호빗 (Hobbit)'`.
   - Asset filename: `public/character_sheet_hobbit.png` (Legacy sprite sheet alias, documented in `tests/e2e_character_assets/helpers.py:95`).
   - Filtering functions properly because `key: 'dwarf'` directly matches `element: 'dwarf'`.
   - **Conclusion**: Functional equality holds (10 cards match). Only the button label text presents "호빗 (Hobbit)" instead of "드워프 (Dwarf)".

6. **`monster` vs `beast` (UI Label Discrepancy Only)**:
   - `CARD_DATABASE[81..90]`: strictly `element: 'monster'`.
   - `PlaySection.tsx`: `key: 'monster'`, `label: '야수 (Beast)'`.
   - Asset filename: `public/character_sheet_beast.png` (Legacy sprite sheet alias).
   - Filtering functions properly because `key: 'monster'` directly matches `element: 'monster'`.
   - **Conclusion**: Functional equality holds (10 cards match).

7. **`robot` vs `mecha` (UI Label Discrepancy Only)**:
   - `CARD_DATABASE[91..100]`: strictly `element: 'robot'`.
   - `PlaySection.tsx`: `key: 'robot'`, `label: '메카 (Mecha)'`.
   - Asset filename: `public/character_sheet_mecha.png` (Legacy sprite sheet alias).
   - Filtering functions properly because `key: 'robot'` directly matches `element: 'robot'`.
   - **Conclusion**: Functional equality holds (10 cards match).

8. **`human`, `undead`, `elf`, `dragon`**:
   - 100% 1:1 identical across database, filter chips, types, and asset filenames.

---

## 2. Logic Chain

1. **Database Audit**:
   - We inspected all entries of `CARD_DATABASE` in `src/cardDatabase.ts`.
   - IDs 1..110 exist continuously with no missing keys.
   - IDs 1..10 have `element: 'water'` (10 cards).
   - IDs 11..20 have `element: 'fire'` (10 cards).
   - IDs 21..30 have `element: 'air'` (10 cards).
   - IDs 31..40 have `element: 'earth'` (10 cards).
   - IDs 41..50 have `element: 'human'` (10 cards).
   - IDs 51..60 have `element: 'undead'` (10 cards).
   - IDs 61..70 have `element: 'elf'` (10 cards).
   - IDs 71..80 have `element: 'dwarf'` (10 cards).
   - IDs 81..90 have `element: 'monster'` (10 cards).
   - IDs 91..100 have `element: 'robot'` (10 cards).
   - IDs 101..110 have `element: 'dragon'` (10 cards).
   - Each partition is disjoint: $(A_i \cap A_j = \emptyset$ for $i \neq j)$, and $\sum_{i=1}^{11} |A_i| = 110$.

2. **Filter Chip Evaluation in `PlaySection.tsx`**:
   - In `src/landing/views/PlaySection.tsx:879-892`, the 11 element filter chips are defined as: `water`, `fire`, `wind`, `earth`, `human`, `undead`, `elf`, `dwarf`, `monster`, `robot`, `dragon`.
   - In `PlaySection.tsx:900-902`, matching is done via:
     `const el = card.element?.toLowerCase() || 'water';`
     `const elMatch = selectedElement === 'all' || el === selectedElement;`
   - When `selectedElement === 'wind'`, `el === selectedElement` evaluates `'air' === 'wind'`, which is strictly `false` for cards 21..30.
   - No other card in IDs 1..110 has `element: 'wind'`.
   - Therefore, filtering for `wind` yields 0 cards instead of 10 cards.

3. **Impact on Challenger Test `CHAL.FILTER.1`**:
   - In `tests/challenger_m3_9_2_empirical_stress.ts:204-242`, the test iterates over `['water', 'fire', 'wind', 'earth', 'human', 'undead', 'elf', 'dwarf', 'monster', 'robot', 'dragon']`.
   - The test asserts: `allFactionsExactly10 && totalPartitionCount === 110 && !partitionOverlap`.
   - Actual result: `totalPartitionCount === 100`, because `factionCounts['wind'] === 0`.
   - This single defect is the sole reason for the `REQUEST_CHANGES` verdict in Milestone 3 Challenger 2.

---

## 3. Caveats

- **Read-Only Scope**: This agent operates under strict read-only constraints and did not modify `src/landing/views/PlaySection.tsx`.
- **Database Immutability**: `CARD_DATABASE` is imported across numerous legacy files (`PlayGameView.tsx`, `WikiCardView.tsx`, `MyDeckView.tsx`, `cardDatabase.ts`, `gameEngine.ts`). Changing `element: 'air'` to `'wind'` in `src/cardDatabase.ts` carries regression risk for other systems that specifically check for `'air'`. Therefore, normalizing `'air' -> 'wind'` in `PlaySection.tsx` is the safer, standard pattern used elsewhere in the codebase (e.g. `src/lib/utils.ts:415`, `src/constants.ts:149`).
- **No other functional discrepancies**: No other element keys (`earth`, `water`, `fire`, `human`, `undead`, `elf`, `dwarf`, `monster`, `robot`, `dragon`) have any filtering defects. All 10 directly match with 10 cards each.

---

## 4. Conclusion

- **Audit Result**:
  1. All 110 cards partition cleanly into 11 factions of exactly 10 cards each (110 total cards, 0 overlaps).
  2. The only functional naming discrepancy is `air` (in `CARD_DATABASE`) vs `wind` (in `PlaySection.tsx` filter chip and `CharacterFaction`).
  3. Synonyms `earth/land`, `water/aqua`, `fire/flame` do not affect `CARD_DATABASE` as it exclusively uses `earth`, `water`, and `fire`.
  4. Synonyms `dwarf/hobbit`, `monster/beast`, and `robot/mecha` exist in sprite sheet asset filenames and Korean chip labels, but their filter chip keys (`dwarf`, `monster`, `robot`) match `CARD_DATABASE` exactly.

### Recommended Code Change for Implementer
In `/Users/dayyoung/project/snshero/src/landing/views/PlaySection.tsx`:

#### Option A (Direct Element Normalization - Recommended):
Replace lines 900–902:
```ts
<<<< BEFORE
    const el = card.element?.toLowerCase() || 'water';
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;
====
    const rawEl = card.element?.toLowerCase() || 'water';
    const el = rawEl === 'air' ? 'wind' : rawEl;
    const titleMatch = card.title?.toLowerCase().includes(query) || (card.desc && card.desc.toLowerCase().includes(query));
    const elMatch = selectedElement === 'all' || el === selectedElement;
>>>> AFTER
```

#### Option B (Broad Synonym Equivalence):
```ts
    const elMatch =
      selectedElement === 'all' ||
      el === selectedElement ||
      (selectedElement === 'wind' && el === 'air') ||
      (selectedElement === 'earth' && el === 'land');
```

Applying either option immediately resolves the defect: all 11 factions will return exactly 10 cards, total partition count will equal 110 with 0 overlaps, and `CHAL.FILTER.1` will pass 100%.

---

## 5. Verification Method

To independently verify this audit and test the fix:

1. **Verify Database Census**:
   ```bash
   npx tsx -e "
   import { CARD_DATABASE } from './src/cardDatabase';
   const counts = {};
   for (let i = 1; i <= 110; i++) {
     const el = CARD_DATABASE[i].element;
     counts[el] = (counts[el] || 0) + 1;
   }
   console.log(counts);
   "
   ```
   *Expected Output*:
   `{ water: 10, fire: 10, air: 10, earth: 10, human: 10, undead: 10, elf: 10, dwarf: 10, monster: 10, robot: 10, dragon: 10 }`

2. **Run Challenger Stress Harness**:
   ```bash
   npx tsx tests/challenger_m3_9_2_empirical_stress.ts
   ```
   - Before fix: Fails on `CHAL.FILTER.1` with `Counts: {"water":10,"fire":10,"wind":0,...}`.
   - After applying Option A or B: Passes with 21/21 assertions (100.0%).

3. **Run Regression Suites**:
   ```bash
   npx tsx tests/adversarial_m3_play_game_loop.ts
   npx tsx tests/adversarial_challenger_m3_landing.ts
   npx tsx tests/e2e/run_all.ts
   npx tsc --noEmit
   npm run build
   ```
   *Expected Output*: All suites exit with code 0.
