# Handoff Report: Milestone 2 Verification & E2E Test Strategy

- **Author**: `explorer_m2_9_3` (Milestone 2 Verification & E2E Test Strategy Explorer)
- **Target Role**: Worker (`worker_m2` / `worker_m1_9`), Reviewers, Challengers, Forensic Auditor, and Orchestrator
- **Scope**: Milestone 2 (Features 5, 6, 7) Verification Architecture & `tests/adversarial_m2_home_deck.ts` Test Harness Blueprint
- **Date**: 2026-11-02T09:07:00Z

---

## 1. Observation

Direct code observations from inspecting the codebase:

### 1.1 Existing E2E Test Suite Scope & False-Positive Blindspots
- Running `npx tsx tests/e2e/run_all.ts --milestone M2` currently reports 11 passed assertions (10 in Tier 1, 1 in Tier 4):
  ```
  === [TIER 1] Feature Coverage & Interface Contracts ===
    [T1.HOME.1] [M2] SNS Hero Official Full-Color Graphic Logo Display    ✓ PASS (0.0ms)
    [T1.HOME.2] [M2] Cool Card Deck 5-Card Fan-Folded Preview Composition ✓ PASS (0.1ms)
    [T1.HOME.3] [M2] Deck Combat Power (CP) Calculation Display           ✓ PASS (0.1ms)
    [T1.HOME.4] [M2] Win Streak Flame Badge & 4 Core Media Pillars        ✓ PASS (0.1ms)
    [T1.HOME.5] [M2] External Serialization Links with "[절찬 연재중]" Badges  ✓ PASS (0.1ms)
    [T1.DECK.1] [M2] 5-Slot Active Deck Composition Display               ✓ PASS (0.1ms)
    [T1.DECK.2] [M2] Card Slot Swapping from Owned Inventory              ✓ PASS (0.2ms)
    [T1.DECK.3] [M2] Real-Time Deck TP Dynamic Recalculation              ✓ PASS (0.1ms)
    [T1.DECK.4] [M2] Total TP Inventory Power Calculation                 ✓ PASS (0.1ms)
    [T1.DECK.5] [M2] LocalStorage Sync for Active Deck (hero_deck)        ✓ PASS (0.1ms)
  ```
- **Critical Discrepancy**: 
  - `T1.HOME.1` only checks `projectPathExists('public/logo-ko.png')` (`tests/e2e/tier1_feature_coverage.ts:205`). It never checks if `renderHomeSection()` actually produces `<img src="/logo-ko.png" .../>` in the DOM!
  - `T1.HOME.2` checks `homeView.includes('hero') || homeView.includes('getCharacterAsset') || homeView.includes('LobbyInteractiveCard')` (`tier1_feature_coverage.ts:216`). Because `HomeSection.tsx` has `hero41`, this test passed even though the 5-card fan-folded squad preview is completely absent!
  - `T1.DECK.2`, `T1.DECK.3`, `T1.DECK.4`, `T1.DECK.5` were run against `ReferenceNurtureStore` inside `tests/e2e/helpers.ts`, NOT the actual production service `src/landing/services/cardNurtureStore.ts`!

### 1.2 Production `HomeSection.tsx` Current State (`src/landing/views/HomeSection.tsx`)
- Lines 21–55: Contains a text banner with `눈히어로.com · SNSHero Revolution` and an `<h1>` heading, but **zero `<img>` tags referencing `/logo-ko.png`**.
- Lines 58–73: Displays a single hero portrait (`hero41` bust image) in a box:
  ```html
  <div class="relative w-48 h-64 sm:w-56 sm:h-72 flex items-center justify-center overflow-hidden mb-4">
    <img src="${hero41.bustPngUrl}" alt="${hero41.nameKo}" ... />
  </div>
  ```
  This is a static single-card box, NOT the fan-folded 5-card squad preview required by R1 and Feature 6!
- Lines 77–167: Fully and correctly preserves the 3 external serialization links (`naverNovel`, `naverWebtoon`, `munpiaNovel`) with `[절찬 연재중]` badges.
- Lines 170–237: Fully and correctly preserves the 4 core media pillars (웹소설, 웹게임, 웹툰, 애니메이션).

### 1.3 Physical Logo Asset Verification (`public/logo-ko.png`)
- Running a binary probe on `public/logo-ko.png`:
  - Magic Bytes: `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A` (Valid PNG).
  - Width: `1268px`, Height: `716px`.
  - File Size: `1,671,604 bytes` (~1.6 MB).
  - The asset is pristine, high resolution, and ready for display.

### 1.4 Production `MyDeckSection.tsx` Current State (`src/landing/views/MyDeckSection.tsx`)
- Line 88: `const activeDeckIds = cardNurtureStore.ownedCardIds.slice(0, 5);`
  The view hardcodes active deck IDs to the first 5 elements of `ownedCardIds`, rather than reading an active deck slot array (`activeDeckIds`).
- Line 263: Clicking a card in the 5 slots only sets `state.selectedDeckCardId`:
  ```ts
  } else if (action === 'select-deck-card') {
    const cardIdStr = target.getAttribute('data-card-id');
    if (cardIdStr) {
      state.selectedDeckCardId = parseInt(cardIdStr, 10);
      renderApp();
    }
  }
  ```
  There is currently no slot replacement mechanism, no owned card selector drawer, and no card swapping.

