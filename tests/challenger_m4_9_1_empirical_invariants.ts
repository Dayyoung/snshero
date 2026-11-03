/**
 * tests/challenger_m4_9_1_empirical_invariants.ts
 *
 * INDEPENDENT EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — CHALLENGER M4.9.1
 * Focus: Card Nurturing Invariants, Ownership Gating, Directional Stat Allocation,
 * Dynamic TP Math Conservation, and Battle Victory EXP Hook.
 *
 * Requirements from Dispatch:
 * 1. Gated Nurturing Invariants:
 *    - Verify unowned cards (e.g. Card 50, random unowned cards) CANNOT gain EXP or level up via nurtureCard(),
 *      even with huge EXP (100,000) or invalid parameters (-1, 0, 111, NaN, floats).
 *    - Verify unowned cards CANNOT allocate stat points via allocateStat() or report hasUnspentPoints().
 * 2. Directional Stat Allocation Invariants:
 *    - Verify allocateStat(cardId, direction) only accepts exact valid directions: 'top', 'right', 'bottom', 'left'.
 *    - Test adversarial injections ('center', 'front', 'diagonal', '__proto__', empty string, etc.).
 *      Confirm no stat points are deducted and no extraneous properties are created.
 *    - Verify exact dynamic Deck TP and Total TP math before and after stat allocation.
 * 3. Battle Victory EXP Invariants:
 *    - Execute awardBattleVictoryExp(50) on cardNurtureStore.
 *    - Verify exactly 50 EXP is awarded to each card in active deck, unowned cards are not mutated,
 *      and cards not in active deck receive 0 EXP.
 *    - Verify level-up thresholds and stat point issuance (Level 1 -> 2 at 100 EXP -> +1 stat point).
 */

// ============================================================================
// Headless Browser Polyfills & Mock LocalStorage
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

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#card' },
    dispatchEvent: () => true,
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
// Imports
// ============================================================================

import { CardNurtureStore, cardNurtureStore, STORAGE_KEY } from '../src/landing/services/cardNurtureStore';
import { CARD_DATABASE } from '../src/cardDatabase';

// ============================================================================
// Test Framework Harness
// ============================================================================

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureMessages: string[] = [];

function assert(condition: boolean, desc: string): void {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${desc}`);
  } else {
    failedAssertions++;
    const msg = `  ✗ FAIL: ${desc}`;
    console.error(msg);
    failureMessages.push(desc);
  }
}

function assertEqual<T>(actual: T, expected: T, desc: string): void {
  totalAssertions++;
  if (actual === expected) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${desc} (value: ${JSON.stringify(actual)})`);
  } else {
    failedAssertions++;
    const msg = `  ✗ FAIL: ${desc} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`;
    console.error(msg);
    failureMessages.push(msg);
  }
}

// Helper to create a fresh store instance with clean storage
function createFreshStore(owned: number[] = [1, 2, 3, 4, 5], activeDeck: number[] = [1, 2, 3, 4, 5]): CardNurtureStore {
  mockStorage.clear();
  const store = new CardNurtureStore();
  store.ownedCardIds = [...owned];
  store.activeDeckIds = [...activeDeck];
  store.initDefaultCards();
  store.saveToStorage();
  return store;
}

// ============================================================================
// SUITE 1: GATED NURTURING INVARIANTS (UNOWNED CARDS)
// ============================================================================

console.log('\n============================================================');
console.log('SUITE 1: Gated Nurturing Invariants (Unowned Cards & Bound Checks)');
console.log('============================================================');

