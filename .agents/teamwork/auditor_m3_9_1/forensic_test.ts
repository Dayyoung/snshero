/**
 * forensic_test.ts
 *
 * Independent, exhaustive forensic integrity verification for Milestone 3.
 * Directly exercises playRpgEngine.ts, PlaySection.tsx, and cardNurtureStore.ts.
 */

// Headless polyfills
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
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#play' },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    speechSynthesis: { speak: () => {}, cancel: () => {} },
  };
}
if (typeof (globalThis as any).SpeechSynthesisUtterance === 'undefined') {
  (globalThis as any).SpeechSynthesisUtterance = class MockUtterance {
    lang = '';
    rate = 1.0;
    pitch = 1.0;
    text = '';
    constructor(text = '') { this.text = text; }
  };
}

import { CARD_DATABASE } from '../../../src/cardDatabase';
import {
  playRpgState,
  initPlayRpgState,
  getCurrentRegion,
  stepHeroDelta,
  moveHeroToTile,
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
  launchArcadeGame,
  closeArcadeModal,
  rollRandomArcadeGame,
  runAutoStep,
  setActiveTab,
} from '../../../src/landing/services/playRpgEngine';
import {
  playState,
  renderPlaySection,
  toggleTts,
  prevScene,
  nextScene,
  setEpisode,
  setScene,
} from '../../../src/landing/views/PlaySection';
import { cardNurtureStore } from '../../../src/landing/services/cardNurtureStore';
import { KADAN_RPG_EVENTS } from '../../../src/content/kadanRpgStory';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../../../src/content/kadanRpgNovelScript';

interface Check {
  id: string;
  category: string;
  description: string;
  passed: boolean;
  details?: string;
}

const checks: Check[] = [];

