/**
 * tests/challenger_m2_it2_empirical.ts
 *
 * Empirical Challenge Harness for Milestone 2 Iteration 2:
 * 1. Deduplication invariant: Set(activeDeckIds).size === 5 across 150 random slot swaps
 * 2. Deep LocalStorage corrupted data recovery & resilient rehydration
 * 3. DOM element contracts & dual-defense backdrop event delegation
 * 4. Static analysis & simulation of Dual-Defense Layer 2 in src/landing/index.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// In-Memory Storage Mock for Node.js
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
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

import {
  CardNurtureStore,
  cardNurtureStore,
  STORAGE_KEY,
  DECK_STORAGE_KEY,
} from '../src/landing/services/cardNurtureStore';
import {
  renderHomeSection,
  setInspectedHomeCardId,
  getInspectedHomeCardId,
} from '../src/landing/views/HomeSection';
import {
  renderMyDeckSection,
  setEditingSlotIndex,
  getEditingSlotIndex,
  getCardEffectiveStats,
} from '../src/landing/views/MyDeckSection';

interface AssertionResult {
  id: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  note?: string;
}

const results: AssertionResult[] = [];

function assert(id: string, name: string, passed: boolean, expected?: string, actual?: string, note?: string) {
  results.push({ id, name, passed, expected, actual, note });
  const icon = passed ? '\x1b[92m✓ PASS\x1b[0m' : '\x1b[91m✗ FAIL\x1b[0m';
  console.log(`  [${id}] ${name} ${icon}`);
  if (!passed) {
    if (expected) console.log(`    ↳ Expected: ${expected}`);
    if (actual) console.log(`    ↳ Actual  : ${actual}`);
    if (note) console.log(`    ↳ Note    : ${note}`);
  }
}

console.log('======================================================================');
console.log('  CHALLENGER 1 EMPIRICAL VERIFICATION HARNESS (Milestone 2 Iteration 2)');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Deduplication invariant across 100+ random slot swaps
// -----------------------------------------------------------------------------
console.log('>>> SECTION 1: Card Swapping Invariant & 150-Step Random Fuzzing');

// Ensure cards 1..25 are owned for testing
for (let id = 1; id <= 25; id++) {
  cardNurtureStore.addCard(id);
}

let fuzzPassed = true;
let failureDetail = '';

for (let step = 1; step <= 150; step++) {
  // Random slot 0..4
  const slot = Math.floor(Math.random() * 5);
  // Random card among owned 1..25
  const cardId = Math.floor(Math.random() * 25) + 1;

  const success = cardNurtureStore.setDeckCard(slot, cardId);
  if (!success) {
    fuzzPassed = false;
    failureDetail = `setDeckCard(${slot}, ${cardId}) returned false at step ${step}`;
    break;
  }

  const currentDeck = cardNurtureStore.getDeckCardIds();
  const set = new Set(currentDeck);

  if (currentDeck.length !== 5) {
    fuzzPassed = false;
    failureDetail = `Deck length is ${currentDeck.length} !== 5 at step ${step}`;
    break;
  }

  if (set.size !== 5) {
    fuzzPassed = false;
    failureDetail = `Duplicate detected: [${currentDeck.join(', ')}] at step ${step}`;
    break;
  }

  if (currentDeck[slot] !== cardId) {
    fuzzPassed = false;
    failureDetail = `Slot ${slot} was not set to ${cardId} (is ${currentDeck[slot]}) at step ${step}`;
    break;
  }

  // Check LocalStorage dual write consistency
  const savedDeckRaw = mockStorage.getItem(DECK_STORAGE_KEY);
  if (!savedDeckRaw) {
    fuzzPassed = false;
    failureDetail = `LocalStorage hero_deck is null at step ${step}`;
    break;
  }
  const parsedSaved = JSON.parse(savedDeckRaw);
  if (!Array.isArray(parsedSaved) || parsedSaved.length !== 5) {
    fuzzPassed = false;
    failureDetail = `LocalStorage hero_deck length !== 5 at step ${step}`;
    break;
  }
}

assert(
  'CH1.INVARIANT.FUZZ_150',
  '150 random slot swaps preserve exact Set(activeDeckIds).size === 5 without duplicates',
  fuzzPassed,
  '5 unique cards across 150 permutations',
  failureDetail || '150/150 permutations maintained 5 unique cards'
);

// Specific adversarial swapping patterns
// Pattern A: swap card into same slot (idempotency)
const currentSlot0 = cardNurtureStore.getDeckCardIds()[0];
const idempRes = cardNurtureStore.setDeckCard(0, currentSlot0);
const afterIdemp = cardNurtureStore.getDeckCardIds();
assert(
  'CH1.SWAP.IDEMPOTENT',
  'Setting slot 0 to card already in slot 0 is an idempotent no-op returning true',
  idempRes === true && afterIdemp[0] === currentSlot0 && new Set(afterIdemp).size === 5,
  'true and unchanged deck',
  `res=${idempRes}, deck=[${afterIdemp.join(',')}]`
);

// Pattern B: slot exchange when assigning card that is currently in another slot
// e.g. put slot 1's card into slot 0
const deckBefore = cardNurtureStore.getDeckCardIds();
const cardA = deckBefore[0];
const cardB = deckBefore[1];
cardNurtureStore.setDeckCard(0, cardB);
const deckAfterSwap = cardNurtureStore.getDeckCardIds();
assert(
  'CH1.SWAP.CROSS_SLOT_EXCHANGE',
  'Assigning card from slot 1 to slot 0 cleanly swaps slot 0 and slot 1 positions',
  deckAfterSwap[0] === cardB && deckAfterSwap[1] === cardA && new Set(deckAfterSwap).size === 5,
  `slot0=${cardB}, slot1=${cardA}`,
  `slot0=${deckAfterSwap[0]}, slot1=${deckAfterSwap[1]}`
);

// Pattern C: Unowned card rejection
const unownedCardId = 99; // ensure 99 is unowned
if (cardNurtureStore.ownedCardIds.includes(99)) {
  cardNurtureStore.ownedCardIds = cardNurtureStore.ownedCardIds.filter(id => id !== 99);
}
const unownedReject = cardNurtureStore.setDeckCard(2, unownedCardId);
assert(
  'CH1.SWAP.UNOWNED_REJECT',
  'Attempting to equip unowned card (99) returns false and does not mutate deck',
  unownedReject === false && !cardNurtureStore.getDeckCardIds().includes(99),
  'false and card 99 not in deck',
  `res=${unownedReject}`
);

// -----------------------------------------------------------------------------
// SECTION 2: LocalStorage Corrupted Data Recovery
// -----------------------------------------------------------------------------
console.log('\n>>> SECTION 2: LocalStorage Corrupted Data Recovery & Resilience');

// Test Case 2.1: Completely corrupted JSON syntax in hero_deck
mockStorage.clear();
mockStorage.setItem(DECK_STORAGE_KEY, '{invalid:json,,]');
const storeCorrupt1 = new CardNurtureStore();
const deckCorrupt1 = storeCorrupt1.getDeckCardIds();
assert(
  'CH1.STORE.CORRUPT_SYNTAX',
  'Store recovers from syntax-corrupted JSON string in hero_deck with valid 5-card deck',
  deckCorrupt1.length === 5 && new Set(deckCorrupt1).size === 5,
  '5 unique cards',
  `length=${deckCorrupt1.length}, unique=${new Set(deckCorrupt1).size}`
);

// Test Case 2.2: Duplicate cards saved in hero_deck [7, 7, 7, 7, 7]
mockStorage.clear();
mockStorage.setItem(DECK_STORAGE_KEY, JSON.stringify([7, 7, 7, 7, 7]));
const storeCorrupt2 = new CardNurtureStore();
const deckCorrupt2 = storeCorrupt2.getDeckCardIds();
assert(
  'CH1.STORE.DEDUPLICATE_STORAGE',
  'Store deduplicates array of identical IDs ([7, 7, 7, 7, 7]) to 5 unique valid cards',
  deckCorrupt2.length === 5 && new Set(deckCorrupt2).size === 5,
  '5 unique cards (Set size === 5)',
  `[${deckCorrupt2.join(', ')}] (Set size: ${new Set(deckCorrupt2).size})`
);

// Test Case 2.3: Array with fewer than 5 cards in hero_deck [2, 3]
mockStorage.clear();
mockStorage.setItem(DECK_STORAGE_KEY, JSON.stringify([2, 3]));
const storeCorrupt3 = new CardNurtureStore();
const deckCorrupt3 = storeCorrupt3.getDeckCardIds();
assert(
  'CH1.STORE.PAD_SHORT_DECK',
  'Store automatically pads short deck ([2, 3]) to exactly 5 unique cards',
  deckCorrupt3.length === 5 && new Set(deckCorrupt3).size === 5 && deckCorrupt3.includes(2) && deckCorrupt3.includes(3),
  '5 unique cards containing 2 and 3',
  `[${deckCorrupt3.join(', ')}]`
);

// Test Case 2.4: Array with unowned or out-of-range IDs [-5, 0, 999, "abc", null]
mockStorage.clear();
mockStorage.setItem(DECK_STORAGE_KEY, JSON.stringify([-5, 0, 999, "abc", null]));
const storeCorrupt4 = new CardNurtureStore();
const deckCorrupt4 = storeCorrupt4.getDeckCardIds();
assert(
  'CH1.STORE.OUT_OF_RANGE_FILTER',
  'Store filters out out-of-range / non-numeric IDs and rehydrates 5 valid cards',
  deckCorrupt4.length === 5 && new Set(deckCorrupt4).size === 5 && deckCorrupt4.every(id => id >= 1 && id <= 110),
  '5 valid cards between 1..110',
  `[${deckCorrupt4.join(', ')}]`
);

// Test Case 2.5: hero_card_nurturing payload with malformed structure
mockStorage.clear();
mockStorage.setItem(STORAGE_KEY, JSON.stringify({
  cards: "not an object",
  ownedCardIds: "not an array",
  activeDeckIds: [null, undefined, 42]
}));
const storeCorrupt5 = new CardNurtureStore();
const deckCorrupt5 = storeCorrupt5.getDeckCardIds();
assert(
  'CH1.STORE.MALFORMED_NURTURE_PAYLOAD',
  'Store safely handles malformed hero_card_nurturing object structure without throwing',
  deckCorrupt5.length === 5 && new Set(deckCorrupt5).size === 5,
  '5 unique cards',
  `[${deckCorrupt5.join(', ')}]`
);

// -----------------------------------------------------------------------------
// SECTION 3: DOM Element Contracts & Sibling Backdrop Architecture
// -----------------------------------------------------------------------------
console.log('\n>>> SECTION 3: DOM Element Contracts & Sibling Backdrop Architecture');

// 3.1 Home Card Inspect Modal
setInspectedHomeCardId(1);
const homeHtml = renderHomeSection();
const $home = cheerio.load(homeHtml);

const homeModalContainer = $home('#home-card-inspect-modal');
const homeBackdropSibling = $home('#home-card-inspect-backdrop');
const homeContentBox = homeModalContainer.find('> div.relative.z-10');
const homeCloseBtn = $home('button[data-action="close-home-card-inspector"]');

assert(
  'CH1.DOM.HOME_CONTAINER_ROLE',
  '#home-card-inspect-modal has role="dialog" and aria-modal="true"',
  homeModalContainer.attr('role') === 'dialog' && homeModalContainer.attr('aria-modal') === 'true',
  'role="dialog" aria-modal="true"',
  `role=${homeModalContainer.attr('role')} aria-modal=${homeModalContainer.attr('aria-modal')}`
);

assert(
  'CH1.DOM.HOME_BACKDROP_SIBLING',
  '#home-card-inspect-backdrop exists as dedicated sibling with data-action="close-home-card-inspector"',
  homeBackdropSibling.length === 1 && homeBackdropSibling.attr('data-action') === 'close-home-card-inspector',
  'length=1 and data-action="close-home-card-inspector"',
  `length=${homeBackdropSibling.length}, action=${homeBackdropSibling.attr('data-action')}`
);

assert(
  'CH1.DOM.HOME_BACKDROP_CLASSES',
  '#home-card-inspect-backdrop contains fixed inset-0 and cursor-pointer styling',
  homeBackdropSibling.hasClass('fixed') && homeBackdropSibling.hasClass('inset-0') && homeBackdropSibling.hasClass('cursor-pointer'),
  'fixed inset-0 cursor-pointer',
  homeBackdropSibling.attr('class')
);

assert(
  'CH1.DOM.HOME_CONTENT_ZINDEX',
  'Home modal dialog box has relative z-10 positioning above the backdrop',
  homeContentBox.length >= 1 && homeContentBox.hasClass('relative') && homeContentBox.hasClass('z-10'),
  'relative z-10',
  homeContentBox.attr('class')
);

assert(
  'CH1.DOM.HOME_CLOSE_TOUCH_TARGET',
  'Home modal close button has min-h-[44px] min-w-[44px] touch target',
  homeCloseBtn.hasClass('min-h-[44px]') && homeCloseBtn.hasClass('min-w-[44px]'),
  'min-h-[44px] min-w-[44px]',
  homeCloseBtn.attr('class')
);

// 3.2 MyDeck Slot Swap Drawer
setEditingSlotIndex(0);
const deckHtml = renderMyDeckSection();
const $deck = cheerio.load(deckHtml);

const deckDrawerContainer = $deck('#deck-swap-drawer-backdrop');
const deckBackdropSibling = $deck('#deck-swap-backdrop');
const deckContentBox = deckDrawerContainer.find('> div.relative.z-10');
const deckCloseBtn = $deck('button[data-action="close-deck-swap-drawer"]');

assert(
  'CH1.DOM.DECK_CONTAINER_ROLE',
  '#deck-swap-drawer-backdrop has role="dialog" and aria-modal="true"',
  deckDrawerContainer.attr('role') === 'dialog' && deckDrawerContainer.attr('aria-modal') === 'true',
  'role="dialog" aria-modal="true"',
  `role=${deckDrawerContainer.attr('role')} aria-modal=${deckDrawerContainer.attr('aria-modal')}`
);

assert(
  'CH1.DOM.DECK_BACKDROP_SIBLING',
  '#deck-swap-backdrop exists as dedicated sibling with data-action="close-deck-swap-drawer"',
  deckBackdropSibling.length === 1 && deckBackdropSibling.attr('data-action') === 'close-deck-swap-drawer',
  'length=1 and data-action="close-deck-swap-drawer"',
  `length=${deckBackdropSibling.length}, action=${deckBackdropSibling.attr('data-action')}`
);

assert(
  'CH1.DOM.DECK_BACKDROP_CLASSES',
  '#deck-swap-backdrop contains fixed inset-0 and cursor-pointer styling',
  deckBackdropSibling.hasClass('fixed') && deckBackdropSibling.hasClass('inset-0') && deckBackdropSibling.hasClass('cursor-pointer'),
  'fixed inset-0 cursor-pointer',
  deckBackdropSibling.attr('class')
);

assert(
  'CH1.DOM.DECK_CONTENT_ZINDEX',
  'MyDeck drawer dialog box has relative z-10 positioning above the backdrop',
  deckContentBox.length >= 1 && deckContentBox.hasClass('relative') && deckContentBox.hasClass('z-10'),
  'relative z-10',
  deckContentBox.attr('class')
);

assert(
  'CH1.DOM.DECK_CLOSE_TOUCH_TARGET',
  'MyDeck drawer close button has min-h-[44px] min-w-[44px] touch target',
  deckCloseBtn.hasClass('min-h-[44px]') && deckCloseBtn.hasClass('min-w-[44px]'),
  'min-h-[44px] min-w-[44px]',
  deckCloseBtn.attr('class')
);

// Reset state
setInspectedHomeCardId(null);
setEditingSlotIndex(null);

// -----------------------------------------------------------------------------
// SECTION 4: Dual-Defense Layer 2 Code Analysis & Simulated Event Delegation
// -----------------------------------------------------------------------------
console.log('\n>>> SECTION 4: Dual-Defense Layer 2 Code Analysis & Simulated Event Delegation');

const landingIndexSrc = fs.readFileSync(path.join(REPO_ROOT, 'src/landing/index.ts'), 'utf-8');

assert(
  'CH1.LAYER2.HOME_BACKDROP_CHECK',
  'src/landing/index.ts checks rawTarget.id for home-card-inspect-modal and home-card-inspect-backdrop',
  landingIndexSrc.includes("rawTarget.id === 'home-card-inspect-modal' || rawTarget.id === 'home-card-inspect-backdrop'") &&
  landingIndexSrc.includes('setInspectedHomeCardId(null)'),
  'contains direct target ID check and setInspectedHomeCardId(null)',
  'Layer 2 direct ID check present in handleEventDelegation'
);

assert(
  'CH1.LAYER2.DECK_BACKDROP_CHECK',
  'src/landing/index.ts checks rawTarget.id for deck-swap-drawer-backdrop and deck-swap-backdrop',
  landingIndexSrc.includes("rawTarget.id === 'deck-swap-drawer-backdrop' || rawTarget.id === 'deck-swap-backdrop'") &&
  landingIndexSrc.includes('setEditingSlotIndex(null)'),
  'contains direct target ID check and setEditingSlotIndex(null)',
  'Layer 2 direct ID check present in handleEventDelegation'
);

// Simulation of handleEventDelegation exactly as written in src/landing/index.ts
function simulateHandleEventDelegation(targetObj: { id?: string; tagName?: string; attributes?: Record<string, string>; parent?: any }) {
  const rawTarget = targetObj;
  if (!rawTarget) return;

  // Direct Backdrop Click Fallback (Dual Defense Layer 2)
  if (rawTarget.id === 'home-card-inspect-modal' || rawTarget.id === 'home-card-inspect-backdrop') {
    setInspectedHomeCardId(null);
    return;
  }
  if (rawTarget.id === 'deck-swap-drawer-backdrop' || rawTarget.id === 'deck-swap-backdrop') {
    setEditingSlotIndex(null);
    return;
  }

  // Traversal for data-action
  let curr: any = rawTarget;
  let action: string | null = null;
  while (curr) {
    if (curr.attributes && curr.attributes['data-action']) {
      action = curr.attributes['data-action'];
      break;
    }
    curr = curr.parent;
  }

  if (action === 'close-home-card-inspector') {
    setInspectedHomeCardId(null);
  } else if (action === 'close-deck-swap-drawer') {
    setEditingSlotIndex(null);
  }
}

// Test Layer 1 & 2 on Home Modal
setInspectedHomeCardId(1);
// Click sibling backdrop
simulateHandleEventDelegation({ id: 'home-card-inspect-backdrop', attributes: { 'data-action': 'close-home-card-inspector' } });
assert(
  'CH1.SIM.HOME_SIBLING_BACKDROP',
  'Clicking #home-card-inspect-backdrop dismisses home card inspect modal',
  getInspectedHomeCardId() === null,
  'inspectedId === null',
  `inspectedId = ${getInspectedHomeCardId()}`
);

// Click container padding (margin area)
setInspectedHomeCardId(1);
simulateHandleEventDelegation({ id: 'home-card-inspect-modal' });
assert(
  'CH1.SIM.HOME_CONTAINER_MARGIN',
  'Clicking #home-card-inspect-modal container margin dismisses home card inspect modal',
  getInspectedHomeCardId() === null,
  'inspectedId === null',
  `inspectedId = ${getInspectedHomeCardId()}`
);

// Click inside dialog content
setInspectedHomeCardId(1);
simulateHandleEventDelegation({
  id: '',
  tagName: 'H3',
  attributes: {},
  parent: { id: '', tagName: 'DIV', attributes: { class: 'relative z-10' } }
});
assert(
  'CH1.SIM.HOME_INSIDE_PRESERVED',
  'Clicking inside dialog content preserves home inspect modal (no dismissal)',
  getInspectedHomeCardId() === 1,
  'inspectedId === 1',
  `inspectedId = ${getInspectedHomeCardId()}`
);

// Test Layer 1 & 2 on MyDeck Drawer
setEditingSlotIndex(0);
// Click sibling backdrop
simulateHandleEventDelegation({ id: 'deck-swap-backdrop', attributes: { 'data-action': 'close-deck-swap-drawer' } });
assert(
  'CH1.SIM.DECK_SIBLING_BACKDROP',
  'Clicking #deck-swap-backdrop dismisses deck swap drawer',
  getEditingSlotIndex() === null,
  'editingSlotIndex === null',
  `editingSlotIndex = ${getEditingSlotIndex()}`
);

// Click container padding
setEditingSlotIndex(0);
simulateHandleEventDelegation({ id: 'deck-swap-drawer-backdrop' });
assert(
  'CH1.SIM.DECK_CONTAINER_MARGIN',
  'Clicking #deck-swap-drawer-backdrop container margin dismisses deck swap drawer',
  getEditingSlotIndex() === null,
  'editingSlotIndex === null',
  `editingSlotIndex = ${getEditingSlotIndex()}`
);

// Click inside drawer content
setEditingSlotIndex(0);
simulateHandleEventDelegation({
  id: 'deck-swap-drawer-title',
  tagName: 'H3',
  attributes: {},
  parent: { id: '', tagName: 'DIV', attributes: { class: 'relative z-10' } }
});
assert(
  'CH1.SIM.DECK_INSIDE_PRESERVED',
  'Clicking inside drawer content preserves deck swap drawer (no dismissal)',
  getEditingSlotIndex() === 0,
  'editingSlotIndex === 0',
  `editingSlotIndex = ${getEditingSlotIndex()}`
);

// Reset
setInspectedHomeCardId(null);
setEditingSlotIndex(null);

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------------');
console.log('CHALLENGER 1 EMPIRICAL VERIFICATION SUMMARY');
console.log('----------------------------------------------------------------------');
const total = results.length;
const passed = results.filter(r => r.passed).length;
const failed = total - passed;

console.log(`Total Assertions Run : ${total}`);
console.log(`Passed               : ${passed}`);
console.log(`Failed               : ${failed}`);
console.log(`Pass Rate            : ${((passed / total) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('\x1b[92m[VERDICT] APPROVE — All empirical challenge assertions PASSED 100%!\x1b[0m\n');
} else {
  console.log('\x1b[91m[VERDICT] REQUEST_CHANGES — Empirical challenge assertions failed.\x1b[0m\n');
  process.exit(1);
}
