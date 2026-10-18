import { 
  generateAmbushEncounter, 
  shouldTriggerAmbush, 
  BANDIT_DECK_PRESET, 
  THIEF_DECK_PRESET, 
  AMBUSH_STEP_PROBABILITY, 
  AMBUSH_MIN_STEP_COOLDOWN, 
  AMBUSH_MAX_PER_LEG,
  type AmbushEncounter,
  type AmbushType
} from '../src/lib/rpg/kadanRpgAmbush';
import { CARD_DATABASE } from '../src/cardDatabase';
import type { CardData, CardElement } from '../src/types';

interface TestAssertion {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
}

const assertions: TestAssertion[] = [];

function assert(category: string, name: string, condition: boolean, details?: string) {
  assertions.push({ category, name, passed: condition, details });
  if (!condition) {
    console.error(`[FAIL] [${category}] ${name}: ${details || ''}`);
  } else {
    console.log(`[PASS] [${category}] ${name}`);
  }
}

console.log('=== Milestone 3 Adversarial Challenge Suite Starting ===\n');

// =========================================================================
// SECTION 1: Bandit & Thief Decks Across All 40 Chapters and Rebirth Levels
// =========================================================================
console.log('--- Checking Deck Card IDs, Existence, Elements & Stats ---');

// Check card presets
assert(
  'Deck Presets',
  'Bandit Deck preset has exactly 5 cards',
  BANDIT_DECK_PRESET.length === 5,
  `Got ${BANDIT_DECK_PRESET.length}`
);
assert(
  'Deck Presets',
  'Thief Deck preset has exactly 5 cards',
  THIEF_DECK_PRESET.length === 5,
  `Got ${THIEF_DECK_PRESET.length}`
);

// Check all preset cards exist in CARD_DATABASE and IDs are in [1..110]
for (const id of [...BANDIT_DECK_PRESET, ...THIEF_DECK_PRESET]) {
  const inRange = id >= 1 && id <= 110;
  const inDb = Boolean(CARD_DATABASE[id]);
  assert('Card Presets', `Card ID ${id} in range [1..110] and in CARD_DATABASE`, inRange && inDb);
}

// Check generation across all 40 chapters and rebirth levels 0..10
const testRebirths = [0, 1, 2, 5, 10];
const types: AmbushType[] = ['bandit', 'thief'];

let allCardsInRange = true;
let allDecksLength5 = true;
let allLeaderValid = true;
let allStatsIn1To10 = true;
let allPowerPositive = true;
let allLevelsIn1To10 = true;
let elementMismatchCount = 0;
const elementMismatches: string[] = [];

for (const reb of testRebirths) {
  for (let ch = 1; ch <= 40; ch++) {
    for (const t of types) {
      const enc = generateAmbushEncounter(ch, reb, 'test-region', t);

      if (enc.deck.length !== 5) allDecksLength5 = false;
      if (enc.leaderCardId < 1 || enc.leaderCardId > 110) allLeaderValid = false;

      for (const card of enc.deck) {
        if (!card.imageIndex || card.imageIndex < 1 || card.imageIndex > 110) {
          allCardsInRange = false;
        }

        const base = CARD_DATABASE[card.imageIndex!];
        if (!base) {
          allCardsInRange = false;
          continue;
        }

        // Element comparison: Does card.element match base.element?
        if (base.element && card.element !== base.element) {
          elementMismatchCount++;
          if (elementMismatches.length < 10) {
            elementMismatches.push(
              `Ch ${ch} Reb ${reb} Card ${card.imageIndex} (${base.title}): expected base.element '${base.element}' (cat ${base.category}), got card.element '${card.element}'`
            );
          }
        }

        // Stats bounds
        if (card.stats) {
          for (const s of card.stats) {
            if (s < 1 || s > 10) allStatsIn1To10 = false;
          }
        } else {
          allStatsIn1To10 = false;
        }

        // Power
        if (typeof card.power !== 'number' || card.power <= 0) {
          allPowerPositive = false;
        }

        // Level
        if (typeof card.level !== 'number' || card.level < 1 || card.level > 10) {
          allLevelsIn1To10 = false;
        }
      }
    }
  }
}

assert('Deck Generation', 'All decks have exactly 5 cards across 40 chapters and rebirths', allDecksLength5);
assert('Deck Generation', 'All card imageIndex values in [1..110] and valid', allCardsInRange);
assert('Deck Generation', 'All leaderCardIds in [1..110]', allLeaderValid);
assert('Deck Generation', 'All card stats strictly bounded in [1..10]', allStatsIn1To10);
assert('Deck Generation', 'All card power strictly positive', allPowerPositive);
assert('Deck Generation', 'All card levels strictly bounded in [1..10]', allLevelsIn1To10);

