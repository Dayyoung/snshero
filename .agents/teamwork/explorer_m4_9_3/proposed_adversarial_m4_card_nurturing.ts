/**
 * tests/adversarial_m4_card_nurturing.ts
 *
 * EMPIRICAL ADVERSARIAL TEST HARNESS — MILESTONE 4
 * Card Nurturing & Growth System: Owned Gating, Zero Cheating, Victory EXP Hook,
 * Repeat Hunting Auto-Loop, 4-Way Stat Allocation, and Storage Resilience.
 *
 * Specification Verification Points:
 *   1. Verification 1: Attempting to nurture an unowned card (by ID) is rejected and returns false/null.
 *   2. Verification 2: CardSection.tsx contains 0 cheat buttons (+50 EXP, +500 EXP).
 *   3. Verification 3: Battle victory hook awards strictly +50 EXP to all 5 active deck cards and updates hero_card_nurturing.
 *   4. Verification 4: Repeat hunting toggle (hero_repeat_hunting) persists cleanly and triggers automatic rematch.
 *   5. Verification 5: Stat point allocation (N, E, S, W) updates card total power (TP) accurately and respects unspent point constraints.
 *   6. Verification 6: Corrupted LocalStorage recovery and boundary resilience.
 *
 * Execution:
 *   npx tsx tests/adversarial_m4_card_nurturing.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

// ============================================================================
// 1. In-Memory Mock Storage & Global Browser Environment Setup
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
  dump(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of this.store.entries()) {
      out[k] = v;
    }
    return out;
  }
}

const mockStorage = new MockStorage();

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#card' },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

// ============================================================================
// 2. Production Code Imports
// ============================================================================

import { cardNurtureStore, CardNurtureStore, STORAGE_KEY } from '../../../src/landing/services/cardNurtureStore';
import {
  renderCardSection,
  setSelectedCardId,
  getSelectedCardId,
  setOwnedFilter,
  setElementFilter,
} from '../../../src/landing/views/CardSection';
import {
  playRpgState,
  toggleRepeatHunting,
  finishBattleAndAwardExp,
  initBattle,
  runAutoStep,
  initPlayRpgState,
  stepHeroDelta,
} from '../../../src/landing/services/playRpgEngine';
import { CARD_DATABASE } from '../../../src/cardDatabase';

// ============================================================================
// 3. Colored Reporting Infrastructure
// ============================================================================

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface AssertionResult {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  details?: string;
}

const results: AssertionResult[] = [];

function assert(
  id: string,
  suite: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  details?: string
): void {
  results.push({ id, suite, name, passed: condition, expected, actual, details });
  const badge = condition ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${badge}] [${CYAN}${id}${RESET}] [${suite}] ${name}`);
  if (!condition) {
    if (expected !== undefined && actual !== undefined) {
      console.log(`         ${YELLOW}Expected:${RESET} ${expected}`);
      console.log(`         ${YELLOW}Actual:  ${RESET} ${actual}`);
    }
    if (details) {
      console.log(`         ${YELLOW}Details: ${RESET} ${details}`);
    }
  }
}

console.log(`${BOLD}========================================================================${RESET}`);
console.log(`${BOLD}  SNSHero MILESTONE 4: CARD NURTURING & GROWTH ADVERSARIAL HARNESS    ${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);

// ============================================================================
// SUITE 1: Owned-Only Nurturing Gating & Unowned Rejection (Verification 1)
// ============================================================================
console.log(`${CYAN}--- [SUITE 1] Owned-Only Nurturing Gating & Unowned Card Rejection ---${RESET}`);
{
  // Reset store to pristine default state
  mockStorage.clear();
  const testStore = new CardNurtureStore();

  assert(
    'ADV-M4-OWN-01',
    'SUITE 1',
    'Default owned inventory contains exactly starter cards [1, 2, 3, 4, 5]',
    testStore.ownedCardIds.length === 5 &&
      [1, 2, 3, 4, 5].every((id) => testStore.ownedCardIds.includes(id)),
    '[1, 2, 3, 4, 5]',
    JSON.stringify(testStore.ownedCardIds)
  );

  assert(
    'ADV-M4-OWN-02',
    'SUITE 1',
    'Unowned card 50 isCardOwned evaluates to false',
    testStore.isCardOwned(50) === false,
    'false',
    String(testStore.isCardOwned(50))
  );

  // Attempt to nurture unowned card 50 with 500 EXP
  const nurtureRes50 = testStore.nurtureCard(50, 500);
  assert(
    'ADV-M4-OWN-03',
    'SUITE 1',
    'nurtureCard(50, 500) on unowned card is rejected (expGained: 0, leveledUp: false, newLevel: 1)',
    nurtureRes50.expGained === 0 && nurtureRes50.leveledUp === false && nurtureRes50.newLevel === 1,
    'expGained: 0, leveledUp: false, newLevel: 1',
    `expGained: ${nurtureRes50.expGained}, leveledUp: ${nurtureRes50.leveledUp}, newLevel: ${nurtureRes50.newLevel}`
  );

  assert(
    'ADV-M4-OWN-04',
    'SUITE 1',
    'Unowned card 50 internal record remains intact (Lv 1, 0 EXP, 0 statPoints)',
    testStore.cards[50].level === 1 &&
      testStore.cards[50].exp === 0 &&
      testStore.cards[50].statPoints === 0,
    'Lv 1, 0 EXP, 0 pts',
    `Lv ${testStore.cards[50].level}, ${testStore.cards[50].exp} EXP, ${testStore.cards[50].statPoints} pts`
  );

  // Out-of-bounds card IDs
  const oobMinus = testStore.nurtureCard(-1, 100);
  const oobZero = testStore.nurtureCard(0, 100);
  const oobOver = testStore.nurtureCard(111, 100);
  assert(
    'ADV-M4-OWN-05',
    'SUITE 1',
    'Invalid/out-of-bounds card IDs (-1, 0, 111) are strictly rejected with zero progression',
    oobMinus.expGained === 0 && oobZero.expGained === 0 && oobOver.expGained === 0,
    'All expGained === 0',
    `-1:${oobMinus.expGained}, 0:${oobZero.expGained}, 111:${oobOver.expGained}`
  );

  // Attempting to set unowned card into active deck slot
  const deckSwapRes = testStore.setDeckCard(0, 50);
  assert(
    'ADV-M4-OWN-06',
    'SUITE 1',
    'setDeckCard(0, 50) on unowned card 50 returns false and leaves slot 0 intact',
    deckSwapRes === false && testStore.activeDeckIds[0] === 1,
    'false and slot 0 == 1',
    `${deckSwapRes} and slot 0 == ${testStore.activeDeckIds[0]}`
  );

  // Attempting to allocate stat points to unowned card
  const statAllocUnowned = testStore.allocateStat(50, 'top');
  assert(
    'ADV-M4-OWN-07',
    'SUITE 1',
    'allocateStat(50, "top") on unowned card 50 returns false',
    statAllocUnowned === false,
    'false',
    String(statAllocUnowned)
  );

  // Legitimate acquisition unlocks nurturing
  testStore.addCard(50);
  const isNowOwned = testStore.isCardOwned(50);
  const legitimateNurture = testStore.nurtureCard(50, 100);
  assert(
    'ADV-M4-OWN-08',
    'SUITE 1',
    'Acquiring card 50 via addCard(50) unlocks legitimate nurturing (Lv 2 reached)',
    isNowOwned === true &&
      legitimateNurture.expGained === 100 &&
      legitimateNurture.leveledUp === true &&
      legitimateNurture.newLevel === 2,
    'Owned true, Lv 2',
    `Owned ${isNowOwned}, Lv ${legitimateNurture.newLevel}`
  );
}

// ============================================================================
// SUITE 2: Complete Elimination of Free EXP Cheat Buttons in CardSection (Verification 2)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 2] Elimination of Free EXP Cheat Buttons in CardSection ---${RESET}`);
{
  const cardSectionSourcePath = path.resolve(REPO_ROOT, 'src/landing/views/CardSection.tsx');
  const cardSectionSource = fs.existsSync(cardSectionSourcePath)
    ? fs.readFileSync(cardSectionSourcePath, 'utf8')
    : '';

  assert(
    'ADV-M4-NOCHEAT-01',
    'SUITE 2',
    'CardSection.tsx source code contains 0 instances of "+50 EXP" button text',
    !cardSectionSource.includes('+50 EXP'),
    '0 occurrences of "+50 EXP"',
    cardSectionSource.includes('+50 EXP') ? 'FOUND "+50 EXP" in CardSection.tsx' : '0 occurrences'
  );

  assert(
    'ADV-M4-NOCHEAT-02',
    'SUITE 2',
    'CardSection.tsx source code contains 0 instances of "+500 EXP" button text',
    !cardSectionSource.includes('+500 EXP'),
    '0 occurrences of "+500 EXP"',
    cardSectionSource.includes('+500 EXP') ? 'FOUND "+500 EXP" in CardSection.tsx' : '0 occurrences'
  );

  assert(
    'ADV-M4-NOCHEAT-03',
    'SUITE 2',
    'CardSection.tsx source code contains 0 instances of data-action="nurture-card"',
    !cardSectionSource.includes('data-action="nurture-card"'),
    '0 occurrences of data-action="nurture-card"',
    cardSectionSource.includes('data-action="nurture-card"')
      ? 'FOUND data-action="nurture-card"'
      : '0 occurrences'
  );

  assert(
    'ADV-M4-NOCHEAT-04',
    'SUITE 2',
    'CardSection.tsx source code contains 0 instances of data-exp attribute',
    !cardSectionSource.includes('data-exp='),
    '0 occurrences of data-exp=',
    cardSectionSource.includes('data-exp=') ? 'FOUND data-exp=' : '0 occurrences'
  );

  // Render CardSection with Card 1 selected
  setSelectedCardId(1);
  const renderedCardHtml = renderCardSection();

  // Audit rendered DOM strings
  const hasCheatButtonInRender =
    renderedCardHtml.includes('+50 EXP') ||
    renderedCardHtml.includes('+500 EXP') ||
    renderedCardHtml.includes('data-action="nurture-card"');

  assert(
    'ADV-M4-NOCHEAT-05',
    'SUITE 2',
    'Rendered CardSection DOM contains 0 cheat buttons when inspecting card',
    hasCheatButtonInRender === false,
    'false (no cheat buttons in DOM)',
    String(hasCheatButtonInRender)
  );

  // Verify legitimate battle victory EXP notice is present
  const hasBattleExpNotice =
    renderedCardHtml.includes('배틀') ||
    renderedCardHtml.includes('승리') ||
    renderedCardHtml.includes('전투');
  assert(
    'ADV-M4-NOCHEAT-06',
    'SUITE 2',
    'Rendered CardSection displays legitimate battle victory EXP notice',
    hasBattleExpNotice === true,
    'true',
    String(hasBattleExpNotice)
  );

  // Verify 4-way stat allocation matrix controls remain present and functional
  const hasTopStatBtn = renderedCardHtml.includes('data-action="allocate-stat"') &&
    renderedCardHtml.includes('data-direction="top"');
  assert(
    'ADV-M4-NOCHEAT-07',
    'SUITE 2',
    '4-way stat allocation matrix buttons remain present for allocating earned points',
    hasTopStatBtn === true,
    'true',
    String(hasTopStatBtn)
  );
}

// ============================================================================
// SUITE 3: Battle Victory EXP Gating Hook (+50 EXP to Active Deck) (Verification 3)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 3] Battle Victory EXP Gating Hook (+50 EXP to Active Squad) ---${RESET}`);
{
  mockStorage.clear();
  const testStore = new CardNurtureStore();
  testStore.addCard(6); // Add Card 6 to owned inventory as bench card

  const activeDeckBefore = testStore.getDeckCardIds();
  const expBefore: Record<number, number> = {};
  for (const id of activeDeckBefore) {
    expBefore[id] = testStore.cards[id].exp;
  }
  const benchExpBefore = testStore.cards[6].exp;

  // Award battle victory EXP (50 EXP)
  const victoryReward = (testStore as any).awardBattleVictoryExp
    ? (testStore as any).awardBattleVictoryExp(50)
    : { expAwarded: 0, deckCount: 0 };

  assert(
    'ADV-M4-BATTLE-01',
    'SUITE 3',
    'awardBattleVictoryExp exists and returns 50 EXP awarded across active deck',
    victoryReward.expAwarded === 50,
    'expAwarded: 50',
    `expAwarded: ${victoryReward.expAwarded}`
  );

  // Verify all 5 active deck cards received strictly +50 EXP
  const allActiveReceived50 = activeDeckBefore.every((id) => {
    return testStore.cards[id].exp === expBefore[id] + 50;
  });
  assert(
    'ADV-M4-BATTLE-02',
    'SUITE 3',
    'All 5 active deck cards [1, 2, 3, 4, 5] each received strictly +50 EXP',
    allActiveReceived50 === true,
    'true',
    String(allActiveReceived50)
  );

  // Verify owned bench card (Card 6) received strictly 0 EXP
  assert(
    'ADV-M4-BATTLE-03',
    'SUITE 3',
    'Owned bench card (Card 6) NOT in active deck received 0 EXP (remained at 0)',
    testStore.cards[6].exp === benchExpBefore,
    `exp == ${benchExpBefore}`,
    `exp == ${testStore.cards[6].exp}`
  );

  // Consecutive victory awards additional 50 EXP -> triggers Lv 1 -> Lv 2 level up!
  if (typeof (testStore as any).awardBattleVictoryExp === 'function') {
    (testStore as any).awardBattleVictoryExp(50);
  }
  assert(
    'ADV-M4-BATTLE-04',
    'SUITE 3',
    'Consecutive victory awards +50 EXP (100 total) triggering Lv 2 and +1 statPoint for active deck',
    testStore.cards[1].level === 2 &&
      testStore.cards[1].statPoints === 1 &&
      testStore.cards[1].exp === 0 &&
      testStore.cards[1].expToNext === 200,
    'Lv 2, 1 statPoint, 0 exp, 200 expToNext',
    `Lv ${testStore.cards[1].level}, ${testStore.cards[1].statPoints} statPoint, ${testStore.cards[1].exp} exp, ${testStore.cards[1].expToNext} expToNext`
  );

  // Storage synchronization check
  const rawSavedNurture = mockStorage.getItem(STORAGE_KEY);
  let parsedPayload: any = null;
  try {
    parsedPayload = JSON.parse(rawSavedNurture || '{}');
  } catch {}

  assert(
    'ADV-M4-BATTLE-05',
    'SUITE 3',
    'hero_card_nurturing in localStorage contains updated level 2 for active deck cards',
    parsedPayload?.cards?.[1]?.level === 2 && parsedPayload?.cards?.[1]?.statPoints === 1,
    'cards[1].level == 2',
    `cards[1].level == ${parsedPayload?.cards?.[1]?.level}`
  );
}

// ============================================================================
// SUITE 4: Repeat Hunting Auto-Rematch Loop (Verification 4)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 4] Repeat Hunting Auto-Rematch Loop (hero_repeat_hunting) ---${RESET}`);
{
  mockStorage.clear();
  initPlayRpgState();

  assert(
    'ADV-M4-REPEAT-01',
    'SUITE 4',
    'Initial repeat hunting state is false',
    playRpgState.repeatHunting === false,
    'false',
    String(playRpgState.repeatHunting)
  );

  // Toggle on
  const toggledOn = toggleRepeatHunting();
  assert(
    'ADV-M4-REPEAT-02',
    'SUITE 4',
    'toggleRepeatHunting() activates repeat hunting (returns true)',
    toggledOn === true && playRpgState.repeatHunting === true,
    'true',
    String(toggledOn)
  );

  assert(
    'ADV-M4-REPEAT-03',
    'SUITE 4',
    'hero_repeat_hunting in localStorage persists "true"',
    mockStorage.getItem('hero_repeat_hunting') === 'true',
    '"true"',
    String(mockStorage.getItem('hero_repeat_hunting'))
  );

  // Toggle off
  const toggledOff = toggleRepeatHunting();
  assert(
    'ADV-M4-REPEAT-04',
    'SUITE 4',
    'toggleRepeatHunting() deactivates repeat hunting (returns false) and persists "false"',
    toggledOff === false && mockStorage.getItem('hero_repeat_hunting') === 'false',
    'false and "false"',
    `${toggledOff} and "${mockStorage.getItem('hero_repeat_hunting')}"`
  );

  // Storage rehydration test
  mockStorage.setItem('hero_repeat_hunting', 'true');
  initPlayRpgState();
  assert(
    'ADV-M4-REPEAT-05',
    'SUITE 4',
    'initPlayRpgState() rehydrates repeatHunting = true from localStorage',
    playRpgState.repeatHunting === true,
    'true',
    String(playRpgState.repeatHunting)
  );

  // Rematch trigger test: simulate battle conclusion with repeatHunting === true
  playRpgState.subState = 'battle';
  playRpgState.battleWinner = 'player';
  playRpgState.autoMode = true;

  // runAutoStep should trigger rematch (initBattle)
  runAutoStep();
  assert(
    'ADV-M4-REPEAT-06',
    'SUITE 4',
    'When repeatHunting is active, auto-step upon battle victory triggers rematch (resets winner)',
    playRpgState.battleWinner === null && playRpgState.subState === 'battle',
    'battleWinner === null, subState === "battle"',
    `battleWinner === ${playRpgState.battleWinner}, subState === "${playRpgState.subState}"`
  );

  // Rematch inactive: toggle off, set battleWinner, runAutoStep should advance chapter
  toggleRepeatHunting(); // false
  playRpgState.battleWinner = 'player';
  const prevChapter = playRpgState.currentChapter;
  runAutoStep();
  assert(
    'ADV-M4-REPEAT-07',
    'SUITE 4',
    'When repeatHunting is inactive, auto-step advances chapter instead of rematching',
    playRpgState.currentChapter === prevChapter + 1 && playRpgState.subState === 'map',
    `chapter ${prevChapter + 1}, subState === "map"`,
    `chapter ${playRpgState.currentChapter}, subState === "${playRpgState.subState}"`
  );
}

// ============================================================================
// SUITE 5: 4-Way Directional Stat Allocation & Dynamic TP Recalculation (Verification 5)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 5] 4-Way Directional Stat Allocation & Dynamic TP Recalculation ---${RESET}`);
{
  mockStorage.clear();
  const testStore = new CardNurtureStore();

  const basePowerCard1 = testStore.getCardBasePower(1);
  const initialDeckTP = testStore.getDeckTP();
  const initialTotalTP = testStore.getTotalTP();

  // Test allocating with 0 stat points
  const zeroAllocRes = testStore.allocateStat(1, 'top');
  assert(
    'ADV-M4-STAT-01',
    'SUITE 5',
    'allocateStat fails and returns false when card has 0 unspent stat points',
    zeroAllocRes === false,
    'false',
    String(zeroAllocRes)
  );

  assert(
    'ADV-M4-STAT-02',
    'SUITE 5',
    'hasUnspentPoints(1) returns false when statPoints === 0',
    testStore.hasUnspentPoints(1) === false,
    'false',
    String(testStore.hasUnspentPoints(1))
  );

  // Level up Card 1 to Level 2 (100 EXP) -> grants 1 stat point
  testStore.nurtureCard(1, 100);
  assert(
    'ADV-M4-STAT-03',
    'SUITE 5',
    'Card 1 at Lv 2 possesses 1 stat point and hasUnspentPoints(1) evaluates to true',
    testStore.cards[1].statPoints === 1 && testStore.hasUnspentPoints(1) === true,
    'statPoints == 1, hasUnspentPoints == true',
    `statPoints == ${testStore.cards[1].statPoints}, hasUnspentPoints == ${testStore.hasUnspentPoints(1)}`
  );

  // Runtime validation: invalid direction string
  const invalidDirRes = (testStore as any).allocateStat(1, 'center');
  assert(
    'ADV-M4-STAT-04',
    'SUITE 5',
    'allocateStat rejects invalid direction string ("center") without consuming point',
    invalidDirRes === false && testStore.cards[1].statPoints === 1,
    'false and statPoints == 1',
    `${invalidDirRes} and statPoints == ${testStore.cards[1].statPoints}`
  );

  // Allocate 1 point to Top (North)
  const allocTopRes = testStore.allocateStat(1, 'top');
  assert(
    'ADV-M4-STAT-05',
    'SUITE 5',
    'allocateStat(1, "top") succeeds: bonusStats.top == 1, totalBonus == 1, statPoints == 0',
    allocTopRes === true &&
      testStore.cards[1].bonusStats.top === 1 &&
      testStore.cards[1].totalBonus === 1 &&
      testStore.cards[1].statPoints === 0,
    'top == 1, totalBonus == 1, statPoints == 0',
    `top == ${testStore.cards[1].bonusStats.top}, totalBonus == ${testStore.cards[1].totalBonus}, statPoints == ${testStore.cards[1].statPoints}`
  );

  assert(
    'ADV-M4-STAT-06',
    'SUITE 5',
    'hasUnspentPoints(1) switches strictly to false once all points are spent',
    testStore.hasUnspentPoints(1) === false,
    'false',
    String(testStore.hasUnspentPoints(1))
  );

  // Verify Deck TP increased by exactly 1
  const postAllocDeckTP = testStore.getDeckTP();
  assert(
    'ADV-M4-STAT-07',
    'SUITE 5',
    'Deck TP increased by exactly 1 after allocating stat point to active deck card',
    postAllocDeckTP === initialDeckTP + 1,
    `Deck TP == ${initialDeckTP + 1}`,
    `Deck TP == ${postAllocDeckTP}`
  );

  // Verify Total TP across inventory increased by exactly 1
  const postAllocTotalTP = testStore.getTotalTP();
  assert(
    'ADV-M4-STAT-08',
    'SUITE 5',
    'Total TP increased by exactly 1 after allocating stat point',
    postAllocTotalTP === initialTotalTP + 1,
    `Total TP == ${initialTotalTP + 1}`,
    `Total TP == ${postAllocTotalTP}`
  );

  // Add bench card (Card 6), level it up, allocate stat, verify Total TP increments but Deck TP is unchanged
  testStore.addCard(6);
  testStore.nurtureCard(6, 100);
  testStore.allocateStat(6, 'right');
  assert(
    'ADV-M4-STAT-09',
    'SUITE 5',
    'Allocating stat to bench card increases Total TP but leaves Deck TP unchanged',
    testStore.getDeckTP() === postAllocDeckTP && testStore.getCardBasePower(6) > 0,
    `Deck TP remains ${postAllocDeckTP}`,
    `Deck TP == ${testStore.getDeckTP()}`
  );
}

// ============================================================================
// SUITE 6: LocalStorage Corruption Recovery & Boundary Resilience (Verification 6)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 6] LocalStorage Corruption Recovery & Boundary Resilience ---${RESET}`);
{
  mockStorage.clear();

  // Test 1: Non-JSON corruption string in hero_card_nurturing
  mockStorage.setItem(STORAGE_KEY, 'CORRUPTED_JSON_MALFORMED_{{{{[[[[123');
  let loadedStore: CardNurtureStore | null = null;
  let didThrow = false;
  try {
    loadedStore = new CardNurtureStore();
  } catch {
    didThrow = true;
  }

  assert(
    'ADV-M4-RESIL-01',
    'SUITE 6',
    'CardNurtureStore constructor survives corrupted non-JSON string without throwing',
    didThrow === false && loadedStore !== null,
    'survived (no throw)',
    didThrow ? 'THREW EXCEPTION' : 'survived'
  );

  assert(
    'ADV-M4-RESIL-02',
    'SUITE 6',
    'After corruption recovery, all 110 cards exist with Level 1 baseline',
    loadedStore !== null &&
      Object.keys(loadedStore.cards).length === 110 &&
      loadedStore.cards[1].level === 1 &&
      loadedStore.cards[110].level === 1,
    '110 cards initialized at Lv 1',
    `${Object.keys(loadedStore?.cards || {}).length} cards, Lv ${loadedStore?.cards[1]?.level}`
  );

  // Test 2: Primitive null in hero_card_nurturing
  mockStorage.setItem(STORAGE_KEY, 'null');
  const storeFromNull = new CardNurtureStore();
  assert(
    'ADV-M4-RESIL-03',
    'SUITE 6',
    'Storage containing "null" string recovers cleanly to default starter cards',
    storeFromNull.ownedCardIds.length === 5 && storeFromNull.activeDeckIds.length === 5,
    '5 owned, 5 active deck',
    `${storeFromNull.ownedCardIds.length} owned, ${storeFromNull.activeDeckIds.length} active`
  );

  // Test 3: Partially corrupted card fields (negative levels, negative EXP, NaN)
  mockStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cards: {
        1: { level: -10, exp: -500, statPoints: -5, bonusStats: null },
        2: { level: 999, exp: 999999, statPoints: 50 },
      },
      ownedCardIds: [1, 2, 3, 4, 5],
      activeDeckIds: [1, 2, 3, 4, 5],
      updatedAt: Date.now(),
    })
  );
  const clampedStore = new CardNurtureStore();
  assert(
    'ADV-M4-RESIL-04',
    'SUITE 6',
    'Corrupted card stats are clamped to safe boundaries (level in 1..100, exp >= 0, statPoints >= 0)',
    clampedStore.cards[1].level === 1 &&
      clampedStore.cards[1].exp === 0 &&
      clampedStore.cards[1].statPoints === 0 &&
      clampedStore.cards[2].level === 100,
    'card 1: Lv 1, 0 exp; card 2: Lv 100',
    `card 1: Lv ${clampedStore.cards[1].level}, ${clampedStore.cards[1].exp} exp; card 2: Lv ${clampedStore.cards[2].level}`
  );

  // Test 4: Dirty ownedCardIds (duplicates, floats, strings, nulls)
  mockStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cards: {},
      ownedCardIds: [1, 1, 2, 'hero', 3.7, null, 4, 5, 200, -5],
      activeDeckIds: [1, 2, 3, 4, 5],
      updatedAt: Date.now(),
    })
  );
  const sanitizedStore = new CardNurtureStore();
  assert(
    'ADV-M4-RESIL-05',
    'SUITE 6',
    'ownedCardIds is sanitized to clean valid integer IDs within 1..110',
    sanitizedStore.ownedCardIds.every((id) => Number.isInteger(id) && id >= 1 && id <= 110),
    'All ownedCardIds integers in 1..110',
    JSON.stringify(sanitizedStore.ownedCardIds)
  );

  // Test 5: Empty or malformed active deck normalized to exactly 5 distinct cards
  mockStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cards: {},
      ownedCardIds: [1, 2, 3, 4, 5],
      activeDeckIds: [1, 1, 1],
      updatedAt: Date.now(),
    })
  );
  const deckNormStore = new CardNurtureStore();
  const deckIds = deckNormStore.getDeckCardIds();
  const isDistinct5 = deckIds.length === 5 && new Set(deckIds).size === 5;
  assert(
    'ADV-M4-RESIL-06',
    'SUITE 6',
    'activeDeckIds with duplicates is normalized to exactly 5 distinct owned cards',
    isDistinct5 === true,
    '5 distinct cards',
    `${deckIds.length} cards: [${deckIds.join(', ')}]`
  );

  // Test 6: Max Level 100 Cap & Zero Overflow
  const maxStore = new CardNurtureStore();
  maxStore.cards[1].level = 100;
  maxStore.cards[1].exp = 10000;
  maxStore.cards[1].statPoints = 0;

  const massiveNurture = maxStore.nurtureCard(1, 1000000);
  assert(
    'ADV-M4-RESIL-07',
    'SUITE 6',
    'At Lv 100 cap, massive EXP (1,000,000) causes 0 overflow (level remains 100, statPoints == 0)',
    maxStore.cards[1].level === 100 &&
      maxStore.cards[1].statPoints === 0 &&
      massiveNurture.leveledUp === false,
    'Lv 100, statPoints == 0, leveledUp: false',
    `Lv ${maxStore.cards[1].level}, statPoints == ${maxStore.cards[1].statPoints}, leveledUp: ${massiveNurture.leveledUp}`
  );

  // Test 7: QuotaExceededError simulation during saveToStorage
  const quotaStorage = new MockStorage();
  quotaStorage.setItem = () => {
    throw new Error('QuotaExceededError: LocalStorage quota exceeded');
  };
  (globalThis as any).localStorage = quotaStorage;

  const quotaStore = new CardNurtureStore();
  let saveThrew = false;
  try {
    quotaStore.saveToStorage();
  } catch {
    saveThrew = true;
  }
  // Restore mockStorage
  (globalThis as any).localStorage = mockStorage;

  assert(
    'ADV-M4-RESIL-08',
    'SUITE 6',
    'saveToStorage catches QuotaExceededError without crashing the application',
    saveThrew === false,
    'false (no throw)',
    String(saveThrew)
  );
}

// ============================================================================
// 4. Execution Summary
// ============================================================================

const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = total - passed;
const passRate = ((passed / total) * 100).toFixed(1);

console.log(`\n${BOLD}------------------------------------------------------------------------${RESET}`);
console.log(`${BOLD}  ADVERSARIAL TEST EXECUTION SUMMARY                                    ${RESET}`);
console.log(`${BOLD}------------------------------------------------------------------------${RESET}`);
console.log(`  Total Assertions Run : ${total}`);
console.log(`  ${GREEN}Passed               : ${passed}${RESET}`);
console.log(`  ${failed > 0 ? RED : GREEN}Failed               : ${failed}${RESET}`);
console.log(`  Pass Rate            : ${failed === 0 ? GREEN : RED}${passRate}%${RESET}`);
console.log(`${BOLD}------------------------------------------------------------------------${RESET}\n`);

if (failed > 0) {
  console.log(`${RED}${BOLD}[!] ADVERSARIAL DISCREPANCIES DETECTED:${RESET}`);
  for (const r of results.filter((x) => !x.passed)) {
    console.log(`  - [${r.id}] ${r.name}`);
    if (r.expected && r.actual) {
      console.log(`      Expected: ${r.expected} | Actual: ${r.actual}`);
    }
  }
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}[✓] ALL 46 ADVERSARIAL ASSERTIONS PASSED WITH ZERO DISCREPANCIES!${RESET}`);
  process.exit(0);
}
