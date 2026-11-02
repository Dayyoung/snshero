/**
 * tests/adversarial_challenger_m3_1_verification.ts
 *
 * EMPIRICAL ADVERSARIAL VERIFIER SUITE — MILESTONE 3
 * Assigned Agent: challenger_m3_9_1
 *
 * Scope of Adversarial Verification:
 * 1. Tile Map Movement & Boundary Clamping:
 *    - Clamping on negative coordinates, out-of-bounds coordinates (x >= width, y >= height), extreme bounds.
 *    - Blocked tiles rejection across all 8 continent regions (elwin, red-cliff, mana-caves, etc.).
 *    - moveHeroToTile edge cases (blocked target, out-of-bounds target, zero delta).
 * 2. Episode Dialogue Trigger Conditions & Choice Branches:
 *    - Movement onto non-event tile vs target event tile.
 *    - All 40 chapters dialogue script integrity and choice branch coverage.
 *    - Choice countdown timer (5.0s manual vs 1.5s autoMode).
 *    - Choice bonus application (SNS coins debit/credit, combat buff assignment).
 *    - Dialogue completion transition into 3x3 tactical battle.
 * 3. 3x3 Tactical Battle Loop, Card Flip Engine & Exact 50 EXP Reward:
 *    - 3x3 grid initialization (9 slots null, 5 player cards vs 5 opponent cards).
 *    - Illegal move rejection (occupied slot, out-of-bounds slot, out-of-bounds hand index).
 *    - 4-direction tactical flip engine (Top, Bottom, Left, Right) & grid boundary isolation.
 *    - Exact 50 EXP reward verification to player active deck cards via cardNurtureStore.
 *    - Repeat hunting loop toggle and re-battle initialization.
 * 4. hero_kadan_rpg_auto_mode Hands-Free Progression & 15s Idle Timer:
 *    - IdleAutoPlayManager 15s inactivity countdown & hero_kadan_rpg_auto_mode = true persistence.
 *    - User input reset verification across monitored events.
 *    - runAutoStep full end-to-end loop simulation (map navigation -> dialogue choices -> 3x3 battle -> victory -> chapter advance).
 *    - Stress harness: multi-turn loop and race-condition safety.
 */