{
  const store = createFreshStore([1, 2, 3, 4, 5]);

  // 1.1: Unowned Card 50 normal nurture attempt
  const res50 = store.nurtureCard(50, 50);
  assertEqual(res50.expGained, 0, '1.1a: nurtureCard(50, 50) returns expGained = 0');
  assertEqual(res50.leveledUp, false, '1.1b: nurtureCard(50, 50) returns leveledUp = false');
  assertEqual(res50.newLevel, 1, '1.1c: nurtureCard(50, 50) returns newLevel = 1');
  assertEqual(store.cards[50].exp, 0, '1.1d: Card 50 exp remains 0 in store');
  assertEqual(store.cards[50].level, 1, '1.1e: Card 50 level remains 1 in store');
  assertEqual(store.cards[50].statPoints, 0, '1.1f: Card 50 statPoints remains 0 in store');

  // 1.2: Unowned Card 50 with massive 100,000 EXP
  const resHuge = store.nurtureCard(50, 100000);
  assertEqual(resHuge.expGained, 0, '1.2a: nurtureCard(50, 100000) rejected with expGained = 0');
  assertEqual(resHuge.leveledUp, false, '1.2b: nurtureCard(50, 100000) returns leveledUp = false');
  assertEqual(store.cards[50].level, 1, '1.2c: Card 50 level unchanged at 1 despite 100,000 EXP');
  assertEqual(store.cards[50].exp, 0, '1.2d: Card 50 exp unchanged at 0 despite 100,000 EXP');

  // 1.3: Unowned Card 50 with edge/invalid EXP values
  const invalidExpValues = [-1, -500, 0, NaN, 1.5, Infinity, -Infinity];
  for (const exp of invalidExpValues) {
    const res = store.nurtureCard(50, exp as any);
    assertEqual(res.expGained, 0, `1.3: nurtureCard(50, ${exp}) returns expGained = 0`);
    assertEqual(res.leveledUp, false, `1.3: nurtureCard(50, ${exp}) returns leveledUp = false`);
  }

  // 1.4: Random unowned cards (20 IDs from 6..110) with 100,000 EXP
  const unownedSample = [6, 12, 19, 25, 33, 42, 55, 63, 71, 77, 84, 89, 93, 99, 100, 102, 105, 108, 109, 110];
  let unownedAllProtected = true;
  for (const cardId of unownedSample) {
    const res = store.nurtureCard(cardId, 100000);
    if (res.expGained !== 0 || res.leveledUp !== false || store.cards[cardId].level !== 1 || store.cards[cardId].exp !== 0) {
      unownedAllProtected = false;
      console.error(`Leak detected for unowned card ${cardId}`);
    }
  }
  assert(unownedAllProtected, '1.4: All 20 sample unowned cards completely rejected 100,000 EXP nurture');

  // 1.5: Out of bounds and non-integer card IDs
  const invalidCardIds = [-1, -100, 0, 111, 200, 999, NaN, 3.14, 5.9, Infinity, -Infinity, '50' as any, null as any, undefined as any];
  let invalidIdsAllRejected = true;
  for (const badId of invalidCardIds) {
    const res = store.nurtureCard(badId, 500);
    if (res.expGained !== 0 || res.leveledUp !== false) {
      invalidIdsAllRejected = false;
      console.error(`Invalid card ID ${badId} was not rejected!`);
    }
  }
  assert(invalidIdsAllRejected, '1.5: All out-of-bounds/non-integer card IDs rejected by nurtureCard()');

  // 1.6: Unowned cards cannot allocate stat points
  const directions: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];
  for (const dir of directions) {
    const allocRes = store.allocateStat(50, dir);
    assertEqual(allocRes, false, `1.6: allocateStat(50, '${dir}') returns false for unowned card`);
    assertEqual(store.cards[50].bonusStats[dir], 0, `1.6: Card 50 bonusStats.${dir} remains 0`);
  }

  // 1.7: Unowned cards cannot report hasUnspentPoints
  assertEqual(store.hasUnspentPoints(50), false, '1.7a: hasUnspentPoints(50) returns false for unowned card');
  assertEqual(store.hasUnspentPoints(99), false, '1.7b: hasUnspentPoints(99) returns false for unowned card');

  // 1.8: Adversarial state manipulation: artificially set statPoints on unowned card
  store.cards[50].statPoints = 10;
  assertEqual(store.isCardOwned(50), false, '1.8a: Card 50 is confirmed unowned');
  assertEqual(
    store.hasUnspentPoints(50),
    false,
    '1.8b: hasUnspentPoints(50) returns false EVEN when cards[50].statPoints = 10 (Ownership Guard)'
  );

  // 1.9: Attempt allocateStat on unowned card with artificial statPoints
  const hackedAlloc = store.allocateStat(50, 'top');
  assertEqual(hackedAlloc, false, '1.9a: allocateStat(50, "top") returns false despite artificial stat points');
  assertEqual(store.cards[50].statPoints, 10, '1.9b: Card 50 stat points not deducted');
  assertEqual(store.cards[50].bonusStats.top, 0, '1.9c: Card 50 bonusStats.top remains 0');
  assertEqual(store.cards[50].totalBonus, 0, '1.9d: Card 50 totalBonus remains 0');

  // Reset Card 50
  store.cards[50].statPoints = 0;

  // 1.10: Unowned card cannot be set into active deck
  const setDeckRes = store.setDeckCard(0, 50);
  assertEqual(setDeckRes, false, '1.10a: setDeckCard(0, 50) returns false for unowned card');
  assertEqual(store.activeDeckIds.includes(50), false, '1.10b: Card 50 was NOT placed into active deck');
}

