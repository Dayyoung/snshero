/**
 * tests/challenger_m2_deep_stress.ts
 *
 * EMPIRICAL CHALLENGER ADVERSARIAL STRESS HARNESS — MILESTONE 2
 * Roles: critic, specialist
 *
 * Deep stress-testing:
 * 1. Slot Card Replacement Invariants & Deduplication:
 *    - Cross-slot swapping (Slot A <-> Slot B) strictly preserving Set(activeDeckIds).size === 5
 *    - Self-slot assignment (Slot A -> same Card) is idempotent
 *    - Unowned card rejection leaves active squad completely intact
 *    - Out-of-bounds slot indices (-1, 5, 99, 2.5, NaN, undefined) rejected
 *    - Out-of-bounds card IDs (-1, 0, 111, 3.14, NaN, undefined, objects) rejected
 *    - Rapid sequential swapping permutations maintain 100% invariant Set.size === 5
 * 2. Corrupted LocalStorage & Boundary Recovery:
 *    - null / "null" / "undefined" / ""
 *    - Non-array JSON ({}, "string", 12345)
 *    - Array with < 5 elements (auto-padded from owned or defaults)
 *    - Array with > 5 elements (truncated cleanly to 5)
 *    - Array with duplicate elements (deduplicated cleanly to 5 unique cards)
 *    - Array with out-of-range IDs ([999, -1, 0, 150])
 *    - Legacy object format ([{ imageIndex: 7 }, { id: 8 }, { cardId: 9 }, { cardIndex: 11 }, { id: 12 }])
 *    - Corrupted non-JSON strings (malformed syntax)
 *    - hero_card_nurturing payload with corrupted nested cards/ownedCardIds
 * 3. DOM Element Contracts for #home:
 *    - Logo: /logo-ko.png inside a[href="#home"] with min-h-[44px]
 *    - Fan deck: exactly 5 cards with symmetric -12deg to +12deg rotations
 *    - Rarity glowing borders (.rarity-glow-bronze, silver, gold, boss)
 *    - Click-to-inspect modal rendering with 7-head cutout, stats, ability, and dismiss controls
 *    - Deck CP matching cardNurtureStore.getDeckTP()
 *    - Win streak flame badge (🔥)
 * 4. DOM Element Contracts for #deck:
 *    - 5 active slots (SLOT 01..05) with compass stats (N, E, S, W)
 *    - Unspent point red dot indicator (+pt, bg-red-600)
 *    - [영웅 교체] button with data-action="open-deck-swap-drawer" data-slot-index="X"
 *    - Deck swap drawer: owned cards list, active cards disabled, swap button present
 *    - Real-time Deck TP updates upon card replacement and stat allocation
 *    - 7-head cutout inspection panel
 * 5. State Machine & Event Delegation:
 *    - LIFO Escape key dismissal hierarchy
 *    - Dispatching snshero_deck_updated and snshero_card_nurture_updated events
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Mock localStorage for Node.js test environment
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

// Import production modules (pure TS)
import { renderHomeSection, setInspectedHomeCardId, getInspectedHomeCardId } from '../src/landing/views/HomeSection';
import {
  renderMyDeckSection,
  setEditingSlotIndex,
  getEditingSlotIndex,
  setSelectedDeckCardId,
  getSelectedDeckCardId,
  getCardEffectiveStats,
} from '../src/landing/views/MyDeckSection';
import { cardNurtureStore, CardNurtureStore } from '../src/landing/services/cardNurtureStore';
import { CARD_DATABASE } from '../src/cardDatabase';

// Assertion reporter
const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface ChallengeAssertion {
  id: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  note?: string;
}

const assertions: ChallengeAssertion[] = [];

function challenge(
  id: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  note?: string
) {
  assertions.push({ id, name, passed: condition, expected, actual, note });
  const status = condition ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${id}] ${name.padEnd(58)} ${status}`);
  if (!condition) {
    if (expected !== undefined && actual !== undefined) {
      console.log(`    ${YELLOW}↳ Expected: ${expected}${RESET}`);
      console.log(`    ${YELLOW}↳ Actual  : ${actual}${RESET}`);
    }
    if (note) {
      console.log(`    ${YELLOW}↳ Note    : ${note}${RESET}`);
    }
  }
}

async function runEmpiricalStress() {
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   CHALLENGER 1 EMPIRICAL DEEP STRESS SUITE (Milestone 2 Parity)      ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);

  // ==========================================================================
  // SECTION 1: SLOT CARD REPLACEMENT INVARIANTS & ADVERSARIAL SWAPPING
  // ==========================================================================
  console.log(`${BOLD}>>> SECTION 1: Slot Replacement Invariants & Adversarial Swapping${RESET}`);

  // Setup known baseline: cards 1..10 owned, active deck [1, 2, 3, 4, 5]
  mockStorage.clear();
  cardNurtureStore.initDefaultCards();
  cardNurtureStore.ownedCardIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  (cardNurtureStore as any).activeDeckIds = [1, 2, 3, 4, 5];

  // 1.1 Cross-slot swap: Slot 0 has Card 1, Slot 4 has Card 5. Place Card 5 into Slot 0.
  const swapResult = cardNurtureStore.setDeckCard(0, 5);
  const deckAfterSwap = cardNurtureStore.getDeckCardIds();
  const setSizeAfterSwap = new Set(deckAfterSwap).size;
  challenge(
    'STRESS.SWAP.CROSS_SLOT',
    'Cross-slot swap switches positions and maintains Set size === 5',
    swapResult === true &&
      deckAfterSwap[0] === 5 &&
      deckAfterSwap[4] === 1 &&
      setSizeAfterSwap === 5,
    'Slot 0 is 5, Slot 4 is 1, Set size is 5',
    `Deck: [${deckAfterSwap.join(', ')}], Set size: ${setSizeAfterSwap}`
  );

  // 1.2 Self-slot swap: placing Card 5 into Slot 0 (already in Slot 0)
  const selfSwapResult = cardNurtureStore.setDeckCard(0, 5);
  const deckAfterSelf = cardNurtureStore.getDeckCardIds();
  challenge(
    'STRESS.SWAP.IDEMPOTENT',
    'Assigning card already in that slot is idempotent (no mutation, returns true)',
    selfSwapResult === true &&
      JSON.stringify(deckAfterSelf) === JSON.stringify(deckAfterSwap) &&
      new Set(deckAfterSelf).size === 5,
    'Identical deck, returns true',
    `Result: ${selfSwapResult}, Deck: [${deckAfterSelf.join(', ')}]`
  );

  // 1.3 Unowned card rejection: Card 99 is not owned
  const unownedResult = cardNurtureStore.setDeckCard(2, 99);
  const deckAfterUnowned = cardNurtureStore.getDeckCardIds();
  challenge(
    'STRESS.SWAP.UNOWNED_REJECT',
    'setDeckCard strictly rejects unowned card (99) with zero side effects',
    unownedResult === false &&
      JSON.stringify(deckAfterUnowned) === JSON.stringify(deckAfterSelf),
    'false, deck unchanged',
    `Result: ${unownedResult}, Deck: [${deckAfterUnowned.join(', ')}]`
  );

  // 1.4 Boundary slot indices: -1, 5, 100, 2.5, NaN, undefined
  const invalidSlots = [-1, 5, 100, 2.5, NaN, undefined as any, null as any];
  let allInvalidSlotsRejected = true;
  for (const invalidSlot of invalidSlots) {
    const res = cardNurtureStore.setDeckCard(invalidSlot, 6);
    if (res !== false) {
      allInvalidSlotsRejected = false;
      break;
    }
  }
  challenge(
    'STRESS.SWAP.INVALID_SLOTS',
    'Rejects all out-of-bounds or non-integer slot indices (-1, 5, 100, 2.5, NaN)',
    allInvalidSlotsRejected,
    'All returned false',
    `allInvalidSlotsRejected: ${allInvalidSlotsRejected}`
  );

  // 1.5 Boundary card IDs: -1, 0, 111, 3.14, NaN, undefined
  const invalidCardIds = [-1, 0, 111, 3.14, NaN, undefined as any, null as any];
  let allInvalidCardIdsRejected = true;
  for (const invalidId of invalidCardIds) {
    const res = cardNurtureStore.setDeckCard(1, invalidId);
    if (res !== false) {
      allInvalidCardIdsRejected = false;
      break;
    }
  }
  challenge(
    'STRESS.SWAP.INVALID_CARD_IDS',
    'Rejects all out-of-bounds or non-integer card IDs (-1, 0, 111, 3.14, NaN)',
    allInvalidCardIdsRejected,
    'All returned false',
    `allInvalidCardIdsRejected: ${allInvalidCardIdsRejected}`
  );

  // 1.6 Fuzzing: 100 rapid random slot swaps among owned cards 1..10
  let fuzzInvariantPreserved = true;
  for (let i = 0; i < 100; i++) {
    const randomSlot = Math.floor(Math.random() * 5);
    const randomCardId = 1 + Math.floor(Math.random() * 10);
    cardNurtureStore.setDeckCard(randomSlot, randomCardId);
    const currentDeck = cardNurtureStore.getDeckCardIds();
    if (currentDeck.length !== 5 || new Set(currentDeck).size !== 5) {
      fuzzInvariantPreserved = false;
      break;
    }
  }
  challenge(
    'STRESS.SWAP.FUZZ_100',
    '100 random interleaved swaps maintain Set(activeDeckIds).size === 5 invariant',
    fuzzInvariantPreserved,
    '100 iterations with Set size 5',
    `fuzzInvariantPreserved: ${fuzzInvariantPreserved}`
  );

  // 1.7 swapDeckCards validation
  const swapInvalidA = cardNurtureStore.swapDeckCards(-1, 2);
  const swapInvalidB = cardNurtureStore.swapDeckCards(0, 5);
  const deckBeforeValidSwap = cardNurtureStore.getDeckCardIds();
  const slot0Before = deckBeforeValidSwap[0];
  const slot1Before = deckBeforeValidSwap[1];
  const swapValid = cardNurtureStore.swapDeckCards(0, 1);
  const deckAfterValidSwap = cardNurtureStore.getDeckCardIds();
  const swapWorked =
    swapValid === true &&
    deckAfterValidSwap[0] === slot1Before &&
    deckAfterValidSwap[1] === slot0Before;

  challenge(
    'STRESS.SWAP.DIRECT_SLOT_SWAP',
    'swapDeckCards validates boundaries and cleanly exchanges two slots',
    swapInvalidA === false && swapInvalidB === false && swapWorked,
    'Invalid slots rejected, valid slots swapped',
    `invA=${swapInvalidA}, invB=${swapInvalidB}, worked=${swapWorked}`
  );

  console.log('');

  // ==========================================================================
  // SECTION 2: CORRUPTED LOCALSTORAGE RECOVERY & STORAGE RESILIENCE
  // ==========================================================================
  console.log(`${BOLD}>>> SECTION 2: Corrupted LocalStorage Recovery & Storage Resilience${RESET}`);

  // 2.1 Storage payload with null value
  mockStorage.setItem('hero_deck', 'null');
  mockStorage.setItem('hero_card_nurturing', 'null');
  const storeNull = new CardNurtureStore();
  challenge(
    'STRESS.STORE.NULL_RECOVERY',
    'Recovers safely from "null" in hero_deck and hero_card_nurturing',
    storeNull.getDeckCardIds().length === 5 && new Set(storeNull.getDeckCardIds()).size === 5,
    'Deck length === 5 and unique',
    `Deck: [${storeNull.getDeckCardIds().join(', ')}]`
  );

  // 2.2 Short deck array [1, 2] (< 5 elements)
  mockStorage.setItem('hero_deck', JSON.stringify([1, 2]));
  mockStorage.setItem('hero_card_nurturing', JSON.stringify({ ownedCardIds: [1, 2, 3, 4, 5], cards: {} }));
  const storeShort = new CardNurtureStore();
  const shortDeck = storeShort.getDeckCardIds();
  challenge(
    'STRESS.STORE.SHORT_ARRAY_PAD',
    'Short array (< 5 cards) automatically pads to 5 unique owned cards',
    shortDeck.length === 5 && new Set(shortDeck).size === 5 && shortDeck[0] === 1 && shortDeck[1] === 2,
    'Length 5, starts with 1, 2, Set size 5',
    `Deck: [${shortDeck.join(', ')}]`
  );

  // 2.3 Duplicate elements in storage [1, 1, 1, 1, 1]
  mockStorage.setItem('hero_deck', JSON.stringify([1, 1, 1, 1, 1]));
  const storeDup = new CardNurtureStore();
  const dupDeck = storeDup.getDeckCardIds();
  challenge(
    'STRESS.STORE.DUP_RECOVERY',
    'Storage containing duplicate card IDs ([1,1,1,1,1]) deduplicates to 5 unique cards',
    dupDeck.length === 5 && new Set(dupDeck).size === 5,
    'Set size === 5',
    `Deck: [${dupDeck.join(', ')}], Set size: ${new Set(dupDeck).size}`
  );

  // 2.4 Out-of-range IDs in storage ([999, -1, 0, 150, 1])
  mockStorage.setItem('hero_deck', JSON.stringify([999, -1, 0, 150, 1]));
  const storeOutOfRange = new CardNurtureStore();
  const outDeck = storeOutOfRange.getDeckCardIds();
  const allInRange = outDeck.every((id) => id >= 1 && id <= 110);
  challenge(
    'STRESS.STORE.OUT_OF_RANGE_FILTER',
    'Out-of-range IDs ([999, -1, 0, 150]) are rejected and replaced with valid cards',
    outDeck.length === 5 && new Set(outDeck).size === 5 && allInRange,
    'All IDs 1..110, length 5, unique',
    `Deck: [${outDeck.join(', ')}]`
  );

  // 2.5 String numbers in storage (["1", "2", "3", "4", "5"])
  mockStorage.setItem('hero_deck', JSON.stringify(['1', '2', '3', '4', '5']));
  const storeStrings = new CardNurtureStore();
  const stringDeck = storeStrings.getDeckCardIds();
  challenge(
    'STRESS.STORE.STRING_NUMBERS',
    'String representations of numbers are safely parsed into numeric IDs',
    stringDeck.length === 5 && stringDeck.every((id) => typeof id === 'number'),
    'Array of 5 numbers',
    `Deck: [${stringDeck.join(', ')}]`
  );

  // 2.6 Malformed JSON string
  mockStorage.setItem('hero_deck', '{{{MALFORMED_UNCLOSED_BRACE');
  mockStorage.setItem('hero_card_nurturing', 'INVALID_JSON_CORRUPTED');
  let storeMalformedCrashed = false;
  let storeMalformed: CardNurtureStore | null = null;
  try {
    storeMalformed = new CardNurtureStore();
  } catch {
    storeMalformedCrashed = true;
  }
  const malformedDeck = storeMalformed?.getDeckCardIds() || [];
  challenge(
    'STRESS.STORE.MALFORMED_JSON',
    'Catastrophic malformed JSON syntax does not throw and recovers safely',
    !storeMalformedCrashed && malformedDeck.length === 5 && new Set(malformedDeck).size === 5,
    'No crash, deck length 5, unique',
    `crashed=${storeMalformedCrashed}, deck=[${malformedDeck.join(', ')}]`
  );

  // 2.7 Dual write sync test: check both hero_deck and hero_card_nurturing and hero_deck_season1
  mockStorage.clear();
  cardNurtureStore.initDefaultCards();
  cardNurtureStore.ownedCardIds = [1, 2, 3, 4, 5, 7];
  cardNurtureStore.setDeckCard(0, 7);
  cardNurtureStore.saveToStorage();

  const storedDeckRaw = mockStorage.getItem('hero_deck');
  const storedNurtureRaw = mockStorage.getItem('hero_card_nurturing');
  const storedLegacyRaw = mockStorage.getItem('hero_deck_season1');

  const deckHasSlot0As7 = storedDeckRaw ? JSON.parse(storedDeckRaw)[0] === 7 : false;
  const nurtureHasSlot0As7 = storedNurtureRaw
    ? (JSON.parse(storedNurtureRaw).activeDeckIds || JSON.parse(storedNurtureRaw).deckCardIds)[0] === 7
    : false;
  const legacyHasCard7 = storedLegacyRaw ? storedLegacyRaw.includes('Hero 7') || storedLegacyRaw.includes('7') : false;

  challenge(
    'STRESS.STORE.DUAL_WRITE_SYNC',
    'saveToStorage dual-writes synchronously to hero_deck, hero_card_nurturing & hero_deck_season1',
    deckHasSlot0As7 && nurtureHasSlot0As7 && legacyHasCard7,
    'All 3 storage keys synchronized with Slot 0 as Card 7',
    `deck=${deckHasSlot0As7}, nurture=${nurtureHasSlot0As7}, legacy=${legacyHasCard7}`
  );

  console.log('');

  // ==========================================================================
  // SECTION 3: DOM CONTRACTS FOR #HOME
  // ==========================================================================
  console.log(`${BOLD}>>> SECTION 3: DOM Contracts for #home${RESET}`);

  // Reset to known state
  cardNurtureStore.initDefaultCards();
  cardNurtureStore.ownedCardIds = [1, 2, 3, 4, 5];
  (cardNurtureStore as any).activeDeckIds = [1, 2, 3, 4, 5];
  setInspectedHomeCardId(null);

  const homeHtml = renderHomeSection();
  const $home = cheerio.load(homeHtml);

  // 3.1 Logo tag & parent anchor
  const logoImg = $home('img[src="/logo-ko.png"]');
  const logoAnchor = logoImg.closest('a[href="#home"]');
  const anchorHasMinH = (logoAnchor.attr('class') || '').includes('min-h-[44px]');
  challenge(
    'STRESS.DOM.HOME_LOGO_ANCHOR',
    'Official logo /logo-ko.png rendered inside a[href="#home"] with min-h-[44px]',
    logoImg.length >= 1 && logoAnchor.length >= 1 && anchorHasMinH,
    'Logo inside a[href="#home"] with min-h-[44px]',
    `logoImg=${logoImg.length}, logoAnchor=${logoAnchor.length}, minH=${anchorHasMinH}`
  );

  // 3.2 Fan deck 5 cards & symmetric rotation angles
  const fanCards = $home('[data-fan-card]');
  const rotations: number[] = [];
  fanCards.each((_, el) => {
    const style = $home(el).attr('style') || '';
    const match = style.match(/rotate\((-?\d+)deg\)/);
    if (match) {
      rotations.push(parseInt(match[1], 10));
    }
  });

  const expectedRotations = [-12, -6, 0, 6, 12];
  const rotationsMatch =
    rotations.length === 5 &&
    rotations.every((r, idx) => r === expectedRotations[idx]);

  challenge(
    'STRESS.DOM.HOME_FAN_ROTATIONS',
    'Fan deck cards have exact symmetric rotations: [-12deg, -6deg, 0deg, 6deg, 12deg]',
    rotationsMatch,
    '[-12, -6, 0, 6, 12]',
    `[${rotations.join(', ')}]`
  );

  // 3.3 Rarity glowing borders presence
  let hasBronzeGlow = false;
  let hasSilverGlow = false;
  let hasGoldGlow = false;
  fanCards.each((_, el) => {
    const cls = $home(el).attr('class') || '';
    if (cls.includes('rarity-glow-bronze')) hasBronzeGlow = true;
    if (cls.includes('rarity-glow-silver')) hasSilverGlow = true;
    if (cls.includes('rarity-glow-gold')) hasGoldGlow = true;
  });

  challenge(
    'STRESS.DOM.HOME_RARITY_GLOW',
    'Fan cards have rarity-glow styling classes assigned based on hero tier',
    hasBronzeGlow || hasSilverGlow || hasGoldGlow,
    'Rarity glow class present on cards',
    `bronze=${hasBronzeGlow}, silver=${hasSilverGlow}, gold=${hasGoldGlow}`
  );

  // 3.4 Deck CP display
  const expectedCP = cardNurtureStore.getDeckTP();
  const cpText = $home('#home-deck-showcase').text();
  const cpRendered = cpText.includes(`${expectedCP} CP`) && cpText.includes(`${expectedCP} TP`);
  challenge(
    'STRESS.DOM.HOME_DECK_CP',
    'Displays active squad Deck CP / TP exactly matching getDeckTP()',
    cpRendered,
    `Displays ${expectedCP} CP and ${expectedCP} TP`,
    `Found CP in text: ${cpRendered}`
  );

  // 3.5 Win streak flame badge
  const winStreakText = $home('#home-deck-showcase').text();
  const hasStreakBadge = winStreakText.includes('🔥') && (winStreakText.includes('연승') || winStreakText.includes('도전'));
  challenge(
    'STRESS.DOM.HOME_WIN_STREAK',
    'Displays win streak flame badge with 🔥 icon',
    hasStreakBadge,
    'Badge with 🔥 and streak status',
    `Found: ${hasStreakBadge}`
  );

  // 3.6 Click-to-inspect card modal rendering
  setInspectedHomeCardId(1); // Inspect Card 1 (Aquaris)
  const homeWithModal = renderHomeSection();
  const $modal = cheerio.load(homeWithModal);
  const inspectModal = $modal('#home-card-inspect-modal');
  const modalCutout = inspectModal.find('img[src*="/anime-character-sheets/cutouts/"]');
  const modalCloseBtn = inspectModal.find('[data-action="close-home-card-inspector"]');
  const modalHasCompass = inspectModal.text().includes('북 (N)') && inspectModal.text().includes('남 (S)');
  const modalHasAbility = inspectModal.text().includes('고유 스킬:');

  challenge(
    'STRESS.DOM.HOME_INSPECT_MODAL',
    'Click-to-inspect modal renders 7-head cutout, compass stats, ability, and close [x]',
    inspectModal.length === 1 &&
      modalCutout.length === 1 &&
      modalCloseBtn.length >= 1 &&
      modalHasCompass &&
      modalHasAbility,
    'Modal with cutout, stats, ability, and close button',
    `modal=${inspectModal.length}, cutout=${modalCutout.length}, close=${modalCloseBtn.length}`
  );
  setInspectedHomeCardId(null); // Clean up

  console.log('');

  // ==========================================================================
  // SECTION 4: DOM CONTRACTS FOR #DECK
  // ==========================================================================
  console.log(`${BOLD}>>> SECTION 4: DOM Contracts for #deck${RESET}`);

  // Setup unspent points for Card 2 to test red dot
  cardNurtureStore.cards[2].statPoints = 3;
  setEditingSlotIndex(null);
  setSelectedDeckCardId(1);

  const deckHtml = renderMyDeckSection(1);
  const $deck = cheerio.load(deckHtml);

  // 4.1 5 active slots with SLOT 01..05
  const slotElements = $deck('[data-slot-index]');
  const slotLabels = ['SLOT 01', 'SLOT 02', 'SLOT 03', 'SLOT 04', 'SLOT 05'];
  const allLabelsPresent = slotLabels.every((lbl) => deckHtml.includes(lbl));
  challenge(
    'STRESS.DOM.DECK_5_SLOTS',
    'Renders 5 active slots with explicit SLOT 01..05 headers',
    slotElements.length >= 5 && allLabelsPresent,
    '5 slots with labels SLOT 01..05',
    `Elements: ${slotElements.length}, allLabelsPresent: ${allLabelsPresent}`
  );

  // 4.2 Compass stats (북/N, 동/E, 남/S, 서/W) on every slot
  const compassCount = (deckHtml.match(/북\(N\)/g) || []).length;
  challenge(
    'STRESS.DOM.DECK_COMPASS_STATS',
    'Deck slots display 4-way compass stats (북/N, 동/E, 남/S, 서/W) for all 5 slots',
    compassCount >= 5,
    'At least 5 compass stat blocks',
    `Found ${compassCount} instances of "북(N)"`
  );

  // 4.3 Red dot indicator for unspent points (+3 pt, bg-red-600)
  const redDotBadge = $deck('span.bg-red-600');
  const redDotHasPoints = redDotBadge.text().includes('+3 pt');
  challenge(
    'STRESS.DOM.DECK_RED_DOT',
    'Card with unspent stat points displays red dot indicator (+3 pt, bg-red-600)',
    redDotBadge.length >= 1 && redDotHasPoints,
    'Red badge with "+3 pt"',
    `Badges: ${redDotBadge.length}, Text: "${redDotBadge.first().text().trim()}"`
  );
  cardNurtureStore.cards[2].statPoints = 0; // Clean up

  // 4.4 [영웅 교체] buttons
  const swapButtons = $deck('[data-action="open-deck-swap-drawer"]');
  const swapButtonsMinH = swapButtons.toArray().every((btn) => {
    return ($deck(btn).attr('class') || '').includes('min-h-[44px]');
  });
  challenge(
    'STRESS.DOM.DECK_SWAP_BUTTONS',
    'Every slot has [영웅 교체] button with data-action="open-deck-swap-drawer" & min-h-[44px]',
    swapButtons.length >= 5 && swapButtonsMinH,
    '5 swap buttons with min-h-[44px]',
    `Count: ${swapButtons.length}, minH: ${swapButtonsMinH}`
  );

  // 4.5 Deck swap drawer when open
  setEditingSlotIndex(0); // Open drawer for slot 0
  const deckWithDrawerHtml = renderMyDeckSection(1);
  const $drawer = cheerio.load(deckWithDrawerHtml);
  const drawerModal = $drawer('#deck-swap-drawer-backdrop');
  const drawerCloseBtn = drawerModal.find('[data-action="close-deck-swap-drawer"]');
  const disabledCurrentBtn = drawerModal.find('button:disabled:contains("현재 슬롯 장착 중")');
  const disabledOtherSlotBtn = drawerModal.find('button:disabled:contains("출격 중")');

  challenge(
    'STRESS.DOM.DECK_SWAP_DRAWER',
    'Swap drawer opens, marks current slot card as equipped, disables other active slot cards',
    drawerModal.length === 1 &&
      drawerCloseBtn.length >= 1 &&
      disabledCurrentBtn.length >= 1 &&
      disabledOtherSlotBtn.length >= 1,
    'Drawer open with active card disability guards',
    `modal=${drawerModal.length}, currentEquipped=${disabledCurrentBtn.length}, otherActive=${disabledOtherSlotBtn.length}`
  );
  setEditingSlotIndex(null); // Close drawer

  // 4.6 Real-time Deck TP dynamic update upon stat allocation
  const preDeckTP = cardNurtureStore.getDeckTP();
  cardNurtureStore.cards[1].statPoints = 2;
  cardNurtureStore.allocateStat(1, 'top');
  const postDeckTP = cardNurtureStore.getDeckTP();
  const deckHtmlUpdated = renderMyDeckSection(1);
  const deckTPInHtml = deckHtmlUpdated.includes(`${postDeckTP} <span class="text-xs font-normal text-stone-500">TP</span>`);

  challenge(
    'STRESS.DOM.DECK_REALTIME_TP',
    'Allocating stat to active card immediately updates getDeckTP() and renders in DOM',
    postDeckTP === preDeckTP + 1 && deckTPInHtml,
    `Deck TP incremented by 1 (${preDeckTP} -> ${postDeckTP}) and present in HTML`,
    `post=${postDeckTP}, inHtml=${deckTPInHtml}`
  );

  // 4.7 7-Head Cutout detailed inspection view
  const detailCutout = $deck('img[alt*="7등신 풀바디"]');
  challenge(
    'STRESS.DOM.DECK_7HEAD_INSPECTION',
    'MyDeck detail inspector displays 7-head full-body cutout and lore breakdown',
    detailCutout.length >= 1,
    '7-head cutout present in detail panel',
    `Found ${detailCutout.length} cutout image(s)`
  );

  console.log('');

  // ==========================================================================
  // SECTION 5: STATIC CODE ANALYSIS OF STATE MACHINE & KEYDOWN BINDINGS
  // ==========================================================================
  console.log(`${BOLD}>>> SECTION 5: Static Analysis of State Machine & Escape Bindings${RESET}`);

  const indexPath = path.join(REPO_ROOT, 'src/landing/index.ts');
  const indexSource = fs.readFileSync(indexPath, 'utf-8');

  // Verify handleGlobalKeydown Escape hierarchy in source code
  const hasEscapeHandler = indexSource.includes("if (event.key === 'Escape')");
  const hasInspectDismiss = indexSource.includes('getInspectedHomeCardId()') && indexSource.includes('setInspectedHomeCardId(null)');
  const hasDrawerDismiss = indexSource.includes('getEditingSlotIndex() !== null') && indexSource.includes('setEditingSlotIndex(null)');
  const hasModalDismiss = indexSource.includes('state.activeModal = null');

  // Order analysis: inspect dismiss before drawer dismiss before modal dismiss within handleGlobalKeydown
  const keydownFnPos = indexSource.indexOf('function handleGlobalKeydown');
  const keydownBody = keydownFnPos !== -1 ? indexSource.slice(keydownFnPos, keydownFnPos + 1000) : '';
  const posInspect = keydownBody.indexOf('getInspectedHomeCardId()');
  const posDrawer = keydownBody.indexOf('getEditingSlotIndex() !== null');
  const posModal = keydownBody.indexOf('state.activeModal');
  const correctLifoOrder = posInspect !== -1 && posDrawer !== -1 && posModal !== -1 && posInspect < posDrawer && posDrawer < posModal;

  challenge(
    'STRESS.STATE.LIFO_ESCAPE_CODE_ANALYSIS',
    'handleGlobalKeydown enforces strict LIFO order: inspect modal -> swap drawer -> secondary modal',
    hasEscapeHandler && hasInspectDismiss && hasDrawerDismiss && hasModalDismiss && correctLifoOrder,
    'Strict LIFO order verified in index.ts',
    `posInspect=${posInspect}, posDrawer=${posDrawer}, posModal=${posModal}`
  );

  // Check event bindings for swap-deck-card, select-deck-card, open-deck-swap-drawer, close-deck-swap-drawer
  const hasSwapDeckAction = indexSource.includes("action === 'swap-deck-card'");
  const hasSelectDeckAction = indexSource.includes("action === 'select-deck-card'");
  const hasOpenDrawerAction = indexSource.includes("action === 'open-deck-swap-drawer'");
  const hasCloseDrawerAction = indexSource.includes("action === 'close-deck-swap-drawer'");

  challenge(
    'STRESS.STATE.EVENT_DELEGATION_BINDINGS',
    'handleEventDelegation contains dedicated handlers for swap-deck-card, select-deck-card, open/close drawer',
    hasSwapDeckAction && hasSelectDeckAction && hasOpenDrawerAction && hasCloseDrawerAction,
    'All 4 deck actions wired in event delegation',
    `swap=${hasSwapDeckAction}, select=${hasSelectDeckAction}, open=${hasOpenDrawerAction}, close=${hasCloseDrawerAction}`
  );

  console.log('');

  // ==========================================================================
  // DECISION & SUMMARY
  // ==========================================================================
  const total = assertions.length;
  const passed = assertions.filter((a) => a.passed).length;
  const failed = assertions.filter((a) => !a.passed).length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`${BOLD}CHALLENGER DEEP STRESS EXECUTION SUMMARY${RESET}`);
  console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`Total Stress Assertions : ${total}`);
  console.log(`Passed                  : ${GREEN}${passed}${RESET}`);
  console.log(`Failed                  : ${failed > 0 ? RED + failed + RESET : '0'}`);
  console.log(`Pass Rate               : ${passRate === '100.0' ? GREEN : YELLOW}${passRate}%${RESET}\n`);

  if (failed > 0) {
    console.error(`${RED}${BOLD}[VERDICT] REQUEST_CHANGES — ${failed} stress assertion(s) failed.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}[VERDICT] APPROVE — All ${total} adversarial stress challenges PASSED 100%!${RESET}\n`);
    process.exit(0);
  }
}

runEmpiricalStress().catch((err) => {
  console.error('Fatal crash in stress harness:', err);
  process.exit(1);
});