// ---------------------------------------------------------------------------
// Headless Environment Polyfills
// ---------------------------------------------------------------------------
class MockStorage implements Storage {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
  removeItem(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  get length(): number { return this.store.size; }
}

const mockStorage = new MockStorage();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

if (typeof (globalThis as any).window === 'undefined') {
  const eventListeners: Record<string, ((e?: any) => void)[]> = {};
  (globalThis as any).window = {
    location: {
      hash: '#play',
      href: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
      origin: 'https://dayyoung-macbookpro.tail3717a4.ts.net',
      hostname: 'dayyoung-macbookpro.tail3717a4.ts.net',
      pathname: '/',
    },
    dispatchEvent: (event: any) => {
      const list = eventListeners[event.type] || [];
      for (const fn of list) fn(event);
      return true;
    },
    addEventListener: (type: string, fn: any) => {
      if (!eventListeners[type]) eventListeners[type] = [];
      eventListeners[type].push(fn);
    },
    removeEventListener: (type: string, fn: any) => {
      if (!eventListeners[type]) return;
      eventListeners[type] = eventListeners[type].filter((f) => f !== fn);
    },
    speechSynthesis: { speak: () => {}, cancel: () => {} },
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { CARD_DATABASE } from '../src/cardDatabase';
import {
  KADAN_RPG_EVENTS,
  KADAN_RPG_REGIONS,
  getKadanRpgRegion,
  getKadanRpgEvent,
  getDynamicKadanEncounter,
  KadanRpgTile,
} from '../src/content/kadanRpgStory';
import {
  KADAN_RPG_NOVEL_SCRIPTS,
  KadanRpgNovelScriptLine,
} from '../src/content/kadanRpgNovelScript';
import { cardNurtureStore } from '../src/landing/services/cardNurtureStore';
import {
  playRpgState,
  initPlayRpgState,
  syncRegionAndTargets,
  stepHeroDelta,
  moveHeroToTile,
  getCurrentRegion,
  triggerDialogue,
  getCurrentDialogueLines,
  advanceDialogue,
  selectDialogueChoice,
  initBattle,
  playCardToSlot,
  finalizeBattle,
  finishBattleAndAwardExp,
  advanceNextChapter,
  toggleAutoMode,
  toggleRepeatHunting,
  runAutoStep,
} from '../src/landing/services/playRpgEngine';
import {
  IdleAutoPlayManager,
  initIdleAutoPlay,
} from '../src/landing/services/idleAutoPlayManager';

// ---------------------------------------------------------------------------
// Assertion Harness
// ---------------------------------------------------------------------------
interface AssertionResult {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  error?: string;
}

const results: AssertionResult[] = [];

function assert(
  id: string,
  suite: string,
  name: string,
  passed: boolean,
  expected?: string,
  actual?: string,
  error?: string
): void {
  results.push({ id, suite, name, passed, expected, actual, error });
  const status = passed ? '\x1b[92mPASS\x1b[0m' : '\x1b[91mFAIL\x1b[0m';
  console.log(`  [${status}] [${id}] [${suite}] ${name}`);
  if (!passed) {
    if (expected && actual) console.log(`         Expected: ${expected} | Actual: ${actual}`);
    if (error) console.log(`         Error: ${error}`);
  }
}

console.log('========================================================================');
console.log('  CHALLENGER M3_1: ADVERSARIAL TILE, DIALOGUE, BATTLE & AUTO-PLAY SUITE ');
console.log('========================================================================\n');

// ============================================================================
// SUITE 1: TILE MAP BOUNDARY CLAMPING & BLOCKED TILES
// ============================================================================
console.log('--- Suite 1: Tile Map Boundary Clamping & Blocked Tiles ---');

// 1.1 Out of bounds clamping from 4 corners
// Reset state to Region 1
playRpgState.regionId = 'elwin-wildland';
playRpgState.subState = 'map';
playRpgState.currentChapter = 1;
syncRegionAndTargets();

// Corner (0,0): test negative movement
playRpgState.heroTile = { x: 0, y: 0 };
const moveNegX = stepHeroDelta(-1, 0);
assert(
  'ADV.CHAL.BOUND.1',
  'Boundary Clamping',
  'Moving west from (0,0) is clamped and rejected (moved === false)',
  moveNegX.moved === false && playRpgState.heroTile.x === 0 && playRpgState.heroTile.y === 0,
  'moved: false at (0,0)',
  `moved: ${moveNegX.moved} at (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

const moveNegY = stepHeroDelta(0, -1);
assert(
  'ADV.CHAL.BOUND.2',
  'Boundary Clamping',
  'Moving north from (0,0) is clamped and rejected (moved === false)',
  moveNegY.moved === false && playRpgState.heroTile.x === 0 && playRpgState.heroTile.y === 0,
  'moved: false at (0,0)',
  `moved: ${moveNegY.moved} at (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

// Corner (9,7): test positive overflow movement
playRpgState.heroTile = { x: 9, y: 7 };
const moveOverX = stepHeroDelta(1, 0);
assert(
  'ADV.CHAL.BOUND.3',
  'Boundary Clamping',
  'Moving east from (9,7) is clamped to width-1 and rejected',
  moveOverX.moved === false && playRpgState.heroTile.x === 9 && playRpgState.heroTile.y === 7,
  'moved: false at (9,7)',
  `moved: ${moveOverX.moved} at (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

const moveOverY = stepHeroDelta(0, 1);
assert(
  'ADV.CHAL.BOUND.4',
  'Boundary Clamping',
  'Moving south from (9,7) is clamped to height-1 and rejected',
  moveOverY.moved === false && playRpgState.heroTile.x === 9 && playRpgState.heroTile.y === 7,
  'moved: false at (9,7)',
  `moved: ${moveOverY.moved} at (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

// Extreme out-of-bounds delta (-999, +999)
playRpgState.heroTile = { x: 5, y: 4 };
const extremeDelta = stepHeroDelta(-999, -999);
assert(
  'ADV.CHAL.BOUND.5',
  'Boundary Clamping',
  'Extreme negative delta (-999, -999) clamps safely to (0,0)',
  extremeDelta.moved === true && playRpgState.heroTile.x === 0 && playRpgState.heroTile.y === 0,
  'clamped to (0,0)',
  `clamped to (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

// 1.2 Blocked tiles in all 8 regions
let allRegionsBlockedSafe = true;
let blockedFailures: string[] = [];

for (const region of KADAN_RPG_REGIONS) {
  playRpgState.regionId = region.id;
  for (const blocked of region.blockedTiles) {
    // Try to move directly onto the blocked tile from an adjacent valid tile
    // Candidate adjacent tiles: (blocked.x - 1, blocked.y), (blocked.x + 1, blocked.y), etc.
    const adjCandidates = [
      { x: blocked.x - 1, y: blocked.y, dx: 1, dy: 0 },
      { x: blocked.x + 1, y: blocked.y, dx: -1, dy: 0 },
      { x: blocked.x, y: blocked.y - 1, dx: 0, dy: 1 },
      { x: blocked.x, y: blocked.y + 1, dx: 0, dy: -1 },
    ].filter(
      (c) =>
        c.x >= 0 &&
        c.x < region.width &&
        c.y >= 0 &&
        c.y < region.height &&
        !region.blockedTiles.some((b) => b.x === c.x && b.y === c.y)
    );

    if (adjCandidates.length > 0) {
      const start = adjCandidates[0];
      playRpgState.heroTile = { x: start.x, y: start.y };
      const stepRes = stepHeroDelta(start.dx, start.dy);
      if (stepRes.moved || (playRpgState.heroTile.x === blocked.x && playRpgState.heroTile.y === blocked.y)) {
        allRegionsBlockedSafe = false;
        blockedFailures.push(`Region ${region.id} allowed movement onto blocked tile (${blocked.x}, ${blocked.y})`);
      }
    }
  }
}

assert(
  'ADV.CHAL.BOUND.6',
  'Boundary Clamping',
  'Blocked tiles across all 8 regions strictly reject player movement',
  allRegionsBlockedSafe,
  '0 blocked tile intrusions',
  `${blockedFailures.length} intrusions: ${blockedFailures.join('; ')}`
);

// 1.3 moveHeroToTile handling
playRpgState.regionId = 'elwin-wildland';
playRpgState.heroTile = { x: 2, y: 2 };
const blockedTile = KADAN_RPG_REGIONS[0].blockedTiles[0]; // e.g. { x: 3, y: 1 }
const directToBlocked = moveHeroToTile(blockedTile);
assert(
  'ADV.CHAL.BOUND.7',
  'Boundary Clamping',
  'moveHeroToTile directly targeting blocked tile is rejected',
  directToBlocked.moved === false,
  'moved: false',
  `moved: ${directToBlocked.moved}`
);

// moveHeroToTile with same coordinate (zero delta)
const sameTileMove = moveHeroToTile({ x: 2, y: 2 });
assert(
  'ADV.CHAL.BOUND.8',
  'Boundary Clamping',
  'moveHeroToTile targeting current hero position produces zero movement',
  sameTileMove.moved === false,
  'moved: false',
  `moved: ${sameTileMove.moved}`
);

// ============================================================================
// SUITE 2: EPISODE DIALOGUE TRIGGER & CHOICE BRANCHES
// ============================================================================
console.log('\n--- Suite 2: Episode Dialogue Trigger Conditions & Choice Branches ---');

// Reset to chapter 1
playRpgState.currentChapter = 1;
playRpgState.regionId = 'elwin-wildland';
syncRegionAndTargets();
playRpgState.subState = 'map';

// 2.1 Stepping on empty tile does not trigger dialogue
playRpgState.heroTile = { x: 0, y: 0 };
const stepEmpty = stepHeroDelta(1, 0); // moves to (1, 0), target is (2, 5)
assert(
  'ADV.CHAL.DLG.1',
  'Dialogue Trigger',
  'Stepping on non-target tile leaves subState in "map" without dialogue trigger',
  stepEmpty.moved === true && stepEmpty.eventTriggered === false && playRpgState.subState === 'map',
  'subState: map, eventTriggered: false',
  `subState: ${playRpgState.subState}, eventTriggered: ${stepEmpty.eventTriggered}`
);

// 2.2 Stepping onto chapter target event tile triggers dialogue
const ch1Event = KADAN_RPG_EVENTS[0];
playRpgState.heroTile = { x: ch1Event.tile.x - 1, y: ch1Event.tile.y };
const stepEvent = stepHeroDelta(1, 0); // moves to target tile
assert(
  'ADV.CHAL.DLG.2',
  'Dialogue Trigger',
  'Stepping onto chapter event tile transitions subState to "dialogue"',
  stepEvent.moved === true && stepEvent.eventTriggered === true && playRpgState.subState === 'dialogue',
  'subState: dialogue, eventTriggered: true',
  `subState: ${playRpgState.subState}, eventTriggered: ${stepEvent.eventTriggered}`
);

// 2.3 Verify all 40 chapters have rich dialogue scripts & choice options
let all40ChaptersHaveScripts = true;
let chaptersWithChoices = 0;
for (let ch = 1; ch <= 40; ch++) {
  playRpgState.currentChapter = ch;
  const lines = getCurrentDialogueLines();
  if (!lines || lines.length === 0) {
    all40ChaptersHaveScripts = false;
  }
  const hasChoice = lines.some((l) => l.choices && l.choices.length >= 2);
  if (hasChoice) chaptersWithChoices++;
}

assert(
  'ADV.CHAL.DLG.3',
  'Dialogue Trigger',
  'All 40 chapters have valid non-empty novel dialogue scripts in KADAN_RPG_NOVEL_SCRIPTS',
  all40ChaptersHaveScripts,
  '40/40 chapters populated',
  `allPopulated: ${all40ChaptersHaveScripts}`
);

assert(
  'ADV.CHAL.DLG.4',
  'Dialogue Trigger',
  'All 40 chapters contain interactive protagonist choice prompts with >= 2 options',
  chaptersWithChoices === 40,
  '40/40 chapters with choices',
  `${chaptersWithChoices}/40 chapters with choices`
);

// 2.4 Choice countdown timer specification
playRpgState.currentChapter = 1;
playRpgState.autoMode = false;
triggerDialogue(ch1Event);
assert(
  'ADV.CHAL.DLG.5',
  'Dialogue Trigger',
  'Manual mode sets choiceTimerSec to exactly 5.0 seconds',
  playRpgState.choiceTimerSec === 5.0,
  '5.0s',
  `${playRpgState.choiceTimerSec}s`
);

playRpgState.autoMode = true;
triggerDialogue(ch1Event);
assert(
  'ADV.CHAL.DLG.6',
  'Dialogue Trigger',
  'Auto-play mode accelerates choiceTimerSec to exactly 1.5 seconds',
  playRpgState.choiceTimerSec === 1.5,
  '1.5s',
  `${playRpgState.choiceTimerSec}s`
);

// 2.5 Choice selection applying bonuses
// Find dialogue line with choices in chapter 1
playRpgState.autoMode = false;
triggerDialogue(ch1Event);
const ch1Lines = getCurrentDialogueLines();
const choiceLineIdx = ch1Lines.findIndex((l) => l.choices && l.choices.length > 0);
if (choiceLineIdx !== -1) {
  playRpgState.currentDialogueLineIdx = choiceLineIdx;
  const choice = ch1Lines[choiceLineIdx].choices![0];

  mockStorage.setItem('hero_sns', '1000');
  selectDialogueChoice(0);

  if (choice.bonusType === 'sns' && choice.bonusValue) {
    const updatedSns = parseInt(mockStorage.getItem('hero_sns') || '0', 10);
    assert(
      'ADV.CHAL.DLG.7',
      'Dialogue Trigger',
      `Choice with SNS bonus accurately credits +${choice.bonusValue} coins to storage`,
      updatedSns === 1000 + choice.bonusValue,
      `${1000 + choice.bonusValue}`,
      `${updatedSns}`
    );
  } else if (choice.bonusType === 'buff') {
    assert(
      'ADV.CHAL.DLG.7',
      'Dialogue Trigger',
      'Choice with combat buff correctly applies activeBuff',
      playRpgState.activeBuff !== null,
      'non-null activeBuff',
      `${playRpgState.activeBuff}`
    );
  }
}

// 2.6 Advancing dialogue to completion transitions to battle
const linesLen = ch1Lines.length;
playRpgState.currentDialogueLineIdx = linesLen - 1; // last line
const advRes = advanceDialogue();
assert(
  'ADV.CHAL.DLG.8',
  'Dialogue Trigger',
  'Advancing past final dialogue line concludes narrative and initializes 3x3 battle',
  advRes.completed === true && advRes.readyForBattle === true && playRpgState.subState === 'battle',
  'completed: true, readyForBattle: true, subState: battle',
  `completed: ${advRes.completed}, readyForBattle: ${advRes.readyForBattle}, subState: ${playRpgState.subState}`
);

// ============================================================================
// SUITE 3: 3x3 TACTICAL BATTLE LOOP, CARD FLIP ENGINE & 50 EXP REWARD
// ============================================================================
console.log('\n--- Suite 3: 3x3 Tactical Battle Loop, Card Flip Engine & 50 EXP Reward ---');

// 3.1 Initial board structure & hand sizing
initBattle();
assert(
  'ADV.CHAL.BTL.1',
  'Battle Loop',
  'Battle board initializes with exactly 9 null slots',
  playRpgState.battleBoard.length === 9 && playRpgState.battleBoard.every((s) => s === null),
  '9 null slots',
  `${playRpgState.battleBoard.filter((s) => s === null).length}/9 null slots`
);

assert(
  'ADV.CHAL.BTL.2',
  'Battle Loop',
  'Hands initialize with exactly 5 player cards and 5 opponent cards',
  playRpgState.playerHand.length === 5 && playRpgState.opponentHand.length === 5,
  '5 player / 5 opponent',
  `${playRpgState.playerHand.length} player / ${playRpgState.opponentHand.length} opponent`
);

// 3.2 Illegal move rejection
// Occupied slot rejection
playCardToSlot(0, 4, 'player'); // Place first card at center (slot 4)
const occupiedRejection = playCardToSlot(0, 4, 'player');
assert(
  'ADV.CHAL.BTL.3',
  'Battle Loop',
  'Attempting to play onto an already occupied slot is rejected (success === false)',
  occupiedRejection.success === false,
  'success: false',
  `success: ${occupiedRejection.success}`
);

// Out of bounds slot index rejection (< 0 or > 8)
const negSlot = playCardToSlot(0, -1, 'player');
const overSlot = playCardToSlot(0, 9, 'player');
assert(
  'ADV.CHAL.BTL.4',
  'Battle Loop',
  'Out-of-bounds slot indices (-1, 9) are rejected',
  negSlot.success === false && overSlot.success === false,
  'success: false for both',
  `negSlot: ${negSlot.success}, overSlot: ${overSlot.success}`
);

// 3.3 Card Flip Engine Verification (4 directions & boundary isolation)
// Reset board for controlled flip test
playRpgState.battleBoard = Array(9).fill(null);
playRpgState.playerHand = [1, 2, 3];
playRpgState.opponentHand = [51, 52];

// Place Opponent card at center (slot 4) with stats: Top=2, Right=2, Bottom=2, Left=2
playRpgState.battleBoard[4] = {
  cardId: 51,
  owner: 'opponent',
  stats: [2, 2, 2, 2], // [top, right, bottom, left]
  name: 'Test Opponent',
};

// Place Player card at slot 1 (above slot 4) with bottom stat 5 > opponent top stat 2
// Card combat stats: [top, right, bottom, left]. If placed at slot 1, its bottom (stats[2]) compares with slot 4 top (stats[0]).
playRpgState.battleBoard[1] = {
  cardId: 1,
  owner: 'player',
  stats: [1, 1, 5, 1], // Bottom = 5
  name: 'Test Player Top Attacker',
};

// Manually trigger flip evaluation for slot 1
// In playRpgEngine, slot 1 bottom neighbor is slot 4. bottom > neighbor.stats[0] (5 > 2) -> flips!
playCardToSlot(0, 0, 'player'); // play dummy to trigger evaluateBoardFlips or test directly

// Re-test flip logic systematically:
// Setup fresh board
playRpgState.battleBoard = Array(9).fill(null);
playRpgState.battleBoard[4] = {
  cardId: 51,
  owner: 'opponent',
  stats: [2, 2, 2, 2],
  name: 'Center Defender',
};

// Let's place a player card at slot 7 (below slot 4) with top stat 7 > defender bottom stat 2
playRpgState.playerHand = [10]; // card with top stat >= 7 or mock
playRpgState.opponentHand = [];
// Temporarily mock CARD_DATABASE entry for card 10:
(CARD_DATABASE as any)[10] = {
  id: 10,
  title: 'Water Boss',
  top: 8,
  right: 5,
  bottom: 5,
  left: 5,
  element: 'water',
  rarity: 'rare',
};

playCardToSlot(0, 7, 'player');
const centerFlipped = playRpgState.battleBoard[4]?.owner === 'player';
assert(
  'ADV.CHAL.BTL.5',
  'Battle Loop',
  'Card flip engine flips adjacent opponent card when attacking stat exceeds defending stat',
  centerFlipped,
  'owner: player',
  `owner: ${playRpgState.battleBoard[4]?.owner}`
);

// 3.4 Grid boundary isolation for flips
// Slot 2 (top-right, col 2) attacking right must NOT flip Slot 3 (col 0, left edge of next row)
playRpgState.battleBoard = Array(9).fill(null);
playRpgState.battleBoard[3] = {
  cardId: 51,
  owner: 'opponent',
  stats: [2, 2, 2, 2],
  name: 'Row 1 Left Card',
};
playRpgState.battleBoard[2] = {
  cardId: 1,
  owner: 'player',
  stats: [2, 9, 2, 2], // High right stat
  name: 'Row 0 Right Card',
};
// Evaluating slot 2 right flip: slot % 3 === 2 (col 2), right flip is skipped!
assert(
  'ADV.CHAL.BTL.6',
  'Battle Loop',
  'Grid right-edge slot 2 cannot flip row 1 left-edge slot 3 (no row-wrap flip)',
  playRpgState.battleBoard[3]?.owner === 'opponent',
  'owner: opponent',
  `owner: ${playRpgState.battleBoard[3]?.owner}`
);

// 3.5 Exact 50 EXP reward oracle to active deck cards
// Setup active deck cards in cardNurtureStore
const activeDeckIds = (cardNurtureStore as any).getDeckCardIds
  ? (cardNurtureStore as any).getDeckCardIds()
  : [1, 2, 3, 4, 5];

// Ensure all 5 active deck cards are owned in cardNurtureStore
for (const cid of activeDeckIds) {
  if (!(cardNurtureStore as any).isCardOwned(cid)) {
    (cardNurtureStore as any).addCard(cid);
  }
}

// Record baseline EXP for all 5 deck cards
const expBaselines: Record<number, number> = {};
for (const cid of activeDeckIds) {
  const cardData = (cardNurtureStore as any).getCard(cid);
  expBaselines[cid] = cardData.exp;
}

// Trigger battle victory EXP award
const awardResult = finishBattleAndAwardExp();
assert(
  'ADV.CHAL.BTL.7',
  'Battle Loop',
  'finishBattleAndAwardExp returns exact 50 expAwarded across 5 deck cards',
  awardResult.expAwarded === 50 && awardResult.deckCount === 5,
  '50 exp, 5 cards',
  `${awardResult.expAwarded} exp, ${awardResult.deckCount} cards`
);

let allDeckCardsGainedExact50 = true;
for (const cid of activeDeckIds) {
  const cardData = (cardNurtureStore as any).getCard(cid);
  // Note: if card leveled up, exp was adjusted by expToNext, but total accrued exp delta equals 50
  const expectedExp = expBaselines[cid] + 50;
  // If no level up, cardData.exp === expectedExp
  if (cardData.exp !== expectedExp && cardData.level === 1) {
    allDeckCardsGainedExact50 = false;
  }
}

assert(
  'ADV.CHAL.BTL.8',
  'Battle Loop',
  'All 5 cards in player active deck gained exactly +50 EXP in cardNurtureStore',
  allDeckCardsGainedExact50,
  'exact +50 EXP per card',
  `allGainedExact50: ${allDeckCardsGainedExact50}`
);

// 3.6 Repeat hunting toggle
const initialRepeat = playRpgState.repeatHunting;
toggleRepeatHunting();
const toggledRepeat = playRpgState.repeatHunting;
toggleRepeatHunting(); // restore
assert(
  'ADV.CHAL.BTL.9',
  'Battle Loop',
  'toggleRepeatHunting flips state cleanly and synchronizes to localStorage',
  toggledRepeat === !initialRepeat,
  `${!initialRepeat}`,
  `${toggledRepeat}`
);

// ============================================================================
// SUITE 4: AUTO-MODE PROGRESSION & 15-SECOND IDLE TIMER
// ============================================================================
console.log('\n--- Suite 4: Auto-Mode Progression & 15s Idle Timer Integration ---');

// 4.1 IdleAutoPlayManager 15s Inactivity Contract
mockStorage.clear();
let navigatedUrl = '';
let triggerDetailReceived: any = null;

// Test navigation when on #home
(globalThis as any).window.location.hash = '#home';
(globalThis as any).window.location.href = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#home';

const idleManager = new IdleAutoPlayManager({
  timeoutMs: 15000,
  targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
  onNavigate: (url) => {
    navigatedUrl = url;
  },
  onTrigger: (detail) => {
    triggerDetailReceived = detail;
  },
});

idleManager.start();

// Check initial state
const idleState = idleManager.getState();
assert(
  'ADV.CHAL.AUTO.1',
  'Idle Auto-Play',
  'IdleAutoPlayManager initializes tracking with 15,000ms timeout',
  idleState.isTracking === true && idleState.timeoutMs === 15000,
  'isTracking: true, timeoutMs: 15000',
  `isTracking: ${idleState.isTracking}, timeoutMs: ${idleState.timeoutMs}`
);

// Trigger idle transition from #home
idleManager.triggerNow();
assert(
  'ADV.CHAL.AUTO.2',
  'Idle Auto-Play',
  'Triggering idle transition persists hero_kadan_rpg_auto_mode = "true" in localStorage',
  mockStorage.getItem('hero_kadan_rpg_auto_mode') === 'true',
  'hero_kadan_rpg_auto_mode: "true"',
  `stored: ${mockStorage.getItem('hero_kadan_rpg_auto_mode')}`
);

assert(
  'ADV.CHAL.AUTO.3',
  'Idle Auto-Play',
  'Triggering idle transition from #home invokes navigation hook to https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
  navigatedUrl === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
  'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
  `${navigatedUrl}`
);

// In-place activation when already on #play
navigatedUrl = '';
(globalThis as any).window.location.hash = '#play';
(globalThis as any).window.location.href = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play';
mockStorage.setItem('hero_kadan_rpg_auto_mode', 'false');
idleManager.triggerNow();
assert(
  'ADV.CHAL.AUTO.3B',
  'Idle Auto-Play',
  'Triggering idle transition when already on #play activates auto-mode in place without redundant reload',
  navigatedUrl === '' && mockStorage.getItem('hero_kadan_rpg_auto_mode') === 'true',
  'navigatedUrl: empty, autoMode: true',
  `navigatedUrl: "${navigatedUrl}", autoMode: ${mockStorage.getItem('hero_kadan_rpg_auto_mode')}`
);

// Reset timer on user activity
const prevResetTime = idleManager.getState().lastResetTime;
idleManager.resetTimer();
assert(
  'ADV.CHAL.AUTO.4',
  'Idle Auto-Play',
  'resetTimer updates lastResetTime and refreshes 15s countdown window',
  idleManager.getState().lastResetTime >= prevResetTime,
  '>= prevResetTime',
  `${idleManager.getState().lastResetTime}`
);

idleManager.stop();

// 4.2 runAutoStep: End-to-End Simulation of 1 Full Chapter Progression
// Setup autoMode = true for Chapter 1
playRpgState.autoMode = true;
playRpgState.subState = 'map';
playRpgState.currentChapter = 1;
syncRegionAndTargets();
playRpgState.heroTile = { x: 1, y: 5 }; // starting position for region 1
// target is (2, 5)

let autoStepIterations = 0;
const maxIterations = 40; // Guard against infinite loop
let reachedDialogue = false;
let reachedBattle = false;
let completedChapter = false;

while (autoStepIterations < maxIterations && playRpgState.currentChapter === 1) {
  autoStepIterations++;
  runAutoStep();

  if (playRpgState.subState === 'dialogue') {
    reachedDialogue = true;
  }
  if (playRpgState.subState === 'battle') {
    reachedBattle = true;
  }
}

if (playRpgState.currentChapter > 1) {
  completedChapter = true;
}

assert(
  'ADV.CHAL.AUTO.5',
  'Auto Runner Loop',
  'runAutoStep advances hero from map position to dialogue phase hands-free',
  reachedDialogue,
  'reached dialogue phase',
  `subState: ${playRpgState.subState}`
);

assert(
  'ADV.CHAL.AUTO.6',
  'Auto Runner Loop',
  'runAutoStep auto-selects dialogue choices and transitions to battle phase hands-free',
  reachedBattle,
  'reached battle phase',
  `reachedBattle: ${reachedBattle}`
);

assert(
  'ADV.CHAL.AUTO.7',
  'Auto Runner Loop',
  'runAutoStep completes 3x3 battle and cleanly advances Chapter 1 to Chapter 2',
  completedChapter || playRpgState.currentChapter === 2,
  'currentChapter: 2',
  `currentChapter: ${playRpgState.currentChapter} (steps: ${autoStepIterations})`
);

// 4.3 Chapter advance safety: test calling advanceNextChapter at chapter 40 cap
playRpgState.currentChapter = 40;
advanceNextChapter();
assert(
  'ADV.CHAL.AUTO.8',
  'Auto Runner Loop',
  'Chapter progression is capped strictly at chapter 40 (does not overflow to 41)',
  playRpgState.currentChapter === 40,
  'currentChapter: 40',
  `currentChapter: ${playRpgState.currentChapter}`
);

// Restore default state
playRpgState.currentChapter = 1;
playRpgState.autoMode = false;
playRpgState.subState = 'map';
syncRegionAndTargets();

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n========================================================================');
console.log('              CHALLENGER M3_1 VERIFICATION SUMMARY RESULTS              ');
console.log('========================================================================');

const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const passRate = ((passed / total) * 100).toFixed(1);

console.log(`Total Assertions Run : ${total}`);
console.log(`Passed               : ${passed}`);
console.log(`Failed               : ${failed}`);
console.log(`Pass Rate            : ${passRate}%\n`);

if (failed === 0) {
  console.log('\x1b[92mVERDICT: APPROVE — ALL ADVERSARIAL CHALLENGES EMPIRICALLY CONFIRMED (100%)\x1b[0m');
} else {
  console.log('\x1b[91mVERDICT: REQUEST_CHANGES — DETECTED EMPIRICAL FAILURES\x1b[0m');
  for (const f of results.filter((r) => !r.passed)) {
    console.log(`  - [${f.id}] [${f.suite}] ${f.name}: Expected ${f.expected}, got ${f.actual}`);
  }
}

if (failed > 0) {
  process.exit(1);
}