// ============================================================================
// SUITE 2: DIRECTIONAL STAT ALLOCATION INVARIANTS & MATH CONSERVATION
// ============================================================================

console.log('\n============================================================');
console.log('SUITE 2: Directional Stat Allocation Invariants & TP Math');
console.log('============================================================');

{
  const store = createFreshStore([1, 2, 3, 4, 5, 6]);

  // Give Card 1 enough EXP to reach Level 3 (needs 100 + 200 = 300 EXP -> grants 2 stat points)
  const nurture1 = store.nurtureCard(1, 300);
  assertEqual(nurture1.newLevel, 3, '2.1a: Card 1 leveled up to Level 3');
  assertEqual(store.cards[1].statPoints, 2, '2.1b: Card 1 has exactly 2 stat points');
  assertEqual(store.hasUnspentPoints(1), true, '2.1c: hasUnspentPoints(1) is true');

  // 2.2: Adversarial directional injections
  const adversarialDirections = [
    'center',
    'front',
    'diagonal',
    'back',
    'middle',
    'up',
    'down',
    'north',
    'south',
    '__proto__',
    'constructor',
    'prototype',
    'toString',
    'valueOf',
    '',
    ' ',
    'top ',
    ' top',
    'TOP',
    'Top',
    'BOTTOM',
    'left\0',
    'right\n',
    null,
    undefined,
    123,
    {},
  ];

  for (const attackDir of adversarialDirections) {
    const res = store.allocateStat(1, attackDir as any);
    assertEqual(res, false, `2.2: allocateStat(1, ${JSON.stringify(attackDir)}) is rejected with false`);
    // Verify no prototype pollution or extraneous key created
    assertEqual(store.cards[1].statPoints, 2, `2.2: Stat points remain 2 after rejecting ${JSON.stringify(attackDir)}`);
    assertEqual(
      Object.prototype.hasOwnProperty.call(store.cards[1].bonusStats, attackDir as string),
      false,
      `2.2: No extraneous own property ${JSON.stringify(attackDir)} on bonusStats`
    );
  }

  // Verify bonusStats keys are strictly ['top', 'right', 'bottom', 'left']
  const keys = Object.keys(store.cards[1].bonusStats);
  assertEqual(keys.length, 4, '2.2: bonusStats strictly contains 4 keys');
  assert(keys.includes('top') && keys.includes('right') && keys.includes('bottom') && keys.includes('left'), '2.2: bonusStats keys match expected');
  assertEqual((({} as any).top), undefined, '2.2: Object prototype not polluted with top');
  assertEqual((({} as any).center), undefined, '2.2: Object prototype not polluted with center');

  // 2.3: Baseline Deck TP & Total TP before allocation
  // Card 1..5 in active deck, Card 6 in reserve
  const basePowerSumDeck = store.activeDeckIds.reduce((sum, id) => sum + store.getCardBasePower(id), 0);
  const basePowerSumTotal = store.ownedCardIds.reduce((sum, id) => sum + store.getCardBasePower(id), 0);

  assertEqual(store.getDeckTP(), basePowerSumDeck, '2.3a: Initial Deck TP matches exact sum of base powers');
  assertEqual(store.getTotalTP(), basePowerSumTotal, '2.3b: Initial Total TP matches exact sum of owned base powers');

  // 2.4: Allocate 1 stat point to 'top' on Card 1 (in active deck)
  const allocTop = store.allocateStat(1, 'top');
  assertEqual(allocTop, true, '2.4a: allocateStat(1, "top") succeeds');
  assertEqual(store.cards[1].statPoints, 1, '2.4b: Card 1 statPoints decreased to 1');
  assertEqual(store.cards[1].bonusStats.top, 1, '2.4c: Card 1 bonusStats.top increased to 1');
  assertEqual(store.cards[1].totalBonus, 1, '2.4d: Card 1 totalBonus is 1');
  assertEqual(store.getDeckTP(), basePowerSumDeck + 1, '2.4e: Deck TP increased by exactly 1');
  assertEqual(store.getTotalTP(), basePowerSumTotal + 1, '2.4f: Total TP increased by exactly 1');

  // 2.5: Allocate 1 stat point to 'right' on Card 1 (in active deck)
  const allocRight = store.allocateStat(1, 'right');
  assertEqual(allocRight, true, '2.5a: allocateStat(1, "right") succeeds');
  assertEqual(store.cards[1].statPoints, 0, '2.5b: Card 1 statPoints decreased to 0');
  assertEqual(store.cards[1].bonusStats.right, 1, '2.5c: Card 1 bonusStats.right increased to 1');
  assertEqual(store.cards[1].totalBonus, 2, '2.5d: Card 1 totalBonus is 2');
  assertEqual(store.hasUnspentPoints(1), false, '2.5e: hasUnspentPoints(1) is now false');
  assertEqual(store.getDeckTP(), basePowerSumDeck + 2, '2.5f: Deck TP increased by exactly 2 total');
  assertEqual(store.getTotalTP(), basePowerSumTotal + 2, '2.5g: Total TP increased by exactly 2 total');

  // 2.6: Allocation attempt when statPoints == 0
  const allocBottom = store.allocateStat(1, 'bottom');
  assertEqual(allocBottom, false, '2.6a: allocateStat(1, "bottom") returns false when statPoints == 0');
  assertEqual(store.cards[1].statPoints, 0, '2.6b: statPoints remains 0 (no underflow)');
  assertEqual(store.cards[1].bonusStats.bottom, 0, '2.6c: bonusStats.bottom remains 0');
  assertEqual(store.cards[1].totalBonus, 2, '2.6d: totalBonus unchanged');
  assertEqual(store.getDeckTP(), basePowerSumDeck + 2, '2.6e: Deck TP unchanged');

  // 2.7: Allocation on an owned card in reserve (NOT in active deck)
  // Card 6 is owned, but not in activeDeckIds ([1, 2, 3, 4, 5])
  assert(!store.activeDeckIds.includes(6), '2.7a: Card 6 is NOT in active deck');
  const nurture6 = store.nurtureCard(6, 100); // 100 EXP -> Level 2 -> 1 stat point
  assertEqual(nurture6.newLevel, 2, '2.7b: Card 6 reached Level 2');
  assertEqual(store.cards[6].statPoints, 1, '2.7c: Card 6 has 1 stat point');

  const deckTPBefore = store.getDeckTP();
  const totalTPBefore = store.getTotalTP();

  const alloc6Left = store.allocateStat(6, 'left');
  assertEqual(alloc6Left, true, '2.7d: allocateStat(6, "left") on reserve card succeeds');
  assertEqual(store.cards[6].bonusStats.left, 1, '2.7e: Card 6 bonusStats.left is 1');
  assertEqual(store.cards[6].totalBonus, 1, '2.7f: Card 6 totalBonus is 1');

  // INVARIANT: Allocating on reserve card must NOT alter Deck TP, but MUST alter Total TP!
  assertEqual(store.getDeckTP(), deckTPBefore, '2.7g: Deck TP remains UNCHANGED when stat is allocated to reserve card');
  assertEqual(store.getTotalTP(), totalTPBefore + 1, '2.7h: Total TP increased by exactly 1 when stat is allocated to reserve card');

  // 2.8: Swap Card 6 into deck slot 0 (replacing Card 1)
  const swapRes = store.setDeckCard(0, 6);
  assertEqual(swapRes, true, '2.8a: Swapped Card 6 into deck slot 0');
  assertEqual(store.activeDeckIds[0], 6, '2.8b: Slot 0 is now Card 6');
  assert(!store.activeDeckIds.includes(1), '2.8c: Card 1 is now in reserve');

  // New expected Deck TP: Card 6, 2, 3, 4, 5
  const expectedNewDeckTP = [6, 2, 3, 4, 5].reduce(
    (sum, id) => sum + store.getCardBasePower(id) + store.cards[id].totalBonus,
    0
  );
  assertEqual(store.getDeckTP(), expectedNewDeckTP, '2.8d: Dynamic Deck TP matches exact formula after card swap');
}