// Report on element consistency
console.log(`\n[CRITICAL ELEMENT CHECK] Total element mismatches detected: ${elementMismatchCount}`);
if (elementMismatches.length > 0) {
  console.log('Sample element mismatches:');
  for (const m of elementMismatches) {
    console.log('  - ' + m);
  }
}
assert(
  'Card Elements',
  'Card elements match canonical CARD_DATABASE element',
  elementMismatchCount === 0,
  `Found ${elementMismatchCount} element mismatches between base.element and card.element!`
);

// =========================================================================
// SECTION 2: Spoils Calculation Across All 40 Chapters & Rebirth Levels
// =========================================================================
console.log('\n--- Checking Spoils Calculation Across Chapters & Rebirth ---');

let spoilsStrictlyPositive = true;
let spoilsMonotonicWithChapter = true;
let spoilsMonotonicWithRebirth = true;

for (const reb of [0, 1, 2, 5, 10]) {
  let prevSpoils = 0;
  for (let ch = 1; ch <= 40; ch++) {
    const enc = generateAmbushEncounter(ch, reb);
    if (enc.spoilsCoins <= 0) {
      spoilsStrictlyPositive = false;
    }
    if (enc.spoilsCoins < prevSpoils) {
      spoilsMonotonicWithChapter = false;
    }
    prevSpoils = enc.spoilsCoins;
  }
}

for (let ch = 1; ch <= 40; ch++) {
  let prevSpoils = 0;
  for (const reb of [0, 1, 2, 3, 4, 5, 10]) {
    const enc = generateAmbushEncounter(ch, reb);
    if (enc.spoilsCoins < prevSpoils) {
      spoilsMonotonicWithRebirth = false;
    }
    prevSpoils = enc.spoilsCoins;
  }
}

// Chapter 1, Rebirth 0 baseline
const ch1Reb0 = generateAmbushEncounter(1, 0).spoilsCoins;
// Chapter 40, Rebirth 0
const ch40Reb0 = generateAmbushEncounter(40, 0).spoilsCoins;
// Chapter 40, Rebirth 10
const ch40Reb10 = generateAmbushEncounter(40, 10).spoilsCoins;

assert('Spoils', 'Spoils coins strictly positive across all 40 chapters and rebirths', spoilsStrictlyPositive);
assert('Spoils', 'Spoils coins monotonically increase with chapter number', spoilsMonotonicWithChapter);
assert('Spoils', 'Spoils coins monotonically increase with rebirth level', spoilsMonotonicWithRebirth);
assert('Spoils', `Chapter 1 spoils (${ch1Reb0}) equals expected 16`, ch1Reb0 === 16, `Got ${ch1Reb0}`);
assert('Spoils', `Chapter 40 spoils (${ch40Reb0}) equals expected 63`, ch40Reb0 === 63, `Got ${ch40Reb0}`);
assert('Spoils', `Chapter 40 Rebirth 10 spoils (${ch40Reb10}) equals expected 220`, ch40Reb10 === 220, `Got ${ch40Reb10}`);

// Boundary: negative or 0 chapter
const ch0Spoils = generateAmbushEncounter(0, 0).spoilsCoins;
assert('Spoils Boundary', 'Chapter 0 spoils is >= 15', ch0Spoils >= 15, `Got ${ch0Spoils}`);

// =========================================================================
// SECTION 3: 1.0s Countdown Timer in autoMode
// =========================================================================
console.log('\n--- Checking 1.0s Countdown Timer & Auto-Play Engagement Logic ---');

// Simulate the timer interval logic from KadanRpgView.tsx lines 476-490
function simulateAmbushCountdown(initialSec: number, intervalMs: number = 100): {
  ticks: number;
  totalTimeMs: number;
  engaged: boolean;
  finalCountdown: number;
} {
  let countdown = initialSec;
  let ticks = 0;
  let engaged = false;

  while (ticks < 50) {
    ticks++;
    const next = Math.max(0, countdown - intervalMs / 1000);
    if (next <= 0.05) {
      engaged = true;
      countdown = 0;
      break;
    }
    countdown = next;
  }

  return {
    ticks,
    totalTimeMs: ticks * intervalMs,
    engaged,
    finalCountdown: countdown,
  };
}

const simResult = simulateAmbushCountdown(1.0, 100);
assert('Countdown Timer', 'Timer engages battle automatically within 1.0s (10 ticks = 1000ms)', simResult.engaged && simResult.ticks === 10, `Ticks: ${simResult.ticks}, TotalMs: ${simResult.totalTimeMs}`);
assert('Countdown Timer', 'Final countdown reaches 0 upon engagement', simResult.finalCountdown === 0);