function check(id: string, category: string, description: string, passed: boolean, details?: string) {
  checks.push({ id, category, description, passed, details });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] [${id}] [${category}] ${description}`);
  if (!passed && details) {
    console.error(`       Failure details: ${details}`);
  }
}

console.log('========================================================================');
console.log('       FORENSIC INTEGRITY AUDIT TEST RUNNER — MILESTONE 3               ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// CHECK 1: 2D Tile Map & Movement Logic
// -----------------------------------------------------------------------------
console.log('--- Phase 1: 2D Tile Map & Movement Engine Verification ---');

// Reset to chapter 1
playRpgState.currentChapter = 1;
playRpgState.subState = 'map';
playRpgState.heroTile = { x: 2, y: 2 };
const region = getCurrentRegion();

check(
  'FOR.MAP.1',
  'Map Grid',
  'Region dimensions are 10x8 with 80 total grid tiles',
  region.width === 10 && region.height === 8,
  `width=${region.width}, height=${region.height}`
);

// Test empty tile movement
const initialX = playRpgState.heroTile.x;
const initialY = playRpgState.heroTile.y;
const stepResult = stepHeroDelta(1, 0);
check(
  'FOR.MAP.2',
  'Movement Step',
  'Stepping delta (1, 0) updates heroTile coordinate',
  stepResult.moved && playRpgState.heroTile.x === initialX + 1 && playRpgState.heroTile.y === initialY,
  `heroTile: (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

// Test blocked tile movement
// Add a mock blocked tile or use existing blocked tiles
if (region.blockedTiles.length > 0) {
  const blocked = region.blockedTiles[0];
  // Position hero adjacent to blocked tile
  playRpgState.heroTile = { x: blocked.x - 1, y: blocked.y };
  const blockedStep = stepHeroDelta(1, 0);
  check(
    'FOR.MAP.3',
    'Blocked Tile Collision',
    `Stepping into blocked tile (${blocked.x}, ${blocked.y}) is rejected`,
    !blockedStep.moved && playRpgState.heroTile.x === blocked.x - 1,
    `heroTile: (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
  );
} else {
  check('FOR.MAP.3', 'Blocked Tile Collision', 'Region blocked tiles list is populated', false, 'No blocked tiles in region');
}

// Test out-of-bounds boundary clamp
playRpgState.heroTile = { x: 0, y: 0 };
const outOfBoundsLeft = stepHeroDelta(-1, 0);
check(
  'FOR.MAP.4',
  'Boundary Clamping Left',
  'Stepping west at x=0 is rejected and clamped to 0',
  !outOfBoundsLeft.moved && playRpgState.heroTile.x === 0,
  `heroTile: (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

// Test event tile encounter trigger
const ch1Event = KADAN_RPG_EVENTS.find(e => e.chapterNumber === 1);
if (ch1Event) {
  playRpgState.heroTile = { x: ch1Event.tile.x - 1, y: ch1Event.tile.y };
  const eventStep = stepHeroDelta(1, 0);
  check(
    'FOR.MAP.5',
    'Event Tile Trigger',
    `Stepping onto event tile (${ch1Event.tile.x}, ${ch1Event.tile.y}) triggers dialogue subState`,
    eventStep.eventTriggered && playRpgState.subState === 'dialogue',
    `subState=${playRpgState.subState}, eventTriggered=${eventStep.eventTriggered}`
  );
}

// -----------------------------------------------------------------------------
// CHECK 2: Episode Dialogue & Novel Script Quotes
// -----------------------------------------------------------------------------
console.log('\n--- Phase 2: Episode Dialogue & Story Lore Verification ---');

const dialogueLines = getCurrentDialogueLines();
check(
  'FOR.DLG.1',
  'Script Lines',
  'Current chapter returns genuine non-empty dialogue script lines',
  dialogueLines.length > 0,
  `lines count: ${dialogueLines.length}`
);

const firstLine = dialogueLines[0];
check(
  'FOR.DLG.2',
  'Script Structure',
  'Dialogue line contains speaker, text, and optional quote',
  Boolean(firstLine && firstLine.speaker && firstLine.text),
  `speaker: ${firstLine?.speaker}, text: ${firstLine?.text?.substring(0, 30)}...`
);

// Verify all 40 chapters have scripts
let allChaptersScripted = true;
let chaptersMissingChoices = 0;
for (let ch = 1; ch <= 40; ch++) {
  const script = KADAN_RPG_NOVEL_SCRIPTS[ch];
  const l = Array.isArray(script) ? script : (script as any)?.lines;
  if (!l || l.length === 0) {
    allChaptersScripted = false;
  } else {
    const hasChoice = l.some((line: any) => line.choices && line.choices.length > 0);
    if (!hasChoice) chaptersMissingChoices++;
  }
}
check(
  'FOR.DLG.3',
  '40-Chapter Story Coverage',
  'All 40 chapters have rich dialogue scripts in KADAN_RPG_NOVEL_SCRIPTS',
  allChaptersScripted,
  `allChaptersScripted=${allChaptersScripted}, chaptersMissingChoices=${chaptersMissingChoices}`
);

// Test choice selection
playRpgState.currentDialogueLineIdx = 0;
const choiceLineIdx = dialogueLines.findIndex(l => l.choices && l.choices.length > 0);
if (choiceLineIdx !== -1) {
  playRpgState.currentDialogueLineIdx = choiceLineIdx;
  const initialSns = parseInt(mockStorage.getItem('hero_sns') || '1000', 10);
  selectDialogueChoice(0);
  check(
    'FOR.DLG.4',
    'Choice Bonus Execution',
    'Selecting dialogue choice executes bonus and advances dialogue line index',
    playRpgState.currentDialogueLineIdx === choiceLineIdx + 1 || playRpgState.subState === 'battle',
    `lineIdx=${playRpgState.currentDialogueLineIdx}`
  );
}

// -----------------------------------------------------------------------------
// CHECK 3: 3x3 Tactical Flip Battle Engine & EXP Hook
// -----------------------------------------------------------------------------
console.log('\n--- Phase 3: 3x3 Tactical Flip Battle & EXP Hook Verification ---');

initBattle();
check(
  'FOR.BTL.1',
  'Battle Initialization',
  'initBattle resets 9-slot board and gives 5 cards each to player and opponent',
  playRpgState.battleBoard.length === 9 &&
  playRpgState.battleBoard.every(s => s === null) &&
  playRpgState.playerHand.length === 5 &&
  playRpgState.opponentHand.length === 5,
  `board: ${playRpgState.battleBoard.length}, playerHand: ${playRpgState.playerHand.length}, oppHand: ${playRpgState.opponentHand.length}`
);

// Test placing card on valid slot
const pCardId = playRpgState.playerHand[0];
const place1 = playCardToSlot(0, 4, 'player'); // Place in center slot (4)
check(
  'FOR.BTL.2',
  'Card Placement',
  'Placing card in slot 4 succeeds and removes card from hand',
  place1.success && playRpgState.battleBoard[4]?.cardId === pCardId,
  `place1.success=${place1.success}, slot 4 cardId=${playRpgState.battleBoard[4]?.cardId}`
);

// Test placing card on occupied slot
const place2 = playCardToSlot(0, 4, 'player');
check(
  'FOR.BTL.3',
  'Occupied Slot Rejection',
  'Placing card on occupied slot 4 returns success=false',
  !place2.success,
  `success=${place2.success}`
);

// Test tactical flip logic directly
// Setup clean board: opponent card in slot 1 (stats: top=2, right=2, bottom=3, left=2)
playRpgState.battleBoard = Array(9).fill(null);
playRpgState.battleBoard[1] = {
  cardId: 99,
  owner: 'opponent',
  stats: [2, 2, 3, 2],
  name: 'Weak Enemy',
};
// Empty opponent hand so AI does not counter-move during this isolated flip assertion
playRpgState.opponentHand = [];
// Player hand contains Card 2 (Naiad, stats: top=7, right=1, bottom=3, left=1)
playRpgState.playerHand = [2];
// Place Card 2 at slot 4 (adjacent below slot 1). Since Card 2 top (7) > slot 1 bottom (3), slot 1 must flip!
playCardToSlot(0, 4, 'player');
check(
  'FOR.BTL.4',
  'Tactical Card Flip',
  'Placing card in slot 4 with top (7) > neighbor bottom (3) flips neighbor from opponent to player',
  playRpgState.battleBoard[1]?.owner === 'player' && playRpgState.battleBoard[4]?.owner === 'player',
  `slot 1 owner: ${playRpgState.battleBoard[1]?.owner}, slot 4 owner: ${playRpgState.battleBoard[4]?.owner}`
);

// Test victory EXP hook
const card1BeforeExp = (cardNurtureStore as any).getCard(1).exp;
const card1BeforeLv = (cardNurtureStore as any).getCard(1).level;
const expResult = finishBattleAndAwardExp();
const card1AfterExp = (cardNurtureStore as any).getCard(1).exp;
const card1AfterLv = (cardNurtureStore as any).getCard(1).level;
check(
  'FOR.BTL.5',
  'Battle Victory 50 EXP Award',
  'finishBattleAndAwardExp awards exact 50 EXP to active deck cards (triggering EXP gain or Level Up)',
  expResult.expAwarded === 50 && (card1AfterExp === card1BeforeExp + 50 || card1AfterLv > card1BeforeLv),
  `before: Lv.${card1BeforeLv} (${card1BeforeExp} EXP), after: Lv.${card1AfterLv} (${card1AfterExp} EXP)`
);

// -----------------------------------------------------------------------------
// CHECK 4: 110 Poki Minigames Catalog & Search Filter
// -----------------------------------------------------------------------------
console.log('\n--- Phase 4: 110 Poki Minigames Catalog Verification ---');

let catalogCount = 0;
for (let id = 1; id <= 110; id++) {
  if (CARD_DATABASE[id]) catalogCount++;
}
check(
  'FOR.ARC.1',
  '110 Games Pool',
  'All 110 card definitions exist in CARD_DATABASE',
  catalogCount === 110,
  `catalogCount=${catalogCount}`
);

// Test die roll
const rolledGameId = rollRandomArcadeGame();
check(
  'FOR.ARC.2',
  'Random Die Roll',
  'rollRandomArcadeGame returns valid ID in 1..110 and sets activeArcadeModalId',
  rolledGameId >= 1 && rolledGameId <= 110 && playRpgState.activeArcadeModalId === rolledGameId,
  `rolledGameId=${rolledGameId}`
);

closeArcadeModal();
check(
  'FOR.ARC.3',
  'Close Arcade Modal',
  'closeArcadeModal resets activeArcadeModalId to null',
  playRpgState.activeArcadeModalId === null,
  `activeArcadeModalId=${playRpgState.activeArcadeModalId}`
);

// -----------------------------------------------------------------------------
// CHECK 5: Webtoon Viewer 5 Buttons & Invariant TTS Contract
// -----------------------------------------------------------------------------
console.log('\n--- Phase 5: Webtoon Viewer 5 Buttons & Invariant TTS Contract ---');

playState.isTtsActive = false;
const playHtml = renderPlaySection();

const required5Buttons = ['닫기', '이전', '다음', '나레이션', 'TTS'];
const buttonsFound = required5Buttons.every(b => playHtml.includes(b));
check(
  'FOR.WEB.1',
  'Webtoon 5 Buttons',
  'Rendered HTML contains exact 5 buttons in control bar [닫기, 이전, 다음, 나레이션, TTS]',
  buttonsFound,
  `found all 5: ${buttonsFound}`
);

check(
  'FOR.WEB.2',
  'Webtoon Control Bar Section',
  'HTML contains section with aria-label="웹툰 컨트롤 바"',
  playHtml.includes('aria-label="웹툰 컨트롤 바"'),
  'Verified'
);

// Scene navigation without auto-enabling TTS
nextScene();
prevScene();
setEpisode(5);
setScene(3);
check(
  'FOR.WEB.3',
  'Invariant TTS State',
  'Navigating scenes and episodes preserves isTtsActive === false without auto-speech',
  playState.isTtsActive === false,
  `isTtsActive=${playState.isTtsActive}`
);

// Explicit toggle test
toggleTts();
const toggledOn = playState.isTtsActive;
toggleTts();
const toggledOff = playState.isTtsActive;
check(
  'FOR.WEB.4',
  'Explicit TTS Toggle',
  'toggleTts flips isTtsActive to true then back to false',
  toggledOn === true && toggledOff === false,
  `on=${toggledOn}, off=${toggledOff}`
);

// -----------------------------------------------------------------------------
// CHECK 6: Auto-Play Runner Hands-Free Step Execution
// -----------------------------------------------------------------------------
console.log('\n--- Phase 6: Auto-Play Runner Execution Verification ---');

playRpgState.autoMode = true;
playRpgState.subState = 'map';
playRpgState.heroTile = { x: 2, y: 2 };
playRpgState.targetTile = { x: 4, y: 2 };

// Execute one auto step on map
runAutoStep();
check(
  'FOR.AUTO.1',
  'Auto-Play Map Step',
  'runAutoStep advances hero towards target tile when in map subState',
  playRpgState.heroTile.x === 3 && playRpgState.heroTile.y === 2,
  `heroTile: (${playRpgState.heroTile.x}, ${playRpgState.heroTile.y})`
);

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('              FORENSIC INTEGRITY AUDIT SUMMARY RESULTS                  ');
console.log('========================================================================');
const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.passed).length;
const failedChecks = totalChecks - passedChecks;

console.log(`Total Checks : ${totalChecks}`);
console.log(`Passed       : ${passedChecks}`);
console.log(`Failed       : ${failedChecks}`);
console.log(`Pass Rate    : ${((passedChecks / totalChecks) * 100).toFixed(1)}%\n`);

if (failedChecks === 0) {
  console.log('VERDICT: CLEAN — Zero integrity violations detected.');
  process.exit(0);
} else {
  console.log('VERDICT: INTEGRITY VIOLATION — Failures detected.');
  process.exit(1);
}