// ============================================================================
// SUITE 3: BATTLE VICTORY EXP INVARIANTS & LEVEL-UP PROGRESSION
// ============================================================================

console.log('\n============================================================');
console.log('SUITE 3: Battle Victory EXP Invariants & Progression Hook');
console.log('============================================================');

{
  const store = createFreshStore([1, 2, 3, 4, 5, 10]);
  // Active deck: [1, 2, 3, 4, 5]

  // Verify clean initial state for deck cards
  for (const id of [1, 2, 3, 4, 5]) {
    assertEqual(store.cards[id].level, 1, `3.1: Initial Card ${id} level is 1`);
    assertEqual(store.cards[id].exp, 0, `3.1: Initial Card ${id} exp is 0`);
    assertEqual(store.cards[id].statPoints, 0, `3.1: Initial Card ${id} statPoints is 0`);
  }

  // 3.1: First battle victory -> award exactly 50 EXP
  const victory1 = store.awardBattleVictoryExp(50);
  assertEqual(victory1.expAwarded, 50, '3.1a: awardBattleVictoryExp returned expAwarded = 50');
  assertEqual(victory1.deckCount, 5, '3.1b: awardBattleVictoryExp returned deckCount = 5');
  assertEqual(victory1.updatedCards.length, 5, '3.1c: 5 cards updated in active squad');

  // Verify all 5 deck cards received exactly 50 EXP and did not level up yet (threshold = 100)
  for (const id of [1, 2, 3, 4, 5]) {
    assertEqual(store.cards[id].exp, 50, `3.1d: Active Deck Card ${id} has exactly 50 EXP`);
    assertEqual(store.cards[id].level, 1, `3.1e: Active Deck Card ${id} still at Level 1`);
    assertEqual(store.cards[id].statPoints, 0, `3.1f: Active Deck Card ${id} has 0 stat points`);
  }

  // Verify reserve owned card (Card 10) received 0 EXP
  assertEqual(store.cards[10].exp, 0, '3.1g: Reserve owned Card 10 received 0 EXP');
  assertEqual(store.cards[10].level, 1, '3.1h: Reserve owned Card 10 level is 1');

  // Verify unowned card (Card 50) received 0 EXP
  assertEqual(store.cards[50].exp, 0, '3.1i: Unowned Card 50 received 0 EXP');

  // 3.2: Second battle victory -> award another 50 EXP (total 100 EXP)
  // Reaches 100 EXP threshold for Level 1 -> level up to Level 2!
  const victory2 = store.awardBattleVictoryExp(50);
  assertEqual(victory2.expAwarded, 50, '3.2a: Second battle victory awarded 50 EXP');

  for (const id of [1, 2, 3, 4, 5]) {
    assertEqual(store.cards[id].level, 2, `3.2b: Active Deck Card ${id} leveled up to Level 2`);
    assertEqual(store.cards[id].exp, 0, `3.2c: Active Deck Card ${id} exp reset to 0 (100 - 100)`);
    assertEqual(store.cards[id].expToNext, 200, `3.2d: Active Deck Card ${id} expToNext updated to 200 (Level 2 * 100)`);
    assertEqual(store.cards[id].statPoints, 1, `3.2e: Active Deck Card ${id} issued +1 stat point`);
    assertEqual(store.hasUnspentPoints(id), true, `3.2f: Active Deck Card ${id} hasUnspentPoints is true (red dot on)`);
  }

  // Reserve Card 10 still has 0 EXP
  assertEqual(store.cards[10].exp, 0, '3.2g: Reserve Card 10 still 0 EXP');
  assertEqual(store.cards[10].statPoints, 0, '3.2h: Reserve Card 10 still 0 stat points');

  // 3.3: Storage persistence check
  // Verify hero_card_nurturing in localStorage matches the updated state
  const rawStorage = mockStorage.getItem(STORAGE_KEY);
  assert(rawStorage !== null, '3.3a: hero_card_nurturing exists in localStorage');
  const parsedStorage = JSON.parse(rawStorage!);
  assertEqual(parsedStorage.cards[1].level, 2, '3.3b: Card 1 Level 2 persisted in localStorage');
  assertEqual(parsedStorage.cards[1].statPoints, 1, '3.3c: Card 1 statPoints persisted in localStorage');
  assertEqual(parsedStorage.cards[10].exp, 0, '3.3d: Card 10 0 EXP persisted in localStorage');

  // 3.4: Repeat Hunting state persistence
  assertEqual(store.isRepeatHuntingActive(), false, '3.4a: Initial isRepeatHuntingActive is false');
  store.setRepeatHunting(true);
  assertEqual(store.isRepeatHuntingActive(), true, '3.4b: isRepeatHuntingActive is true after enable');
  assertEqual(mockStorage.getItem('hero_repeat_hunting'), 'true', '3.4c: hero_repeat_hunting key is "true" in localStorage');
  store.setRepeatHunting(false);
  assertEqual(store.isRepeatHuntingActive(), false, '3.4d: isRepeatHuntingActive is false after disable');
  assertEqual(mockStorage.getItem('hero_repeat_hunting'), 'false', '3.4e: hero_repeat_hunting key is "false" in localStorage');

  // 3.5: Multi-level progression & Level 100 Cap Invariant
  // Award 1,000 EXP to Card 1 directly:
  // Card 1 currently: Level 2, 0/200 EXP, 1 statPoint
  // Lvl 2->3: needs 200 (remains 800) -> statPoints = 2
  // Lvl 3->4: needs 300 (remains 500) -> statPoints = 3
  // Lvl 4->5: needs 400 (remains 100) -> statPoints = 4
  // Lvl 5: exp 100 / 500
  const multiNurture = store.nurtureCard(1, 1000);
  assertEqual(multiNurture.newLevel, 5, '3.5a: Multi-level nurture elevated Card 1 to Level 5');
  assertEqual(store.cards[1].exp, 100, '3.5b: Card 1 remainder EXP is 100');
  assertEqual(store.cards[1].expToNext, 500, '3.5c: Card 1 expToNext is 500 (Level 5 * 100)');
  assertEqual(store.cards[1].statPoints, 4, '3.5d: Card 1 accumulated 4 total unspent stat points');

  // Push Card 1 to Level 100
  // Level 100 requires sum(lvl * 100 for lvl in 5..99)
  // Let's pass a huge amount of EXP to reach 100
  store.nurtureCard(1, 1000000);
  assertEqual(store.cards[1].level, 100, '3.5e: Card 1 reached MAX Level 100');
  assertEqual(store.cards[1].statPoints, 99, '3.5f: Level 100 card has earned 99 total stat points (from 99 level-ups)');

  // Try to award more EXP to Level 100 card
  const postCapNurture = store.nurtureCard(1, 50000);
  assertEqual(postCapNurture.expGained, 0, '3.5g: At Level 100, nurtureCard returns expGained = 0');
  assertEqual(postCapNurture.leveledUp, false, '3.5h: At Level 100, leveledUp = false');
  assertEqual(store.cards[1].level, 100, '3.5i: Level remains strictly capped at 100 (never 101)');
  assertEqual(store.cards[1].statPoints, 99, '3.5j: No surplus stat points granted past Level 100');
}