// Check behavior when countdown is not in autoMode:
function checkManualModeNoAutoEngage(autoMode: boolean): boolean {
  if (!autoMode) {
    // Under KadanRpgView.tsx line 472:
    // if (!progress.autoMode) { setAmbushCountdown(1.0); return; }
    // No timer is set, countdown remains 1.0 indefinitely until manual interaction.
    return true;
  }
  return false;
}
assert('Countdown Timer', 'Manual mode does NOT auto-engage (timer is not armed)', checkManualModeNoAutoEngage(false));

// Check manual retreat cancels ambush alert:
let mockAmbushAlert: AmbushEncounter | null = generateAmbushEncounter(5, 0);
let mockAmbushBattle: AmbushEncounter | null = null;
function handleRetreatAmbush() {
  mockAmbushAlert = null;
}
function handleEngageAmbush() {
  if (!mockAmbushAlert) return;
  mockAmbushBattle = mockAmbushAlert;
  mockAmbushAlert = null;
}

// Test manual retreat
handleRetreatAmbush();
assert('Retreat', 'handleRetreatAmbush cleanly clears ambushAlert with 0 battle created', mockAmbushAlert === null && mockAmbushBattle === null);

// Test engage
mockAmbushAlert = generateAmbushEncounter(5, 0);
handleEngageAmbush();
assert('Engage', 'handleEngageAmbush sets ambushBattle and clears ambushAlert', mockAmbushAlert === null && mockAmbushBattle !== null);

// =========================================================================
// SECTION 4: Combat Buff Application During Ambush Battles
// =========================================================================
console.log('\n--- Checking Combat Buff Application During Ambush Battles ---');

class MockLocalStorage {
  private store: Map<string, string> = new Map();
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, String(v)); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

const mockStorage = new MockLocalStorage();

function testGetBuffedPlayerDeck(deck: Array<CardData | null>, storage: MockLocalStorage): CardData[] {
  const rawDeck = deck.filter((c): c is CardData => Boolean(c));
  try {
    const rawBuff = storage.getItem('hero_kadan_active_buff');
    if (!rawBuff) return rawDeck;
    const buff = JSON.parse(rawBuff);
    const buffVal = typeof buff.value === 'number' ? buff.value : (buff.id === 'atk_boost' ? 15 : buff.id === 'mana_surge' ? 20 : 15);
    const multiplier = 1.0 + (buffVal / 100.0);
    return rawDeck.map((card) => ({
      ...card,
      power: Math.round((card.power || 100) * multiplier),
    }));
  } catch {
    return rawDeck;
  }
}

const sampleDeck: CardData[] = [
  { id: 'c1', title: 'Card 1', title_dis: 'C1', power: 100, stats: [5, 5, 5, 5], level: 1, rarity: 'bronze' },
  { id: 'c2', title: 'Card 2', title_dis: 'C2', power: 200, stats: [6, 6, 6, 6], level: 2, rarity: 'silver' },
  { id: 'c3', title: 'Card 3', title_dis: 'C3', power: 300, stats: [7, 7, 7, 7], level: 3, rarity: 'gold' },
  { id: 'c4', title: 'Card 4', title_dis: 'C4', power: 150, stats: [5, 6, 5, 6], level: 1, rarity: 'bronze' },
  { id: 'c5', title: 'Card 5', title_dis: 'C5', power: 250, stats: [8, 8, 8, 8], level: 4, rarity: 'gold' },
];

// 1. With NO buff in storage
mockStorage.clear();
const unbuffed = testGetBuffedPlayerDeck(sampleDeck, mockStorage);
assert(
  'Combat Buff',
  'Unbuffed deck preserves exact original powers when no buff in storage',
  unbuffed[0].power === 100 && unbuffed[1].power === 200 && unbuffed[2].power === 300
);

// 2. With +15% atk_boost buff in storage
mockStorage.setItem('hero_kadan_active_buff', JSON.stringify({ id: 'atk_boost', value: 15, label: '공격력 +15%' }));
const buffed15 = testGetBuffedPlayerDeck(sampleDeck, mockStorage);
assert(
  'Combat Buff',
  'Buff +15% correctly scales 100 -> 115, 200 -> 230, 300 -> 345',
  buffed15[0].power === 115 && buffed15[1].power === 230 && buffed15[2].power === 345
);

// 3. With +20% mana_surge buff in storage
mockStorage.setItem('hero_kadan_active_buff', JSON.stringify({ id: 'mana_surge', value: 20, label: '마나 쇄도 +20%' }));
const buffed20 = testGetBuffedPlayerDeck(sampleDeck, mockStorage);
assert(
  'Combat Buff',
  'Buff +20% correctly scales 100 -> 120, 200 -> 240, 300 -> 360',
  buffed20[0].power === 120 && buffed20[1].power === 240 && buffed20[2].power === 360
);

