/**
 * tests/challenger_m4_9_2_empirical_stress.ts
 *
 * INDEPENDENT EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — CHALLENGER M4.9.2
 * Milestone 4: Repeat Hunting Auto-Loop, Storage Corruption Resilience & Sanitization,
 * and Dual-Write Inventory Synchronization.
 *
 * Mission Objectives:
 * 1. Repeat Hunting Auto-Loop:
 *    - Verify setRepeatHunting(true/false) updates in-memory state and localStorage.getItem('hero_repeat_hunting').
 *    - Test toggle mechanics across page reload / fresh store instantiation.
 *    - Verify auto-rematch execution in playRpgEngine.ts and MobileCardPlayScreen.tsx:
 *      when active, rematch is scheduled after match completion; when inactive, no auto-rematch occurs.
 * 2. Storage Corruption Resilience & Sanitization:
 *    - Stress test cardNurtureStore.loadFromStorage() against:
 *      - Null, undefined, empty string in LocalStorage.
 *      - Malformed JSON string ("{invalid json...").
 *      - Injection of floats (3.7, 10.5), negative numbers, strings, objects into ownedCardIds and activeDeckIds.
 *      - Confirm all non-integers are filtered out and store recovers cleanly with valid defaults.
 * 3. Dual-Write Inventory Synchronization:
 *    - Verify addCard(cardId) correctly synchronizes newly acquired cards to hero_inventory in LocalStorage.
 *    - Verify quantity increments, season keys synchronization, and rejection of invalid/float IDs.
 *
 * Usage:
 *    npx tsx tests/challenger_m4_9_2_empirical_stress.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ============================================================================
// 1. Headless Browser Polyfills & Mock LocalStorage
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

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

const windowEventLog: { type: string; detail?: any }[] = [];

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#card' },
    dispatchEvent: (evt: any) => {
      windowEventLog.push({ type: evt.type, detail: evt.detail });
      return true;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

if (typeof (globalThis as any).Event === 'undefined') {
  (globalThis as any).Event = class Event {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  };
}

// ============================================================================
// 2. Production Code Imports
// ============================================================================

import {
  CardNurtureStore,
  cardNurtureStore,
  STORAGE_KEY,
  DECK_STORAGE_KEY,
  REPEAT_HUNTING_KEY,
} from '../src/landing/services/cardNurtureStore';
import {
  playRpgState,
  initPlayRpgState,
  toggleRepeatHunting,
  finishBattleAndAwardExp,
  initBattle,
  runAutoStep,
  advanceNextChapter,
} from '../src/landing/services/playRpgEngine';
import { CARD_DATABASE } from '../src/cardDatabase';

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
console.log(`${BOLD}  SNSHero CHALLENGER M4.9.2: REPEAT HUNTING & STORAGE STRESS HARNESS    ${RESET}`);
console.log(`${BOLD}========================================================================${RESET}\n`);

// ============================================================================
// SUITE 1: Repeat Hunting Toggle Mechanics & Store/LocalStorage Coherence
// ============================================================================
console.log(`${CYAN}--- [SUITE 1] Repeat Hunting Toggle Mechanics & State Coherence ---${RESET}`);
{
  mockStorage.clear();
  windowEventLog.length = 0;

  // 1.1 Fresh store default repeat hunting state
  const testStore = new CardNurtureStore();
  assert(
    'CHAL2-M4-REP-01',
    'SUITE 1',
    'Initial default repeat hunting state is inactive (false) in fresh store',
    testStore.isRepeatHuntingActive() === false &&
      mockStorage.getItem(REPEAT_HUNTING_KEY) === null,
    'isRepeatHuntingActive() === false and storage is null',
    `active: ${testStore.isRepeatHuntingActive()}, storage: ${mockStorage.getItem(REPEAT_HUNTING_KEY)}`
  );

  // 1.2 Enable repeat hunting via setRepeatHunting(true)
  windowEventLog.length = 0;
  testStore.setRepeatHunting(true);
  const eventDispatchedOn = windowEventLog.some(
    (e) => e.type === 'snshero_repeat_hunting_changed' && e.detail?.enabled === true
  );

  assert(
    'CHAL2-M4-REP-02',
    'SUITE 1',
    'setRepeatHunting(true) writes "true" to hero_repeat_hunting in localStorage',
    mockStorage.getItem(REPEAT_HUNTING_KEY) === 'true',
    '"true"',
    String(mockStorage.getItem(REPEAT_HUNTING_KEY))
  );

  assert(
    'CHAL2-M4-REP-03',
    'SUITE 1',
    'setRepeatHunting(true) activates isRepeatHuntingActive() and dispatches event',
    testStore.isRepeatHuntingActive() === true && eventDispatchedOn === true,
    'active: true, event dispatched: true',
    `active: ${testStore.isRepeatHuntingActive()}, event dispatched: ${eventDispatchedOn}`
  );

  // 1.3 Disable repeat hunting via setRepeatHunting(false)
  windowEventLog.length = 0;
  testStore.setRepeatHunting(false);
  const eventDispatchedOff = windowEventLog.some(
    (e) => e.type === 'snshero_repeat_hunting_changed' && e.detail?.enabled === false
  );

  assert(
    'CHAL2-M4-REP-04',
    'SUITE 1',
    'setRepeatHunting(false) writes "false" to hero_repeat_hunting in localStorage',
    mockStorage.getItem(REPEAT_HUNTING_KEY) === 'false',
    '"false"',
    String(mockStorage.getItem(REPEAT_HUNTING_KEY))
  );

  assert(
    'CHAL2-M4-REP-05',
    'SUITE 1',
    'setRepeatHunting(false) deactivates isRepeatHuntingActive() and dispatches event',
    testStore.isRepeatHuntingActive() === false && eventDispatchedOff === true,
    'active: false, event dispatched: true',
    `active: ${testStore.isRepeatHuntingActive()}, event dispatched: ${eventDispatchedOff}`
  );

  // 1.4 State rehydration on simulated page reload / fresh store creation (Active state)
  mockStorage.setItem(REPEAT_HUNTING_KEY, 'true');
  const reloadedStoreActive = new CardNurtureStore();
  assert(
    'CHAL2-M4-REP-06',
    'SUITE 1',
    'Fresh store instantiation rehydrates active repeat hunting from localStorage "true"',
    reloadedStoreActive.isRepeatHuntingActive() === true,
    'true',
    String(reloadedStoreActive.isRepeatHuntingActive())
  );

  // 1.5 State rehydration on simulated page reload (Inactive state)
  mockStorage.setItem(REPEAT_HUNTING_KEY, 'false');
  const reloadedStoreInactive = new CardNurtureStore();
  assert(
    'CHAL2-M4-REP-07',
    'SUITE 1',
    'Fresh store instantiation rehydrates inactive repeat hunting from localStorage "false"',
    reloadedStoreInactive.isRepeatHuntingActive() === false,
    'false',
    String(reloadedStoreInactive.isRepeatHuntingActive())
  );

  // 1.6 playRpgEngine toggle mechanics and storage coherence
  mockStorage.clear();
  initPlayRpgState();

  assert(
    'CHAL2-M4-REP-08',
    'SUITE 1',
    'initPlayRpgState() starts with repeatHunting = false when storage is empty',
    playRpgState.repeatHunting === false,
    'false',
    String(playRpgState.repeatHunting)
  );

  const rpgToggledOn = toggleRepeatHunting();
  assert(
    'CHAL2-M4-REP-09',
    'SUITE 1',
    'toggleRepeatHunting() flips in-memory playRpgState.repeatHunting to true and syncs localStorage',
    rpgToggledOn === true &&
      playRpgState.repeatHunting === true &&
      mockStorage.getItem(REPEAT_HUNTING_KEY) === 'true',
    'true in memory and "true" in storage',
    `memory: ${playRpgState.repeatHunting}, storage: ${mockStorage.getItem(REPEAT_HUNTING_KEY)}`
  );

  const rpgToggledOff = toggleRepeatHunting();
  assert(
    'CHAL2-M4-REP-10',
    'SUITE 1',
    'toggleRepeatHunting() flips in-memory playRpgState.repeatHunting to false and syncs localStorage',
    rpgToggledOff === false &&
      playRpgState.repeatHunting === false &&
      mockStorage.getItem(REPEAT_HUNTING_KEY) === 'false',
    'false in memory and "false" in storage',
    `memory: ${playRpgState.repeatHunting}, storage: ${mockStorage.getItem(REPEAT_HUNTING_KEY)}`
  );

  // 1.7 playRpgState rehydration across simulated reload
  mockStorage.setItem(REPEAT_HUNTING_KEY, 'true');
  initPlayRpgState();
  assert(
    'CHAL2-M4-REP-11',
    'SUITE 1',
    'initPlayRpgState() rehydrates playRpgState.repeatHunting = true from localStorage',
    playRpgState.repeatHunting === true,
    'true',
    String(playRpgState.repeatHunting)
  );
}

// ============================================================================
// SUITE 2: Auto-Rematch Execution Verification (playRpgEngine & MobileCardPlayScreen)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 2] Auto-Rematch Execution in Battle Engines ---${RESET}`);
{
  mockStorage.clear();
  initPlayRpgState();

  // 2.1 playRpgEngine: Active repeat hunting triggers rematch (initBattle) on auto-runner
  playRpgState.autoMode = true;
  playRpgState.repeatHunting = true;
  playRpgState.subState = 'battle';
  playRpgState.battleWinner = 'player';
  const chapterBeforeRematch = playRpgState.currentChapter;

  runAutoStep();

  assert(
    'CHAL2-M4-LOOP-01',
    'SUITE 2',
    'When repeatHunting is active, runAutoStep() on completed battle triggers initBattle (resets battleWinner)',
    playRpgState.battleWinner === null &&
      playRpgState.subState === 'battle' &&
      playRpgState.currentChapter === chapterBeforeRematch,
    'battleWinner === null, subState === "battle", currentChapter unchanged',
    `battleWinner: ${playRpgState.battleWinner}, subState: ${playRpgState.subState}, chapter: ${playRpgState.currentChapter}`
  );

  // 2.2 playRpgEngine: Inactive repeat hunting advances to next chapter on auto-runner
  playRpgState.repeatHunting = false;
  playRpgState.battleWinner = 'player';
  const chapterBeforeAdvance = playRpgState.currentChapter;

  runAutoStep();

  assert(
    'CHAL2-M4-LOOP-02',
    'SUITE 2',
    'When repeatHunting is inactive, runAutoStep() on completed battle advances chapter (does NOT rematch)',
    playRpgState.currentChapter === chapterBeforeAdvance + 1 &&
      playRpgState.subState === 'map',
    `chapter: ${chapterBeforeAdvance + 1}, subState: "map"`,
    `chapter: ${playRpgState.currentChapter}, subState: ${playRpgState.subState}`
  );

  // 2.3 playRpgEngine: Defeat with repeatHunting schedules rematch
  playRpgState.subState = 'battle';
  playRpgState.repeatHunting = true;
  playRpgState.battleWinner = 'opponent';
  const chapterDefeat = playRpgState.currentChapter;

  runAutoStep();

  assert(
    'CHAL2-M4-LOOP-03',
    'SUITE 2',
    'When repeatHunting is active, defeat (opponent win) also triggers rematch without chapter skip',
    playRpgState.battleWinner === null &&
      playRpgState.subState === 'battle' &&
      playRpgState.currentChapter === chapterDefeat,
    'battleWinner === null, subState === "battle"',
    `battleWinner: ${playRpgState.battleWinner}, subState: ${playRpgState.subState}`
  );

  // 2.4 MobileCardPlayScreen.tsx Static & Contract Verification
  const mobileCardPlayPath = path.resolve(REPO_ROOT, 'src/views/MobileCardPlayScreen.tsx');
  const mobileCardPlaySource = fs.existsSync(mobileCardPlayPath)
    ? fs.readFileSync(mobileCardPlayPath, 'utf8')
    : '';

  assert(
    'CHAL2-M4-LOOP-04',
    'SUITE 2',
    'MobileCardPlayScreen.tsx reads initial repeat hunting state from hero_repeat_hunting',
    mobileCardPlaySource.includes("localStorage.getItem('hero_repeat_hunting') === 'true'"),
    'true',
    String(mobileCardPlaySource.includes("localStorage.getItem('hero_repeat_hunting') === 'true'"))
  );

  assert(
    'CHAL2-M4-LOOP-05',
    'SUITE 2',
    'MobileCardPlayScreen.tsx contains dedicated repeat hunting auto-rematch useEffect hook',
    mobileCardPlaySource.includes('Repeat Hunting Auto-Rematch Hook') &&
      mobileCardPlaySource.includes('initMatchDecks') &&
      mobileCardPlaySource.includes('isRepeatHunting'),
    'true',
    'Verified presence of Repeat Hunting Auto-Rematch Hook with initMatchDecks'
  );

  assert(
    'CHAL2-M4-LOOP-06',
    'SUITE 2',
    'MobileCardPlayScreen.tsx auto-rematch hook explicitly checks (!gameOver || !winner || !isRepeatHunting)',
    mobileCardPlaySource.includes('if (!gameOver || !winner || !isRepeatHunting) return;'),
    'true',
    'Verified guard clause prevents rematch when repeat hunting is inactive'
  );

  assert(
    'CHAL2-M4-LOOP-07',
    'SUITE 2',
    'MobileCardPlayScreen.tsx renders [🔁 반복 사냥] toggle button on battle completion overlay',
    mobileCardPlaySource.includes('반복 사냥 [') &&
      mobileCardPlaySource.includes('cardNurtureStore.setRepeatHunting(nextState)'),
    'true',
    'Verified interactive button and dual-write to cardNurtureStore'
  );

  assert(
    'CHAL2-M4-LOOP-08',
    'SUITE 2',
    'MobileCardPlayScreen.tsx suppresses autoCloseOnComplete when repeat hunting is active',
    mobileCardPlaySource.includes('if (autoCloseOnComplete && !isRepeatHunting)'),
    'true',
    'Verified autoCloseOnComplete is guarded by !isRepeatHunting'
  );
}

// ============================================================================
// SUITE 3: Storage Corruption Resilience & Strict Sanitization
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 3] Storage Corruption Resilience & Strict Sanitization ---${RESET}`);
{
  mockStorage.clear();

  // 3.1 Null, undefined, empty string in LocalStorage
  mockStorage.setItem(STORAGE_KEY, '');
  const emptyStringStore = new CardNurtureStore();
  assert(
    'CHAL2-M4-STRESS-01',
    'SUITE 3',
    'Empty string in hero_card_nurturing recovers cleanly to 5 starter cards [1..5]',
    emptyStringStore.ownedCardIds.length === 5 &&
      [1, 2, 3, 4, 5].every((id) => emptyStringStore.ownedCardIds.includes(id)),
    '[1, 2, 3, 4, 5]',
    JSON.stringify(emptyStringStore.ownedCardIds)
  );

  mockStorage.setItem(STORAGE_KEY, 'null');
  const nullStringStore = new CardNurtureStore();
  assert(
    'CHAL2-M4-STRESS-02',
    'SUITE 3',
    'Literal "null" string recovers cleanly without crash or mutation of starter cards',
    nullStringStore.ownedCardIds.length === 5 &&
      nullStringStore.activeDeckIds.length === 5 &&
      nullStringStore.cards[1].level === 1,
    '5 owned, 5 active deck, Lv 1',
    `${nullStringStore.ownedCardIds.length} owned, ${nullStringStore.activeDeckIds.length} active`
  );

  mockStorage.setItem(STORAGE_KEY, 'undefined');
  const undefStringStore = new CardNurtureStore();
  assert(
    'CHAL2-M4-STRESS-03',
    'SUITE 3',
    'Literal "undefined" string is caught by JSON syntax error and recovers with default cards',
    undefStringStore.ownedCardIds.length === 5 &&
      undefStringStore.cards[1].level === 1,
    '5 owned, Lv 1',
    `${undefStringStore.ownedCardIds.length} owned, Lv ${undefStringStore.cards[1].level}`
  );

  // 3.2 Malformed JSON strings
  const malformedInputs = [
    '{malformed json...',
    '{"cards": {1: "broken"}}',
    '[[[invalid json array',
    '{"ownedCardIds": [1, 2, ',
    '{"activeDeckIds": null, "cards": undefined}',
  ];

  let malformedHandled = true;
  for (const malformed of malformedInputs) {
    mockStorage.setItem(STORAGE_KEY, malformed);
    try {
      const s = new CardNurtureStore();
      if (s.ownedCardIds.length !== 5 || s.activeDeckIds.length !== 5) {
        malformedHandled = false;
      }
    } catch {
      malformedHandled = false;
    }
  }

  assert(
    'CHAL2-M4-STRESS-04',
    'SUITE 3',
    'Malformed/truncated JSON strings survive 100% without unhandled exceptions and reset safely',
    malformedHandled === true,
    'true (all 5 malformed patterns survived cleanly)',
    String(malformedHandled)
  );

  // 3.3 Float and non-integer injection into ownedCardIds
  mockStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cards: {},
      ownedCardIds: [
        1,
        2,
        3.7,        // Float
        10.5,       // Float
        -3,         // Negative integer
        -99,        // Negative integer
        'card_9',   // String
        '5',        // String number
        null,       // Null
        undefined,  // Undefined
        {},         // Object
        [],         // Array
        NaN,        // NaN (serialized to null in JSON)
        Infinity,   // Infinity (serialized to null in JSON)
        4,
        5,
        111,        // Out of bounds (> 110)
        0,          // Out of bounds (< 1)
        25,         // Valid integer
        50,         // Valid integer
      ],
      activeDeckIds: [1, 2, 4, 5, 25],
      updatedAt: Date.now(),
    })
  );

  const floatSanitizedStore = new CardNurtureStore();

  const hasFloats = floatSanitizedStore.ownedCardIds.some((id) => !Number.isInteger(id));
  const hasNegatives = floatSanitizedStore.ownedCardIds.some((id) => id < 1);
  const hasOutOfBounds = floatSanitizedStore.ownedCardIds.some((id) => id > 110);
  const hasStringsOrObjects = floatSanitizedStore.ownedCardIds.some((id) => typeof id !== 'number');

  assert(
    'CHAL2-M4-STRESS-05',
    'SUITE 3',
    'ownedCardIds strictly filters out all floats (3.7, 10.5)',
    hasFloats === false,
    'false (no floats)',
    `hasFloats: ${hasFloats}`
  );

  assert(
    'CHAL2-M4-STRESS-06',
    'SUITE 3',
    'ownedCardIds strictly filters out negative numbers (-3, -99, 0) and out-of-bounds (>110)',
    hasNegatives === false && hasOutOfBounds === false,
    'false (no negatives or >110)',
    `negatives: ${hasNegatives}, outOfBounds: ${hasOutOfBounds}`
  );

  assert(
    'CHAL2-M4-STRESS-07',
    'SUITE 3',
    'ownedCardIds strictly filters out strings ("card_9", "5"), objects, and nulls',
    hasStringsOrObjects === false,
    'false (strictly numbers only)',
    `hasStringsOrObjects: ${hasStringsOrObjects}`
  );

  assert(
    'CHAL2-M4-STRESS-08',
    'SUITE 3',
    'ownedCardIds contains strictly sorted valid integers [1, 2, 4, 5, 25, 50]',
    JSON.stringify(floatSanitizedStore.ownedCardIds) === JSON.stringify([1, 2, 4, 5, 25, 50]),
    '[1, 2, 4, 5, 25, 50]',
    JSON.stringify(floatSanitizedStore.ownedCardIds)
  );

  // 3.4 Float and dirty injection into activeDeckIds
  mockStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cards: {},
      ownedCardIds: [1, 2, 3, 4, 5, 6, 7],
      activeDeckIds: [1, 3.14159, 'two', { id: 3 }, -5, 2, 3, 4, 5],
      updatedAt: Date.now(),
    })
  );

  const deckSanitizedStore = new CardNurtureStore();
  const sanitizedDeck = deckSanitizedStore.getDeckCardIds();

  assert(
    'CHAL2-M4-STRESS-09',
    'SUITE 3',
    'activeDeckIds sanitizes all non-integers and normalizes to exactly 5 distinct owned cards',
    sanitizedDeck.length === 5 &&
      new Set(sanitizedDeck).size === 5 &&
      sanitizedDeck.every((id) => Number.isInteger(id) && id >= 1 && id <= 110 && deckSanitizedStore.isCardOwned(id)),
    '5 distinct valid owned integer IDs',
    `Deck: [${sanitizedDeck.join(', ')}]`
  );

  // 3.5 Total corruption: zero valid cards in ownedCardIds
  mockStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cards: {},
      ownedCardIds: [3.7, 9.9, 'bad', -10, NaN, null, {}],
      activeDeckIds: [3.7, 'bad'],
      updatedAt: Date.now(),
    })
  );

  const totalCorruptionStore = new CardNurtureStore();
  assert(
    'CHAL2-M4-STRESS-10',
    'SUITE 3',
    'When ownedCardIds has zero valid IDs, store cleanly recovers default starter cards [1, 2, 3, 4, 5]',
    totalCorruptionStore.ownedCardIds.length === 5 &&
      [1, 2, 3, 4, 5].every((id) => totalCorruptionStore.ownedCardIds.includes(id)) &&
      totalCorruptionStore.activeDeckIds.length === 5,
    '[1, 2, 3, 4, 5]',
    JSON.stringify(totalCorruptionStore.ownedCardIds)
  );
}

// ============================================================================
// SUITE 4: Dual-Write Inventory Synchronization (hero_inventory & hero_card_nurturing)
// ============================================================================
console.log(`\n${CYAN}--- [SUITE 4] Dual-Write Inventory Synchronization ---${RESET}`);
{
  mockStorage.clear();
  const testStore = new CardNurtureStore();

  // 4.1 Initial baseline check
  assert(
    'CHAL2-M4-SYNC-01',
    'SUITE 4',
    'Initially Card 42 is unowned in store and absent from hero_inventory',
    testStore.isCardOwned(42) === false,
    'false',
    String(testStore.isCardOwned(42))
  );

  // 4.2 Execute addCard(42)
  const addResult = testStore.addCard(42);

  assert(
    'CHAL2-M4-SYNC-02',
    'SUITE 4',
    'addCard(42) returns true indicating new card acquisition',
    addResult === true,
    'true',
    String(addResult)
  );

  assert(
    'CHAL2-M4-SYNC-03',
    'SUITE 4',
    'Card 42 is now registered as owned in cardNurtureStore',
    testStore.isCardOwned(42) === true && testStore.ownedCardIds.includes(42),
    'true',
    `isCardOwned: ${testStore.isCardOwned(42)}`
  );

  // 4.3 Inspect hero_inventory in LocalStorage
  const rawInventory = mockStorage.getItem('hero_inventory');
  let parsedInventory: Record<string, any> = {};
  try {
    parsedInventory = JSON.parse(rawInventory || '{}');
  } catch {}

  assert(
    'CHAL2-M4-SYNC-04',
    'SUITE 4',
    'addCard(42) dual-writes Card 42 into hero_inventory with quantity 1 and matching rarity',
    parsedInventory['42']?.id === 42 &&
      parsedInventory['42']?.cardIndex === 42 &&
      parsedInventory['42']?.quantity === 1 &&
      parsedInventory['42']?.rarity === CARD_DATABASE[42]?.rarity,
    `id: 42, quantity: 1, rarity: ${CARD_DATABASE[42]?.rarity}`,
    `id: ${parsedInventory['42']?.id}, quantity: ${parsedInventory['42']?.quantity}, rarity: ${parsedInventory['42']?.rarity}`
  );

  // 4.4 Inspect season keys in LocalStorage
  const rawSeasonInv = mockStorage.getItem('hero_inventory_season1');
  let parsedSeasonInv: Record<string, any> = {};
  try {
    parsedSeasonInv = JSON.parse(rawSeasonInv || '{}');
  } catch {}

  assert(
    'CHAL2-M4-SYNC-05',
    'SUITE 4',
    'addCard(42) dual-writes synchronously to hero_inventory_season1',
    parsedSeasonInv['42']?.id === 42 && parsedSeasonInv['42']?.quantity === 1,
    'id: 42, quantity: 1',
    `id: ${parsedSeasonInv['42']?.id}, quantity: ${parsedSeasonInv['42']?.quantity}`
  );

  // 4.5 Inspect hero_card_nurturing payload in LocalStorage
  const rawNurturePayload = mockStorage.getItem(STORAGE_KEY);
  let parsedNurturePayload: any = {};
  try {
    parsedNurturePayload = JSON.parse(rawNurturePayload || '{}');
  } catch {}

  assert(
    'CHAL2-M4-SYNC-06',
    'SUITE 4',
    'hero_card_nurturing in localStorage includes Card 42 in ownedCardIds',
    Array.isArray(parsedNurturePayload?.ownedCardIds) &&
      parsedNurturePayload.ownedCardIds.includes(42),
    'ownedCardIds contains 42',
    `ownedCardIds: ${JSON.stringify(parsedNurturePayload?.ownedCardIds)}`
  );

  // 4.6 Adding duplicate card (Card 42 again): increments quantity, returns false
  const duplicateAddResult = testStore.addCard(42);
  const rawInventoryDup = mockStorage.getItem('hero_inventory');
  let parsedInventoryDup: Record<string, any> = {};
  try {
    parsedInventoryDup = JSON.parse(rawInventoryDup || '{}');
  } catch {}

  assert(
    'CHAL2-M4-SYNC-07',
    'SUITE 4',
    'addCard(42) on existing card returns false and increments hero_inventory quantity to 2',
    duplicateAddResult === false && parsedInventoryDup['42']?.quantity === 2,
    'duplicateAdd: false, quantity: 2',
    `duplicateAdd: ${duplicateAddResult}, quantity: ${parsedInventoryDup['42']?.quantity}`
  );

  assert(
    'CHAL2-M4-SYNC-08',
    'SUITE 4',
    'ownedCardIds in store and storage does NOT introduce duplicate 42 IDs',
    testStore.ownedCardIds.filter((id) => id === 42).length === 1 &&
      new Set(testStore.ownedCardIds).size === testStore.ownedCardIds.length,
    'strictly 1 occurrence of ID 42',
    `occurrences: ${testStore.ownedCardIds.filter((id) => id === 42).length}`
  );

  // 4.7 Reject invalid inputs to addCard without corrupting storage
  const invalidCardResults = [
    testStore.addCard(-1),
    testStore.addCard(0),
    testStore.addCard(111),
    testStore.addCard(3.7 as any),
    testStore.addCard('5' as any),
    testStore.addCard(NaN as any),
    testStore.addCard(null as any),
  ];

  assert(
    'CHAL2-M4-SYNC-09',
    'SUITE 4',
    'addCard strictly rejects invalid IDs (-1, 0, 111, floats, strings, NaN, null)',
    invalidCardResults.every((r) => r === false),
    'all false',
    `results: [${invalidCardResults.join(', ')}]`
  );

  // 4.8 Storage reload round-trip preserves synchronized cards
  const reloadedStore = new CardNurtureStore();
  assert(
    'CHAL2-M4-SYNC-10',
    'SUITE 4',
    'Fresh CardNurtureStore instantiated after addCard(42) retains Card 42 ownership',
    reloadedStore.isCardOwned(42) === true &&
      reloadedStore.ownedCardIds.includes(42),
    'true',
    `isCardOwned(42): ${reloadedStore.isCardOwned(42)}`
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
console.log(`${BOLD}  CHALLENGER M4.9.2 ADVERSARIAL STRESS TEST SUMMARY                     ${RESET}`);
console.log(`${BOLD}------------------------------------------------------------------------${RESET}`);
console.log(`  Total Assertions Run : ${total}`);
console.log(`  ${GREEN}Passed               : ${passed}${RESET}`);
console.log(`  ${failed > 0 ? RED : GREEN}Failed               : ${failed}${RESET}`);
console.log(`  Pass Rate            : ${failed === 0 ? GREEN : RED}${passRate}%${RESET}`);
console.log(`${BOLD}------------------------------------------------------------------------${RESET}\n`);

if (failed > 0) {
  console.log(`${RED}${BOLD}[!] CHALLENGER STRESS DISCREPANCIES DETECTED:${RESET}`);
  for (const r of results.filter((x) => !x.passed)) {
    console.log(`  - [${r.id}] ${r.name}`);
    if (r.expected && r.actual) {
      console.log(`      Expected: ${r.expected} | Actual: ${r.actual}`);
    }
  }
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}[✓] ALL ${total} ADVERSARIAL STRESS ASSERTIONS PASSED WITH ZERO DISCREPANCIES!${RESET}`);
  process.exit(0);
}