// ============================================================================
// SUITE 4: ADVERSARIAL ACTIVE DECK CORRUPTION & RESILIENCE
// ============================================================================

console.log('\n============================================================');
console.log('SUITE 4: Active Deck Corruption Recovery & Victory Hook Guard');
console.log('============================================================');

{
  const store = createFreshStore([1, 2, 3, 4, 5]);

  // Artificially inject an unowned card (Card 99) directly into activeDeckIds
  (store as any).activeDeckIds = [1, 2, 3, 4, 99];
  assertEqual(store.isCardOwned(99), false, '4.1a: Card 99 is confirmed unowned');

  // Trigger battle victory EXP
  const victoryInjected = store.awardBattleVictoryExp(50);

  // Verification:
  // 1. ensureValidDeck() must have sanitized activeDeckIds so Card 99 was excluded or replaced
  // 2. Card 99 must NOT have received any EXP
  assertEqual(store.cards[99].exp, 0, '4.1b: Injected unowned Card 99 received 0 EXP');
  assertEqual(store.cards[99].level, 1, '4.1c: Injected unowned Card 99 level remains 1');
  assertEqual(victoryInjected.updatedCards.includes(99), false, '4.1d: Card 99 is NOT in updatedCards list');
  assert(!store.activeDeckIds.includes(99), '4.1e: ensureValidDeck() purged unowned Card 99 from active squad');
  assertEqual(store.activeDeckIds.length, 5, '4.1f: Active squad remains exactly 5 valid owned cards');
}

// ============================================================================
// Summary & Verdict
// ============================================================================

console.log('\n============================================================');
console.log(`TOTAL ASSERTIONS: ${totalAssertions}`);
console.log(`PASSED: ${passedAssertions}`);
console.log(`FAILED: ${failedAssertions}`);
console.log('============================================================');

if (failedAssertions > 0) {
  console.error('\nFAILURE DETAILS:');
  failureMessages.forEach((msg, idx) => console.error(`${idx + 1}. ${msg}`));
  process.exit(1);
} else {
  console.log('\n>>> ALL EMPIRICAL CHALLENGE ASSERTIONS PASSED (100.0%) <<<');
  process.exit(0);
}