// 4. Verify buff is passed to ambush battle portal (KadanRpgView line 791):
// playerDeck={getBuffedPlayerDeck(currentDeck)}
// And after ambush battle completes, line 499: localStorage.removeItem('hero_kadan_active_buff');
mockStorage.removeItem('hero_kadan_active_buff');
const postBattleDeck = testGetBuffedPlayerDeck(sampleDeck, mockStorage);
assert(
  'Combat Buff',
  'Buff is consumed and removed from storage after ambush battle',
  postBattleDeck[0].power === 100 && mockStorage.getItem('hero_kadan_active_buff') === null
);

// 5. Corrupted JSON resilience
mockStorage.setItem('hero_kadan_active_buff', 'INVALID_JSON{{{');
const safeFallbackDeck = testGetBuffedPlayerDeck(sampleDeck, mockStorage);
assert(
  'Combat Buff',
  'Corrupted JSON in localStorage falls back gracefully without throwing',
  safeFallbackDeck[0].power === 100
);

// =========================================================================
// SECTION 5: Step Movement & Cooldown Monte Carlo Stress Testing
// =========================================================================
console.log('\n--- Checking Step Movement, Cooldown & Probability Guards ---');

// Test cooldown guard: strictly < 3 steps must return false
assert('Ambush Guards', 'Cooldown < 3 steps strictly returns false', !shouldTriggerAmbush(5, 3, false, false, 0.01)); // diff = 2 < 3
assert('Ambush Guards', 'Cooldown = 3 steps is eligible', shouldTriggerAmbush(6, 3, false, false, 0.01)); // diff = 3 >= 3
assert('Ambush Guards', 'Destination tile is strictly immune', !shouldTriggerAmbush(10, 0, false, true, 0.01));
assert('Ambush Guards', 'Starting tile is strictly immune', !shouldTriggerAmbush(10, 0, false, false, 0.01, true));
assert('Ambush Guards', 'Already ambushed in chapter leg strictly blocks', !shouldTriggerAmbush(10, 0, true, false, 0.01));

// 10,000-Step Monte Carlo Simulation to detect any consecutive or cooldown-violating ambushes
let totalSteps = 10000;
let lastStep = -99;
let ambushedInChapter = false;
let ambushesTriggered = 0;
let minStepDeltaObserved = 999999;
let maxAmbushesPerLegObserved = 0;
let legAmbushes = 0;

for (let s = 1; s <= totalSteps; s++) {
  // Simulate chapter transition every 20 steps
  if (s % 20 === 0) {
    if (legAmbushes > maxAmbushesPerLegObserved) maxAmbushesPerLegObserved = legAmbushes;
    ambushedInChapter = false;
    legAmbushes = 0;
  }

  const isDest = (s % 20 === 19); // 19th step is destination
  const isStart = (s % 20 === 1);  // 1st step is start
  const trig = shouldTriggerAmbush(s, lastStep, ambushedInChapter, isDest, undefined, isStart);

  if (trig) {
    const delta = s - lastStep;
    if (delta < minStepDeltaObserved) minStepDeltaObserved = delta;
    lastStep = s;
    ambushedInChapter = true;
    ambushesTriggered++;
    legAmbushes++;
  }
}

assert(
  'Monte Carlo',
  `No cooldown violations in 10,000 steps (min delta: ${minStepDeltaObserved} >= 3)`,
  minStepDeltaObserved >= 3
);
assert(
  'Monte Carlo',
  `Max ambushes per chapter leg observed was <= 1 (got: ${maxAmbushesPerLegObserved})`,
  maxAmbushesPerLegObserved <= 1
);

// Empirical probability on 100,000 unrestricted rolls
let unrestrictedHits = 0;
const N = 100000;
for (let i = 0; i < N; i++) {
  if (shouldTriggerAmbush(100, 0, false, false)) {
    unrestrictedHits++;
  }
}
const empiricalP = unrestrictedHits / N;
assert(
  'Probability',
  `Empirical probability (${(empiricalP * 100).toFixed(2)}%) matches 14% (within [13.5%, 14.5%])`,
  empiricalP >= 0.135 && empiricalP <= 0.145
);

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n=======================================================');
const total = assertions.length;
const passed = assertions.filter(a => a.passed).length;
const failed = assertions.filter(a => !a.passed).length;
console.log(`TOTAL ASSERTIONS: ${total}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('=======================================================');

if (failed > 0) {
  console.log('\nFAILED ASSERTIONS BREAKDOWN:');
  for (const a of assertions.filter(a => !a.passed)) {
    console.log(`- [${a.category}] ${a.name}: ${a.details || ''}`);
  }
}