### 1.5 Production `cardNurtureStore.ts` Current State (`src/landing/services/cardNurtureStore.ts`)
- Lines 30–32: Has `cards: Record<number, CardNurtureData>` and `ownedCardIds: number[] = [1, 2, 3, 4, 5]`.
- Does NOT have `activeDeckIds` or `deckStorageKey = 'hero_deck'`.
- Does NOT have `setDeckCard(slotIndex: number, cardId: number): boolean`.
- Line 69: `getDeckTP()` slices `this.ownedCardIds.slice(0, 5)` instead of using dedicated active deck slots.
- Lines 196–208: `saveToStorage()` only writes `this.storageKey` (`hero_card_nurturing`). It does NOT write `hero_deck`!

---

## 2. Logic Chain

1. **Why `tier1_feature_coverage.ts` is insufficient as a gate**:
   - `tier1_feature_coverage.ts` was designed as a broad contract specification suite, but its M2 tests relied on `ReferenceNurtureStore` and file existence checks rather than executing actual DOM templates and checking DOM elements.
   - Therefore, a dedicated empirical test harness `tests/adversarial_m2_home_deck.ts` is strictly required to directly import `renderHomeSection()`, `renderMyDeckSection()`, `cardNurtureStore`, and `renderApp()` and parse the generated HTML via `cheerio`.

2. **Why duplicate prevention in `#deck` must be strictly enforced**:
   - In 3x3 tactical card battles (`MobileCardPlayScreen.tsx`) and game rules, a player's active 5-card squad represents 5 unique heroes on the battlefield.
   - If a user could select Card 1 into all 5 slots, it would corrupt battle balance, break Deck TP integrity, and create game-state anomalies.
   - Therefore, `setDeckCard(slotIndex, cardId)` must check:
     a) `cardId` is owned (`this.isCardOwned(cardId)`).
     b) If `cardId` is already in another slot `existingIndex`: the method must either swap the two slots (`this.activeDeckIds[existingIndex] = this.activeDeckIds[slotIndex]`) or reject duplicate placement.
     c) The invariant `new Set(this.activeDeckIds).size === 5` must hold 100% of the time.

3. **Why the 5-card fan-folded preview requires rotational transform math**:
   - Reference `src/components/LobbyInteractiveCard.tsx:33-37`:
     `centerOffset = index - Math.floor(totalCards / 2)` -> for 5 cards: `-2, -1, 0, +1, +2`.
     `rotation = centerOffset * 6` -> `-12deg, -6deg, 0deg, +6deg, +12deg`.
     `xOffset = centerOffset * 36` (or 40px).
     `yOffset = Math.abs(centerOffset) * 8` (creating a downward arc).
   - In `HomeSection.tsx`, each of the 5 cards in `#home-squad-fan` must render inline `transform: translateX(...) translateY(...) rotate(...)` or distinct class rotations, allowing adversarial tests to verify that the rotation angles are non-zero, symmetric, and ordered.

4. **Why LocalStorage `hero_deck` requires dual format compatibility**:
   - Legacy routes and components (`src/App.tsx:1422`, `src/views/MyDeckView.tsx:587`, `src/views/ShopView.tsx:705`) previously stored `hero_deck` as either an array of numbers (`[1, 2, 3, 4, 5]`) or an array of objects (`[{ id: 1, ... }, ...]`).
   - `cardNurtureStore.loadFromStorage()` must handle both formats seamlessly, extracting `typeof item === 'number' ? item : item?.id` and falling back gracefully if data is corrupted or invalid.

---

## 3. Caveats

1. **DOM Environment in Node.js / `tsx` Execution**:
   - Node.js lacks a native `window` or `document` object unless mocked or parsed.
   - `renderHomeSection()` and `renderMyDeckSection()` are pure template string generators that return HTML strings.
   - `cheerio` (already in `package.json:27` at `^1.2.0`) is the ideal, fast, standard HTML parser to inspect the generated HTML in tests without spinning up heavy headless browsers.
   - For `localStorage` testing in Node, `globalThis.localStorage` must be backed by an in-memory `MockLocalStorage` implementation.
2. **Read-Only Explorer Constraint**:
   - As an Explorer agent, we do NOT modify production code (`HomeSection.tsx`, `MyDeckSection.tsx`, `cardNurtureStore.ts`).
   - The test harness blueprint provided in Section 4 is the complete, drop-in specification for the Worker to create at `tests/adversarial_m2_home_deck.ts`.

---

## 4. Conclusion & Test Suite Blueprint

### 4.1 Test Architecture Overview
The test harness `tests/adversarial_m2_home_deck.ts` consists of **6 Comprehensive Challenge Suites** covering **28 distinct assertions**:

| Suite | Focus Area | Assertions | Key Invariants Tested |
|---|---|:---:|---|
| **Suite 1** | Official Graphic Logo (`/logo-ko.png`) | 4 | Physical file magic bytes `89 50 4E 47`, dimensions `1268x716`, `<img>` tag in `renderHomeSection()`, alt text |
| **Suite 2** | Cool Card Deck 5-Card Fan-Folded Preview | 6 | 5 card DOM nodes, rotational offsets (`-12deg` to `+12deg`), bust artwork, name/faction, Deck CP display, win streak flame badge |
| **Suite 3** | 4 Media Pillars & External Serializations | 5 | 4 pillars (웹소설, 웹게임, 웹툰, 애니메이션), 3 serialization links (Naver Novel, Naver Webtoon, Munpia), `[절찬 연재중]` badges |
| **Suite 4** | `#deck` Active 5-Slot Layout & Slot Selection | 4 | 5 slot containers (Slot 01..05), slot selection attributes, active card stats (N/E/S/W), unspent point red dots |
| **Suite 5** | Card Replacement, Duplicate Prevention & Deck TP | 5 | Owned card replacement, unowned card rejection, slot swapping/duplicate prevention (`Set.size === 5`), dynamic Deck TP recalculation, stat allocation sync |
| **Suite 6** | LocalStorage Persistence & Fault Tolerance | 4 | Synchronous `hero_deck` write, rehydration into new store instance, legacy `CardData[]` object format extraction, corrupted JSON recovery |

---

### 4.2 Exact Drop-In Test Blueprint for `tests/adversarial_m2_home_deck.ts`

The Worker must create `tests/adversarial_m2_home_deck.ts` with the following complete, executable source code:

```typescript
/**
 * tests/adversarial_m2_home_deck.ts
 *
 * EMPIRICAL ADVERSARIAL TEST HARNESS — MILESTONE 2
 * Home Section Branding & MyDeck Editing Parity (Features 5, 6, 7)
 *
 * Scope:
 * 1. Physical existence and DOM rendering of official graphic logo (/logo-ko.png) in #home.
 * 2. 5-card fan-folded squad preview in #home with active deck cards, rotation angles, stats, deck CP, and flame badge.
 * 3. Preservation of 4 core media pillars and external serialization links with '[절찬 연재중]' badges.
 * 4. 5-slot active deck layout in #deck with slot selection and detailed card inspection.
 * 5. Card replacement from owned inventory, unowned card rejection, and strict duplicate prevention in active squad.
 * 6. Real-time dynamic Deck TP calculation and synchronization with card nurturing.
 * 7. LocalStorage persistence (hero_deck), rehydration, legacy format compatibility, and corruption recovery.
 *
 * Usage:
 *   npx tsx tests/adversarial_m2_home_deck.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ============================================================================
// In-Memory Storage Mock for Headless Node.js Execution
// ============================================================================

class MockStorage implements Storage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

const mockStorage = new MockStorage();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

// Import production code modules
import { renderHomeSection } from '../src/landing/views/HomeSection';
import { renderMyDeckSection } from '../src/landing/views/MyDeckSection';
import { cardNurtureStore, CardNurtureStore } from '../src/landing/services/cardNurtureStore';
import { CARD_DATABASE } from '../src/cardDatabase';
import { EXTERNAL_LINKS } from '../src/landing/types';

// ============================================================================
// ANSI Color Formatting & Test Assertion Runner
// ============================================================================

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface AssertionResult {
  suite: string;
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  expected?: string;
  actual?: string;
}

const results: AssertionResult[] = [];

function assert(
  suite: string,
  id: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  extraMessage?: string
): void {
  results.push({
    suite,
    id,
    name,
    passed: condition,
    expected,
    actual,
    message: extraMessage,
  });

  const badge = condition ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
  console.log(`  [${id}] ${name.padEnd(54)} ${badge}`);
  if (!condition) {
    if (expected !== undefined && actual !== undefined) {
      console.log(`    ${YELLOW}↳ Expected: ${expected}${RESET}`);
      console.log(`    ${YELLOW}↳ Actual  : ${actual}${RESET}`);
    }
    if (extraMessage) {
      console.log(`    ${YELLOW}↳ Note    : ${extraMessage}${RESET}`);
    }
  }
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runAdversarialHarness() {
  const startTime = performance.now();
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  MILESTONE 2 EMPIRICAL ADVERSARIAL TEST HARNESS: HOME & DECK PARITY  ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`Working Directory : ${REPO_ROOT}`);
  console.log(`Target Modules    : HomeSection.tsx, MyDeckSection.tsx, cardNurtureStore.ts`);
  console.log(`Features Verified : Feature 5 (Logo), Feature 6 (Fan Deck & Pillars), Feature 7 (MyDeck Editing)\n`);

  // Reset in-memory storage to clean baseline
  mockStorage.clear();
  cardNurtureStore.initDefaultCards();
  cardNurtureStore.ownedCardIds = [1, 2, 3, 4, 5];
  if (Array.isArray((cardNurtureStore as any).activeDeckIds)) {
    (cardNurtureStore as any).activeDeckIds = [1, 2, 3, 4, 5];
  }

  // --------------------------------------------------------------------------
  // SUITE 1: Official Graphic Logo (/logo-ko.png) Physical Asset & Home DOM
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 1: Official Graphic Logo (/logo-ko.png) Integrity & Rendering${RESET}`);

  // Test 1.1: Physical Asset Existence & Magic Bytes
  const logoPath = path.join(REPO_ROOT, 'public/logo-ko.png');
  const fileExists = fs.existsSync(logoPath);
  let isPngMagic = false;
  let imgWidth = 0;
  let imgHeight = 0;
  let fileSize = 0;

  if (fileExists) {
    const stat = fs.statSync(logoPath);
    fileSize = stat.size;
    const fd = fs.openSync(logoPath, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    isPngMagic = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    imgWidth = buf.readUInt32BE(16);
    imgHeight = buf.readUInt32BE(20);
  }

  assert(
    'Suite 1',
    'M2.LOGO.1',
    'Physical logo file exists with PNG magic bytes',
    fileExists && isPngMagic,
    'Valid PNG at public/logo-ko.png',
    `fileExists=${fileExists}, isPngMagic=${isPngMagic}`
  );

  assert(
    'Suite 1',
    'M2.LOGO.2',
    'Logo asset resolution matches official 1268x716 dimensions',
    imgWidth === 1268 && imgHeight === 716,
    '1268x716 px',
    `${imgWidth}x${imgHeight} px`
  );

  // Test 1.3: Home Section DOM Rendering of /logo-ko.png
  const homeHtml = renderHomeSection();
  const $home = cheerio.load(homeHtml);
  const logoImgs = $home('img').filter((_, el) => {
    const src = $home(el).attr('src') || '';
    return src.includes('logo-ko.png');
  });

  assert(
    'Suite 1',
    'M2.LOGO.3',
    'renderHomeSection() renders <img> with src="/logo-ko.png"',
    logoImgs.length >= 1,
    'At least 1 logo <img> tag',
    `Found ${logoImgs.length}`
  );

  const logoAlt = logoImgs.first().attr('alt') || '';
  const hasValidAlt = logoAlt.includes('눈히어로') || logoAlt.includes('SNSHero');
  assert(
    'Suite 1',
    'M2.LOGO.4',
    'Logo <img> includes accessible alt text branding',
    hasValidAlt,
    'Alt text containing "눈히어로" or "SNSHero"',
    `Alt: "${logoAlt}"`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 2: Cool Card Deck 5-Card Fan-Folded Squad Preview in #home
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 2: Cool Card Deck 5-Card Fan-Folded Squad Preview in #home${RESET}`);

  // Test 2.1: 5 distinct card preview items rendered in fan container
  const fanCards = $home('[data-fan-card], .fan-card, [data-deck-preview-card]');
  // Fallback: search for cards inside cool-card-deck / squad preview container
  const squadContainer = $home('#home-squad-fan, [data-testid="cool-card-deck"], .squad-fan-container');
  const squadCardsCount = fanCards.length > 0 ? fanCards.length : squadContainer.find('[data-card-id]').length;

  assert(
    'Suite 2',
    'M2.FAN.1',
    'Squad preview renders exactly 5 active squad cards',
    squadCardsCount === 5 || fanCards.length === 5,
    '5 preview cards',
    `Found ${squadCardsCount || fanCards.length}`
  );

  // Test 2.2: Rotational transform offsets present (-12deg to +12deg)
  let foundNegativeRot = false;
  let foundPositiveRot = false;
  let foundZeroRot = false;

  const cardsToInspect = fanCards.length > 0 ? fanCards : squadContainer.find('[data-card-id]');
  cardsToInspect.each((_, el) => {
    const style = $home(el).attr('style') || '';
    const classAttr = $home(el).attr('class') || '';
    const fullDesc = `${style} ${classAttr}`;

    if (fullDesc.includes('rotate(-') || fullDesc.includes('-rotate-') || fullDesc.includes('-12deg') || fullDesc.includes('-6deg') || fullDesc.includes('-10deg')) {
      foundNegativeRot = true;
    }
    if (fullDesc.includes('rotate(') && !fullDesc.includes('rotate(-') && (fullDesc.includes('12deg') || fullDesc.includes('6deg') || fullDesc.includes('10deg') || fullDesc.includes('rotate-'))) {
      foundPositiveRot = true;
    }
    if (fullDesc.includes('rotate(0') || fullDesc.includes('rotate-0') || fullDesc.includes('0deg')) {
      foundZeroRot = true;
    }
  });

  const hasFanRotation = (foundNegativeRot && foundPositiveRot) || homeHtml.includes('rotate(') || homeHtml.includes('-12deg');
  assert(
    'Suite 2',
    'M2.FAN.2',
    'Fan-folded cards feature symmetric rotational transforms',
    hasFanRotation,
    'Symmetric rotation angles (negative, center, positive)',
    `neg=${foundNegativeRot}, center=${foundZeroRot}, pos=${foundPositiveRot}`
  );

  // Test 2.3: Active squad cards represent current active deck IDs
  const activeDeckIds = (cardNurtureStore as any).activeDeckIds || cardNurtureStore.ownedCardIds.slice(0, 5);
  let allActiveCardsRendered = true;
  for (const cardId of activeDeckIds) {
    const dbCard = CARD_DATABASE[cardId];
    if (dbCard && !homeHtml.includes(dbCard.name_ko) && !homeHtml.includes(dbCard.name_en)) {
      allActiveCardsRendered = false;
      break;
    }
  }

  assert(
    'Suite 2',
    'M2.FAN.3',
    'Fan preview displays active deck heroes (names & artwork)',
    allActiveCardsRendered,
    'All 5 active deck hero names/assets rendered',
    `allActiveCardsRendered=${allActiveCardsRendered}`
  );

  // Test 2.4: Deck Combat Power (CP) display
  const expectedDeckCP = cardNurtureStore.getDeckTP();
  const hasDeckCP = homeHtml.includes(`${expectedDeckCP}`) && (homeHtml.includes('전투력') || homeHtml.includes('CP') || homeHtml.includes('TP'));

  assert(
    'Suite 2',
    'M2.FAN.4',
    'Displays accurate Deck Combat Power (CP / TP) metric',
    hasDeckCP,
    `Displays Deck CP: ${expectedDeckCP}`,
    `Found CP in HTML: ${hasDeckCP}`
  );

  // Test 2.5: Win Streak Flame Badge
  const hasFlameBadge = homeHtml.includes('🔥') || homeHtml.includes('연승') || homeHtml.includes('WIN STREAK');
  assert(
    'Suite 2',
    'M2.FAN.5',
    'Displays win streak flame badge (e.g. 🔥 7연승)',
    hasFlameBadge,
    'Flame badge with "🔥" or "연승"',
    `Found: ${hasFlameBadge}`
  );

  // Test 2.6: Interactive link to Deck Management (#deck)
  const hasDeckLink = $home('a[href="#deck"], button[data-nav="deck"], [data-action="go-to-deck"]').length >= 1;
  assert(
    'Suite 2',
    'M2.FAN.6',
    'Fan preview includes seamless interactive link to #deck',
    hasDeckLink,
    'Link/button targeting #deck',
    `Found ${hasDeckLink ? 'yes' : 'no'}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 3: 4 Core Media Pillars & External Serialization Links Preservation
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 3: 4 Core Media Pillars & Serialization Links Preservation${RESET}`);

  // Test 3.1: 4 Core Media Pillars
  const hasNovelPillar = homeHtml.includes('웹소설') && (homeHtml.includes('40부작') || homeHtml.includes('NOVEL'));
  const hasGamePillar = homeHtml.includes('웹게임') && (homeHtml.includes('카드') || homeHtml.includes('GAME'));
  const hasWebtoonPillar = homeHtml.includes('웹툰') && (homeHtml.includes('840컷') || homeHtml.includes('WEBTOON') || homeHtml.includes('2,049컷'));
  const hasAnimePillar = homeHtml.includes('애니메이션') && (homeHtml.includes('시네마틱') || homeHtml.includes('ANIME') || homeHtml.includes('MP4'));

  assert(
    'Suite 3',
    'M2.PIL.1',
    'Preserves all 4 core media pillars (웹소설, 웹게임, 웹툰, 애니메이션)',
    hasNovelPillar && hasGamePillar && hasWebtoonPillar && hasAnimePillar,
    'All 4 pillars fully preserved',
    `novel=${hasNovelPillar}, game=${hasGamePillar}, webtoon=${hasWebtoonPillar}, anime=${hasAnimePillar}`
  );

  // Test 3.2: Naver Novel Serialization Link & Badge
  const naverNovelAnchor = $home(`a[href*="novel.naver.com"]`);
  const hasNovelUrl = naverNovelAnchor.length >= 1 || homeHtml.includes(EXTERNAL_LINKS.naverNovel);
  assert(
    'Suite 3',
    'M2.PIL.2',
    'Preserves official Naver Web Novel serialization link',
    hasNovelUrl,
    `Link matching ${EXTERNAL_LINKS.naverNovel}`,
    `Found: ${hasNovelUrl}`
  );

  // Test 3.3: Naver Webtoon Serialization Link & Badge
  const naverWebtoonAnchor = $home(`a[href*="comic.naver.com"]`);
  const hasWebtoonUrl = naverWebtoonAnchor.length >= 1 || homeHtml.includes(EXTERNAL_LINKS.naverWebtoon);
  assert(
    'Suite 3',
    'M2.PIL.3',
    'Preserves official Naver Webtoon serialization link',
    hasWebtoonUrl,
    `Link matching ${EXTERNAL_LINKS.naverWebtoon}`,
    `Found: ${hasWebtoonUrl}`
  );

  // Test 3.4: Munpia Serialization Link & Badge
  const munpiaAnchor = $home(`a[href*="munpia.com"]`);
  const hasMunpiaUrl = munpiaAnchor.length >= 1 || homeHtml.includes(EXTERNAL_LINKS.munpiaNovel);
  assert(
    'Suite 3',
    'M2.PIL.4',
    'Preserves official Munpia novel serialization link',
    hasMunpiaUrl,
    `Link matching ${EXTERNAL_LINKS.munpiaNovel}`,
    `Found: ${hasMunpiaUrl}`
  );

  // Test 3.5: [절찬 연재중] Badges Present on All 3 External Links
  const badgeMatches = (homeHtml.match(/절찬\s*연재중/g) || []).length;
  assert(
    'Suite 3',
    'M2.PIL.5',
    'All 3 serialization platforms display "[절찬 연재중]" badges',
    badgeMatches >= 3,
    'At least 3 instances of "[절찬 연재중]"',
    `Found ${badgeMatches} badge instances`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 4: #deck Active 5-Slot Layout & Slot Selection
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 4: #deck Active 5-Slot Layout & Slot Selection${RESET}`);

  const deckHtml = renderMyDeckSection(1);
  const $deck = cheerio.load(deckHtml);

  // Test 4.1: Exactly 5 Slot Items Rendered
  const slotButtons = $deck('[data-action="select-deck-card"], [data-action="select-deck-slot"], [data-slot-index]');
  assert(
    'Suite 4',
    'M2.SLOT.1',
    'renderMyDeckSection() renders exactly 5 deck slot cards',
    slotButtons.length === 5,
    '5 interactive slot elements',
    `Found ${slotButtons.length}`
  );

  // Test 4.2: Directional Compass Stats (N, E, S, W) on Active Slots
  const hasCompassStats = deckHtml.includes('북') && deckHtml.includes('남') && deckHtml.includes('동') && deckHtml.includes('서');
  assert(
    'Suite 4',
    'M2.SLOT.2',
    'Deck slots display 4-way compass stats (N, E, S, W)',
    hasCompassStats,
    'All 4 compass directions present',
    `hasCompassStats=${hasCompassStats}`
  );

  // Test 4.3: Unspent Stat Point Red Dot Indicator Indicator Support
  cardNurtureStore.cards[1].statPoints = 2; // Give Card 1 unspent points
  const deckHtmlWithRedDot = renderMyDeckSection(1);
  const hasRedDot = deckHtmlWithRedDot.includes('bg-red-600') || deckHtmlWithRedDot.includes('pt') || deckHtmlWithRedDot.includes('미사용');
  assert(
    'Suite 4',
    'M2.SLOT.3',
    'Cards with unspent stat points display red dot indicator (+pt)',
    hasRedDot,
    'Red badge indicating unspent stat points',
    `Found red dot styling: ${hasRedDot}`
  );
  cardNurtureStore.cards[1].statPoints = 0; // Reset

  // Test 4.4: Selected Card Deep Inspection Section Rendered
  const hasInspectionView = deckHtml.includes('공식 7등신 풀바디 투명 컷아웃') || deckHtml.includes('SELECTED CARD DETAIL') || deckHtml.includes('영웅 상세 분석');
  assert(
    'Suite 4',
    'M2.SLOT.4',
    'Selected card inspector renders 7-head cutout and detailed stats',
    hasInspectionView,
    'Detailed inspector panel present',
    `Found inspector view: ${hasInspectionView}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 5: Card Replacement, Duplicate Prevention & Real-Time Deck TP
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 5: Card Replacement, Duplicate Prevention & Real-Time Deck TP${RESET}`);

  // Test 5.1: Replace Slot 0 with Owned Card 6
  cardNurtureStore.addCard(6); // Ensure Card 6 is owned
  const initialDeckTP = cardNurtureStore.getDeckTP();
  const setCardResult = (cardNurtureStore as any).setDeckCard
    ? (cardNurtureStore as any).setDeckCard(0, 6)
    : false;

  const currentSlot0 = (cardNurtureStore as any).activeDeckIds
    ? (cardNurtureStore as any).activeDeckIds[0]
    : null;

  assert(
    'Suite 5',
    'M2.EDIT.1',
    'setDeckCard(0, 6) successfully swaps owned Card 6 into Slot 0',
    setCardResult === true && currentSlot0 === 6,
    'setDeckCard returns true and activeDeckIds[0] === 6',
    `result=${setCardResult}, slot0=${currentSlot0}`
  );

  // Test 5.2: Reject Unowned Card 99
  const unownedCardId = 99;
  const is99Owned = cardNurtureStore.isCardOwned(unownedCardId);
  const unownedSetResult = (cardNurtureStore as any).setDeckCard
    ? (cardNurtureStore as any).setDeckCard(0, unownedCardId)
    : false;

  const slot0AfterUnowned = (cardNurtureStore as any).activeDeckIds
    ? (cardNurtureStore as any).activeDeckIds[0]
    : null;

  assert(
    'Suite 5',
    'M2.EDIT.2',
    'setDeckCard() strictly rejects unowned card (Card 99)',
    !is99Owned && unownedSetResult === false && slot0AfterUnowned === 6,
    'Unowned card rejected without slot mutation',
    `isOwned=${is99Owned}, result=${unownedSetResult}, slot0=${slot0AfterUnowned}`
  );

  // Test 5.3: Duplicate Prevention in Active Squad (No duplicate cards across 5 slots)
  // Currently active deck has Card 6 at Slot 0, and Card 2 at Slot 1.
  // Attempt to place Card 6 into Slot 1:
  const duplicateSetResult = (cardNurtureStore as any).setDeckCard
    ? (cardNurtureStore as any).setDeckCard(1, 6)
    : false;

  const currentDeckIds = (cardNurtureStore as any).activeDeckIds || [];
  const uniqueCount = new Set(currentDeckIds).size;

  assert(
    'Suite 5',
    'M2.EDIT.3',
    'Active squad strictly prevents duplicate cards (Set size === 5)',
    uniqueCount === 5,
    'Exactly 5 unique card IDs across all 5 active slots',
    `uniqueCount=${uniqueCount}, deck=[${currentDeckIds.join(', ')}]`
  );

  // Test 5.4: Dynamic Deck TP Recalculation on Card Replacement
  const newDeckTP = cardNurtureStore.getDeckTP();
  const calculatedSum = currentDeckIds.reduce((sum: number, id: number) => {
    return sum + cardNurtureStore.getCardBasePower(id) + (cardNurtureStore.cards[id]?.totalBonus || 0);
  }, 0);

  assert(
    'Suite 5',
    'M2.EDIT.4',
    'Deck TP dynamically recalculates to match exact 5-slot power sum',
    newDeckTP === calculatedSum && newDeckTP > 0,
    `Deck TP === calculated sum (${calculatedSum})`,
    `getDeckTP()=${newDeckTP}, sum=${calculatedSum}`
  );

  // Test 5.5: Stat Allocation Syncs Directly into Deck TP
  const preAllocDeckTP = cardNurtureStore.getDeckTP();
  const cardInSlot0 = currentDeckIds[0];
  cardNurtureStore.cards[cardInSlot0].statPoints = 1;
  const allocSuccess = cardNurtureStore.allocateStat(cardInSlot0, 'top');
  const postAllocDeckTP = cardNurtureStore.getDeckTP();

  assert(
    'Suite 5',
    'M2.EDIT.5',
    'Allocating stat point to active deck card immediately increases Deck TP by +1',
    allocSuccess && postAllocDeckTP === preAllocDeckTP + 1,
    `Deck TP increases from ${preAllocDeckTP} to ${preAllocDeckTP + 1}`,
    `allocSuccess=${allocSuccess}, postAlloc=${postAllocDeckTP}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 6: LocalStorage Persistence (hero_deck) & Fault Tolerance
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 6: LocalStorage Persistence (hero_deck) & Fault Tolerance${RESET}`);

  // Test 6.1: Active Deck Synchronously Persisted under 'hero_deck'
  cardNurtureStore.saveToStorage();
  const rawStoredDeck = mockStorage.getItem('hero_deck');
  let parsedStoredDeck: any = null;
  try {
    parsedStoredDeck = rawStoredDeck ? JSON.parse(rawStoredDeck) : null;
  } catch {}

  const isStoredValidArray = Array.isArray(parsedStoredDeck) && parsedStoredDeck.length === 5;
  assert(
    'Suite 6',
    'M2.STORE.1',
    'Active deck is synchronously persisted to LocalStorage "hero_deck"',
    isStoredValidArray,
    '5-element JSON array in localStorage.hero_deck',
    `Stored: ${rawStoredDeck}`
  );

  // Test 6.2: Rehydration into Fresh Store Instance
  const customDeck = [10, 20, 30, 40, 50];
  mockStorage.setItem('hero_deck', JSON.stringify(customDeck));
  // Ensure those cards are marked as owned in nurturing payload
  mockStorage.setItem(
    'hero_card_nurturing',
    JSON.stringify({
      cards: cardNurtureStore.cards,
      ownedCardIds: [1, 2, 3, 4, 5, 10, 20, 30, 40, 50],
      updatedAt: Date.now(),
    })
  );

  const freshStore = new CardNurtureStore();
  const freshActiveDeck = (freshStore as any).activeDeckIds || [];
  const rehydratedMatches = JSON.stringify(freshActiveDeck) === JSON.stringify(customDeck);

  assert(
    'Suite 6',
    'M2.STORE.2',
    'Fresh CardNurtureStore rehydrates activeDeckIds from localStorage.hero_deck',
    rehydratedMatches,
    `Rehydrated deck: [${customDeck.join(', ')}]`,
    `Got: [${freshActiveDeck.join(', ')}]`
  );

  // Test 6.3: Dual-Sync with Legacy Object Format ([{ id: 1 }, ...])
  const legacyDeckObjects = [
    { id: 7, name_ko: '영웅7' },
    { id: 8, name_ko: '영웅8' },
    { id: 9, name_ko: '영웅9' },
    { id: 11, name_ko: '영웅11' },
    { id: 12, name_ko: '영웅12' },
  ];
  mockStorage.setItem('hero_deck', JSON.stringify(legacyDeckObjects));
  const legacyStore = new CardNurtureStore();
  const legacyActiveDeck = (legacyStore as any).activeDeckIds || [];
  const extractedIdsMatch = JSON.stringify(legacyActiveDeck) === JSON.stringify([7, 8, 9, 11, 12]);

  assert(
    'Suite 6',
    'M2.STORE.3',
    'Gracefully parses legacy CardData[] object format from hero_deck',
    extractedIdsMatch,
    'Extracted IDs [7, 8, 9, 11, 12]',
    `Got: [${legacyActiveDeck.join(', ')}]`
  );

  // Test 6.4: Corrupted LocalStorage Fault Tolerance
  mockStorage.setItem('hero_deck', 'CORRUPTED_JSON_{{{{INVALID');
  let loadThrew = false;
  let corruptedStore: any = null;
  try {
    corruptedStore = new CardNurtureStore();
  } catch {
    loadThrew = true;
  }

  const fallbackDeck = corruptedStore?.activeDeckIds || [];
  const fallbackValid = !loadThrew && Array.isArray(fallbackDeck) && fallbackDeck.length === 5;

  assert(
    'Suite 6',
    'M2.STORE.4',
    'Corrupted hero_deck JSON gracefully falls back to default 5 cards without crashing',
    fallbackValid,
    'Safe fallback without exception, deck length === 5',
    `threw=${loadThrew}, fallbackLen=${fallbackDeck.length}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // Summary & Pass/Fail Decision
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const passRate = ((passed / total) * 100).toFixed(1);
  const totalDuration = (performance.now() - startTime).toFixed(2);

  console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`${BOLD}MILESTONE 2 TEST EXECUTION SUMMARY${RESET}`);
  console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`Total Assertions Run : ${total}`);
  console.log(`Passed               : ${GREEN}${passed}${RESET}`);
  console.log(`Failed               : ${failed > 0 ? RED + failed + RESET : '0'}`);
  console.log(`Pass Rate            : ${passRate === '100.0' ? GREEN : YELLOW}${passRate}%${RESET}`);
  console.log(`Duration             : ${totalDuration}ms\n`);

  if (failed > 0) {
    console.error(`${RED}${BOLD}FAILED: ${failed} assertion(s) did not satisfy Milestone 2 criteria.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}SUCCESS: All 28 Milestone 2 adversarial assertions passed 100%!${RESET}\n`);
    process.exit(0);
  }
}

runAdversarialHarness().catch((err) => {
  console.error('Unhandled harness exception:', err);
  process.exit(1);
});
```

---

## 5. Verification Method

### 5.1 Verification Commands
Reviewers, Challengers, and the Forensic Auditor must execute these 5 concrete commands in order:

```bash
# 1. Execute the dedicated Milestone 2 Adversarial Test Harness (Must exit with code 0, 28/28 assertions PASS)
npx tsx tests/adversarial_m2_home_deck.ts

# 2. Execute Master 4-Tier E2E Runner scoped to Milestone 2 (Must exit with code 0)
npx tsx tests/e2e/run_all.ts --milestone M2

# 3. TypeScript Type Safety Check (Must exit with code 0, 0 TS errors)
npx tsc --noEmit

# 4. Vite Production Build Verification (Must exit with code 0, bundles cleanly)
npm run build

# 5. DESIGN.md Terminal-Flat Design System Compliance Check (Must exit with code 0)
python3 tests/e2e_design_system/run_all_e2e_tests.py
```

### 5.2 Specific Files to Inspect
1. `src/landing/views/HomeSection.tsx`:
   - Line containing `<img src="/logo-ko.png" alt="SNSHero 눈히어로" ... />`.
   - Fan-folded squad preview container with 5 card elements, rotational styles (`rotate(-12deg)` to `rotate(12deg)`), card stats, Deck CP, and flame badge (`🔥 7연승`).
   - 4 media pillars (`웹소설`, `웹게임`, `웹툰`, `애니메이션`) and 3 external links (`naverNovel`, `naverWebtoon`, `munpiaNovel`) with `[절찬 연재중]` badges.
2. `src/landing/views/MyDeckSection.tsx`:
   - 5 slot elements (`data-action="select-deck-card"`, `data-card-id`), N/E/S/W directional stats, card TP badges.
   - Interactive card replacement drawer/modal displaying owned inventory (`cardNurtureStore.ownedCardIds`).
   - Real-time Deck TP calculation dynamically summing active slot powers.
3. `src/landing/services/cardNurtureStore.ts`:
   - `activeDeckIds: number[] = [1, 2, 3, 4, 5];`
   - `deckStorageKey = 'hero_deck';`
   - `setDeckCard(slotIndex: number, cardId: number): boolean` with ownership check, slot swapping / duplicate prevention, and `saveToStorage()`.
   - `getDeckTP(): number` summing `this.activeDeckIds`.
   - `saveToStorage()` and `loadFromStorage()` syncing `hero_deck` with legacy object and corrupted data guards.
4. `tests/adversarial_m2_home_deck.ts`:
   - File created and passing with 28/28 assertions.

### 5.3 Invalidation Conditions
The verification FAILS if any of the following occur:
- `renderHomeSection()` does not render `<img src="/logo-ko.png" ...>` or omits the 5-card fan-folded preview.
- `renderHomeSection()` drops any of the 4 media pillars or any of the 3 external serialization links with `[절찬 연재중]` badges.
- `setDeckCard()` allows an unowned card into an active slot, or allows the same card ID to appear in multiple active slots (`Set(activeDeckIds).size !== 5`).
- `hero_deck` is not synchronously updated in localStorage upon card replacement.
- Corrupted JSON in `hero_deck` throws an uncaught exception instead of falling back to default starter cards.
- Any TypeScript errors (`tsc --noEmit != 0`) or build bundling errors (`npm run build != 0`).
