/**
 * tests/challenger_m3_9_2_empirical_stress.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS HARNESS — CHALLENGER M3.9.2
 * Poki 110 Arcade Catalog, 100dvh Mobile Container, Search/Filters & Cross-Feature Invariant Verifier
 *
 * Invariants Challenged:
 * 1. 110 Poki Arcade Catalog: All 110 cards exist in CARD_DATABASE and render/launch properly.
 * 2. Search & Element Filters: Case-insensitivity, substring matching, empty queries, special chars,
 *    and strict faction partition across all 11 elements (summing to 110 with zero overlaps).
 * 3. Random Roll Die Selection: 20,000-iteration Monte Carlo stress test for integer validity,
 *    bounds [1..110], and full 110-card coverage.
 * 4. 100dvh Mobile Fullscreen Modal & 44px+ Exit Control: Viewport dimensions and touch target.
 * 5. Webtoon Viewer Invariants: Exact 5 buttons in control bar, isTtsActive === false default,
 *    scene/episode boundary clamping against underflow and overflow.
 * 6. Cross-Feature Non-Regressions: Zero prohibited classes, design flat compliance, and zero React runtime.
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

if (typeof (globalThis as any).SpeechSynthesisUtterance === 'undefined') {
  (globalThis as any).SpeechSynthesisUtterance = class {
    text: string;
    lang: string = 'ko-KR';
    rate: number = 1.0;
    pitch: number = 1.0;
    onerror: any = null;
    constructor(text: string) { this.text = text; }
  };
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#play' },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    speechSynthesis: { speak: () => {}, cancel: () => {} },
    SpeechSynthesisUtterance: (globalThis as any).SpeechSynthesisUtterance,
  };
}

import fs from 'node:fs';
import path from 'node:path';
import { CARD_DATABASE } from '../src/cardDatabase';
import {
  playRpgState,
  setActiveTab,
  launchArcadeGame,
  closeArcadeModal,
  rollRandomArcadeGame,
  stepHeroDelta,
} from '../src/landing/services/playRpgEngine';
import {
  playState,
  renderPlaySection,
  handlePlayAction,
  toggleTts,
  nextScene,
  prevScene,
  setEpisode,
  setScene,
} from '../src/landing/views/PlaySection';
import { WEBTOON_40_EPISODES, getWebtoonEpisode } from '../src/landing/services/webtoonCatalog';

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
console.log('  CHALLENGER M3.9.2: EMPIRICAL ADVERSARIAL STRESS HARNESS               ');
console.log('  110 Poki Arcade, 100dvh Modal, Search/Filter & Cross-Feature Invariants');
console.log('========================================================================\n');

// ===========================================================================
// SUITE 1: Poki 110 Arcade Catalog Completeness & Launch Integrity
// ===========================================================================
console.log('--- Suite 1: Poki 110 Arcade Catalog Completeness & Launch Integrity ---');

// 1.1 Verify all 110 cards exist in CARD_DATABASE
let missingDbCards: number[] = [];
for (let id = 1; id <= 110; id++) {
  const card = CARD_DATABASE[id];
  if (!card || !card.title || typeof card.top !== 'number') {
    missingDbCards.push(id);
  }
}
assert(
  'CHAL.ARCADE.1',
  'Arcade Catalog',
  'All 110 cards (IDs 1..110) exist with complete stats in CARD_DATABASE',
  missingDbCards.length === 0,
  '0 missing cards',
  `${missingDbCards.length} missing: [${missingDbCards.slice(0, 5).join(', ')}]`
);

// 1.2 Switch to arcade tab and verify all 110 cards render in the DOM string
setActiveTab('arcade');
playRpgState.arcadeQuery = '';
playRpgState.arcadeElement = 'all';
playRpgState.activeArcadeModalId = null;

const arcadeHtml = renderPlaySection();

let renderedCardCount = 0;
let missingRenderedCards: number[] = [];
for (let id = 1; id <= 110; id++) {
  const launchAttr = `data-card-id="${id}"`;
  const padId = String(id).padStart(3, '0');
  const imgAttr = `Hero_${padId}.png`;
  if (arcadeHtml.includes(launchAttr) && arcadeHtml.includes(imgAttr)) {
    renderedCardCount++;
  } else {
    missingRenderedCards.push(id);
  }
}
assert(
  'CHAL.ARCADE.2',
  'Arcade Catalog',
  'All 110 cards are rendered with launch button and hero portrait in arcade view',
  renderedCardCount === 110,
  '110 cards rendered',
  `${renderedCardCount} rendered, missing: [${missingRenderedCards.slice(0, 5).join(', ')}]`
);

// 1.3 Verify launching simulation across all 11 factions (IDs 1, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105)
const testLaunchIds = [1, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105];
let launchSuccessCount = 0;
for (const cardId of testLaunchIds) {
  // Test launchAction
  launchArcadeGame(cardId);
  const modalHtml = renderPlaySection();
  const card = CARD_DATABASE[cardId];
  const padId = String(cardId).padStart(3, '0');

  const hasModalContainer = modalHtml.includes('h-[100dvh]') && modalHtml.includes('fixed inset-0');
  const hasCardTitle = modalHtml.includes(card?.title || '');
  const hasCardImg = modalHtml.includes(`Hero_${padId}.png`);
  const hasCloseBtn = modalHtml.includes('data-action="play-arcade-close"') && modalHtml.includes('min-h-[44px]');

  if (hasModalContainer && hasCardTitle && hasCardImg && hasCloseBtn) {
    launchSuccessCount++;
  }

  // Close modal
  closeArcadeModal();
}

assert(
  'CHAL.ARCADE.3',
  'Arcade Catalog',
  'Arcade launch opens 100dvh modal with correct card metadata and 44px+ close button across all 11 factions',
  launchSuccessCount === testLaunchIds.length,
  `${testLaunchIds.length} successful launches`,
  `${launchSuccessCount} successful launches`
);

// ===========================================================================
// SUITE 2: Search Query Narrowing & Elemental Chip Filters
// ===========================================================================
console.log('\n--- Suite 2: Search Query Narrowing & Elemental Chip Filters ---');

// 2.1 Test 11 Element partitions: Each of the 11 elements must match its canonical 10 cards
const factions = [
  'water', 'fire', 'wind', 'earth', 'human', 'undead',
  'elf', 'dwarf', 'monster', 'robot', 'dragon'
];

let totalPartitionCount = 0;
let partitionOverlap = false;
let seenCardsInPartitions = new Set<number>();
let factionCounts: Record<string, number> = {};

for (const f of factions) {
  playRpgState.arcadeQuery = '';
  playRpgState.arcadeElement = f;
  const filteredHtml = renderPlaySection();

  let count = 0;
  for (let id = 1; id <= 110; id++) {
    if (filteredHtml.includes(`data-card-id="${id}"`)) {
      count++;
      if (seenCardsInPartitions.has(id)) {
        partitionOverlap = true;
      }
      seenCardsInPartitions.add(id);
    }
  }
  factionCounts[f] = count;
  totalPartitionCount += count;
}

const allFactionsExactly10 = factions.every(f => factionCounts[f] === 10);

assert(
  'CHAL.FILTER.1',
  'Element Filters',
  'All 11 factions each contain exactly 10 cards summing to 110 with 0 overlaps',
  allFactionsExactly10 && totalPartitionCount === 110 && !partitionOverlap,
  '11 factions x 10 = 110 cards, 0 overlaps',
  `Total: ${totalPartitionCount}, Overlap: ${partitionOverlap}, Counts: ${JSON.stringify(factionCounts)}`
);

// 2.2 Test search query narrowing
// Query: "카단"
playRpgState.arcadeElement = 'all';
playRpgState.arcadeQuery = '카단';
const kadanSearchHtml = renderPlaySection();
const kadanCard = CARD_DATABASE[41];
const hasKadan = kadanSearchHtml.includes(`data-card-id="41"`);
let kadanMatches = 0;
for (let id = 1; id <= 110; id++) {
  if (kadanSearchHtml.includes(`data-card-id="${id}"`)) kadanMatches++;
}

assert(
  'CHAL.FILTER.2',
  'Search Query',
  'Searching "카단" correctly narrows catalog and includes Hero 41',
  hasKadan && kadanMatches >= 1 && kadanMatches < 110,
  'Hero 41 included, count < 110',
  `Matches: ${kadanMatches}, Hero 41 found: ${hasKadan}`
);

// 2.3 Non-matching query yields 0 results without crash
playRpgState.arcadeQuery = 'zzz_nonexistent_card_9999';
const emptySearchHtml = renderPlaySection();
let emptyMatches = 0;
for (let id = 1; id <= 110; id++) {
  if (emptySearchHtml.includes(`data-card-id="${id}"`)) emptyMatches++;
}
assert(
  'CHAL.FILTER.3',
  'Search Query',
  'Nonsense search query yields exactly 0 cards without error or crash',
  emptyMatches === 0,
  '0 matches',
  `${emptyMatches} matches`
);

// 2.4 Special characters query safety
playRpgState.arcadeQuery = '.*+?^${}()|[]\\';
let specialCharMatches = 0;
try {
  const specialHtml = renderPlaySection();
  for (let id = 1; id <= 110; id++) {
    if (specialHtml.includes(`data-card-id="${id}"`)) specialCharMatches++;
  }
  assert(
    'CHAL.FILTER.4',
    'Search Query',
    'Regex special characters in search input handled safely without regex crash',
    specialCharMatches === 0,
    '0 matches without crash',
    `${specialCharMatches} matches`
  );
} catch (err: any) {
  assert(
    'CHAL.FILTER.4',
    'Search Query',
    'Regex special characters in search input handled safely without regex crash',
    false,
    'No exception',
    `Threw exception: ${err?.message}`
  );
}

// 2.5 Combined query + element filter
// Query "마법" + element "fire"
playRpgState.arcadeQuery = '마법';
playRpgState.arcadeElement = 'fire';
const combinedHtml = renderPlaySection();
let combinedMatches = 0;
for (let id = 1; id <= 110; id++) {
  if (combinedHtml.includes(`data-card-id="${id}"`)) {
    combinedMatches++;
    const card = CARD_DATABASE[id];
    // Each matched card must belong to fire faction
    if (card?.element?.toLowerCase() !== 'fire') {
      combinedMatches = -999;
      break;
    }
  }
}
assert(
  'CHAL.FILTER.5',
  'Combined Filters',
  'Combined text search + element chip strictly enforces both conditions simultaneously',
  combinedMatches >= 0,
  'Only fire cards matching query',
  `Matches: ${combinedMatches}`
);

// Reset filters
playRpgState.arcadeQuery = '';
playRpgState.arcadeElement = 'all';

// ===========================================================================
// SUITE 3: Random Roll Die Selection Validity (Monte Carlo Stress Test)
// ===========================================================================
console.log('\n--- Suite 3: Random Roll Die Selection Validity (1..110) ---');

const MONTE_CARLO_ROUNDS = 20000;
let invalidRolls = 0;
let minRoll = Infinity;
let maxRoll = -Infinity;
const rollHistogram = new Map<number, number>();

for (let i = 0; i < MONTE_CARLO_ROUNDS; i++) {
  const roll = rollRandomArcadeGame();
  if (typeof roll !== 'number' || !Number.isInteger(roll) || roll < 1 || roll > 110) {
    invalidRolls++;
  }
  if (roll < minRoll) minRoll = roll;
  if (roll > maxRoll) maxRoll = roll;
  rollHistogram.set(roll, (rollHistogram.get(roll) || 0) + 1);
}

// Check coverage: did every number from 1 to 110 get rolled at least once?
let unrolledCards: number[] = [];
for (let id = 1; id <= 110; id++) {
  if (!rollHistogram.has(id)) {
    unrolledCards.push(id);
  }
}

assert(
  'CHAL.DIE.1',
  'Random Die Roller',
  `Monte Carlo ${MONTE_CARLO_ROUNDS} rolls: all rolls strictly integers within [1..110]`,
  invalidRolls === 0 && minRoll === 1 && maxRoll === 110,
  `Min: 1, Max: 110, Invalid: 0`,
  `Min: ${minRoll}, Max: ${maxRoll}, Invalid: ${invalidRolls}`
);

assert(
  'CHAL.DIE.2',
  'Random Die Roller',
  `Monte Carlo ${MONTE_CARLO_ROUNDS} rolls: 100% full coverage across all 110 card IDs`,
  unrolledCards.length === 0,
  '0 unrolled cards (110/110 hit)',
  `${unrolledCards.length} unrolled cards: [${unrolledCards.slice(0, 5).join(', ')}]`
);

// Reset modal state
closeArcadeModal();

// ===========================================================================
// SUITE 4: 100dvh Fullscreen Modal & 44px+ Exit Control
// ===========================================================================
console.log('\n--- Suite 4: 100dvh Fullscreen Modal & 44px+ Exit Control ---');

// Open modal for card #77
launchArcadeGame(77);
const modalActiveHtml = renderPlaySection();

const has100DvhClass = modalActiveHtml.includes('h-[100dvh]');
const hasFixedInset0 = modalActiveHtml.includes('fixed inset-0');
const hasOverflowHidden = modalActiveHtml.includes('overflow-hidden');
const hasTouchNone = modalActiveHtml.includes('touch-none');
const hasZIndex = modalActiveHtml.includes('z-[99999]');

assert(
  'CHAL.MODAL.1',
  '100dvh Modal Container',
  'Launch modal root container enforces fixed inset-0 w-full h-[100dvh] overflow-hidden touch-none',
  has100DvhClass && hasFixedInset0 && hasOverflowHidden && hasTouchNone && hasZIndex,
  'All 100dvh mobile container classes present',
  `100dvh: ${has100DvhClass}, fixed: ${hasFixedInset0}, overflow: ${hasOverflowHidden}, touch: ${hasTouchNone}, zIndex: ${hasZIndex}`
);

// Exit control checks
const hasExitAction = modalActiveHtml.includes('data-action="play-arcade-close"');
const hasExitMinH = modalActiveHtml.includes('min-h-[44px]');
const hasExitMinW = modalActiveHtml.includes('min-w-[44px]');
const hasExitAria = modalActiveHtml.includes('aria-label="미니게임 닫기"');

assert(
  'CHAL.MODAL.2',
  'Exit Control Ergonomics',
  'Modal exit button enforces 44px+ touch targets (min-h-[44px] min-w-[44px]) and clear aria-label',
  hasExitAction && hasExitMinH && hasExitMinW && hasExitAria,
  'All 44px+ exit button ergonomics met',
  `action: ${hasExitAction}, minH: ${hasExitMinH}, minW: ${hasExitMinW}, aria: ${hasExitAria}`
);

// Closing modal unmounts it cleanly
closeArcadeModal();
const modalClosedHtml = renderPlaySection();
const modalPresentAfterClose = modalClosedHtml.includes('h-[100dvh]');

assert(
  'CHAL.MODAL.3',
  'Modal Dismissal',
  'Closing modal completely unmounts modal markup from DOM string',
  !modalPresentAfterClose,
  'Modal completely absent',
  `Modal present after close: ${modalPresentAfterClose}`
);

// ===========================================================================
// SUITE 5: Webtoon Viewer Invariants (5 Buttons, TTS OFF Default, Navigation Boundaries)
// ===========================================================================
console.log('\n--- Suite 5: Webtoon Viewer Invariants & Boundary Stress ---');

// 5.1 Exact 5 control buttons in control bar
setActiveTab('webtoon');
const webtoonHtml = renderPlaySection();

// Extract the control bar section
const controlBarMatch = webtoonHtml.match(/<section[^>]*aria-label="웹툰 컨트롤 바"[^>]*>([\s\S]*?)<\/section>/);
const controlBarHtml = controlBarMatch ? controlBarMatch[1] : '';

const buttons = controlBarHtml.match(/<button[^>]*>[\s\S]*?<\/button>/g) || [];
const buttonTexts = buttons.map(b => b.replace(/<[^>]*>/g, '').trim());

const hasClose = buttonTexts.some(t => t.includes('닫기'));
const hasPrev = buttonTexts.some(t => t.includes('이전'));
const hasNext = buttonTexts.some(t => t.includes('다음'));
const hasNarration = buttonTexts.some(t => t.includes('나레이션'));
const hasTts = buttonTexts.some(t => t.includes('TTS'));

assert(
  'CHAL.WEBTOON.1',
  'Webtoon Control Bar',
  'Control bar strictly contains EXACTLY 5 buttons: [닫기, 이전, 다음, 나레이션, TTS]',
  buttons.length === 5 && hasClose && hasPrev && hasNext && hasNarration && hasTts,
  '5 buttons: [닫기, 이전, 다음, 나레이션, TTS]',
  `Count: ${buttons.length}, Texts: [${buttonTexts.join(', ')}]`
);

// 5.2 Strict TTS OFF Default Contract
assert(
  'CHAL.TTS.1',
  'TTS Default Contract',
  'playState.isTtsActive strictly defaults to false on load',
  playState.isTtsActive === false,
  'isTtsActive === false',
  `isTtsActive === ${playState.isTtsActive}`
);

// 5.3 Stepping scenes and episodes NEVER auto-activates TTS
setEpisode(1);
setScene(0);
for (let i = 0; i < 25; i++) {
  nextScene();
}
const ttsAfterNext = playState.isTtsActive;

for (let i = 0; i < 25; i++) {
  prevScene();
}
const ttsAfterPrev = playState.isTtsActive;

setEpisode(20);
setScene(10);
const ttsAfterSet = playState.isTtsActive;

assert(
  'CHAL.TTS.2',
  'TTS Invariant Safety',
  'Stepping next/prev scenes or changing episodes NEVER auto-activates TTS (remains false)',
  ttsAfterNext === false && ttsAfterPrev === false && ttsAfterSet === false,
  'TTS remains strictly false during all navigation',
  `Next: ${ttsAfterNext}, Prev: ${ttsAfterPrev}, Set: ${ttsAfterSet}`
);

// 5.4 Explicit toggleTts() works reliably
const toggledOn = toggleTts();
const isNowOn = playState.isTtsActive;
const toggledOff = toggleTts();
const isNowOff = playState.isTtsActive;

assert(
  'CHAL.TTS.3',
  'TTS Explicit Toggle',
  'Explicit toggleTts() correctly toggles between true and false',
  toggledOn === true && isNowOn === true && toggledOff === false && isNowOff === false,
  'Toggle ON -> true, Toggle OFF -> false',
  `ON: ${toggledOn}/${isNowOn}, OFF: ${toggledOff}/${isNowOff}`
);

// 5.5 Episode & Scene Navigation Boundary Clamping
// Underflow test: At Ep 1, Scene 0, call prevScene() 50 times
setEpisode(1);
setScene(0);
for (let i = 0; i < 50; i++) {
  prevScene();
}
const epUnderflowSafe = playState.currentEpisode === 1 && playState.currentScene === 0;

// Overflow test: At Ep 40, last scene, call nextScene() 50 times
setEpisode(40);
const ep40 = getWebtoonEpisode(40);
const lastSceneIdx = ep40.totalScenes - 1;
setScene(lastSceneIdx);
for (let i = 0; i < 50; i++) {
  nextScene();
}
const epOverflowSafe = playState.currentEpisode === 40 && playState.currentScene === lastSceneIdx;

// Out of range setEpisode and setScene
setEpisode(-999);
const negEpClamped = playState.currentEpisode === 1;

setEpisode(9999);
const highEpClamped = playState.currentEpisode === 40;

setEpisode(NaN as any);
const nanEpClamped = playState.currentEpisode === 1;

setScene(-999);
const negSceneClamped = playState.currentScene === 0;

setScene(99999);
const highSceneClamped = playState.currentScene === (getWebtoonEpisode(playState.currentEpisode).totalScenes - 1);

assert(
  'CHAL.BOUNDS.1',
  'Navigation Boundaries',
  'Webtoon episode and scene navigation strictly clamps underflow, overflow, and NaN inputs',
  epUnderflowSafe && epOverflowSafe && negEpClamped && highEpClamped && nanEpClamped && negSceneClamped && highSceneClamped,
  'All 7 boundary stress conditions properly clamped',
  `Underflow: ${epUnderflowSafe}, Overflow: ${epOverflowSafe}, NegEp: ${negEpClamped}, HighEp: ${highEpClamped}, NanEp: ${nanEpClamped}, NegSc: ${negSceneClamped}, HighSc: ${highSceneClamped}`
);

// Reset state
setEpisode(1);
setScene(0);
setActiveTab('adventure');

// ===========================================================================
// SUITE 6: Cross-Feature Non-Regressions & Design System
// ===========================================================================
console.log('\n--- Suite 6: Cross-Feature Non-Regressions & Design System ---');

// 6.1 Prohibited classes in PlaySection.tsx source code
const playSectionPath = path.resolve(process.cwd(), 'src/landing/views/PlaySection.tsx');
const playSectionSrc = fs.readFileSync(playSectionPath, 'utf-8');

const prohibitedPatterns = [
  /\brounded-xl\b/g,
  /\brounded-2xl\b/g,
  /\brounded-3xl\b/g,
  /\banimate-ping\b/g,
  /\banimate-bounce\b/g,
];

let prohibitedViolations = 0;
let violationList: string[] = [];
for (const pat of prohibitedPatterns) {
  const matches = playSectionSrc.match(pat);
  if (matches) {
    prohibitedViolations += matches.length;
    violationList.push(...matches);
  }
}

assert(
  'CHAL.DESIGN.1',
  'Design Compliance',
  'PlaySection.tsx contains 0 prohibited classes (rounded-xl/2xl/3xl, animate-bounce, animate-ping)',
  prohibitedViolations === 0,
  '0 prohibited classes',
  `${prohibitedViolations} found: [${violationList.join(', ')}]`
);

// 6.2 Mobile touch target ergonomics (min-h-[44px])
// Check that all button definitions in PlaySection.tsx have min-h-[44px]
const buttonTagRegex = /<button[^>]*class="([^"]*)"[^>]*>/g;
let buttonMatch: RegExpExecArray | null;
let totalButtonsChecked = 0;
let compliantButtons = 0;
let nonCompliantButtons: string[] = [];

while ((buttonMatch = buttonTagRegex.exec(playSectionSrc)) !== null) {
  totalButtonsChecked++;
  const classList = buttonMatch[1];
  // Valid if has min-h-[44px] OR is a grid tile with min-h-[32px] sm:min-h-[44px]
  if (classList.includes('min-h-[44px]')) {
    compliantButtons++;
  } else {
    nonCompliantButtons.push(buttonMatch[0].slice(0, 80));
  }
}

assert(
  'CHAL.DESIGN.2',
  'Touch Ergonomics',
  'All interactive buttons in PlaySection.tsx enforce mobile touch ergonomics (min-h-[44px])',
  compliantButtons === totalButtonsChecked,
  `${totalButtonsChecked}/${totalButtonsChecked} buttons compliant`,
  `${compliantButtons}/${totalButtonsChecked} compliant, non-compliant: [${nonCompliantButtons.slice(0, 3).join(' | ')}]`
);

// 6.3 Production build size & zero React runtime audit
const distIndexPath = path.resolve(process.cwd(), 'dist/index.html');
const distExists = fs.existsSync(distIndexPath);
let distSize = 0;
let hasReactVendor = false;

if (distExists) {
  const distContent = fs.readFileSync(distIndexPath, 'utf-8');
  distSize = Buffer.byteLength(distContent, 'utf-8');
  hasReactVendor = distContent.includes('vendor-react') || distContent.includes('react.production');
}

assert(
  'CHAL.BUILD.1',
  'Production Bundle',
  'dist/index.html exists, size < 50 KB strict ceiling, zero React 19 runtime dependencies',
  distExists && distSize < 50000 && !hasReactVendor,
  'dist/index.html < 50,000 bytes, zero react bundle',
  `Exists: ${distExists}, Size: ${(distSize / 1024).toFixed(2)} KB, ReactVendor: ${hasReactVendor}`
);

// ===========================================================================
// SUMMARY RESULTS
// ===========================================================================
console.log('\n========================================================================');
console.log('                 EMPIRICAL STRESS TEST SUMMARY                          ');
console.log('========================================================================');

const totalAssertions = results.length;
const passedAssertions = results.filter(r => r.passed).length;
const failedAssertions = results.filter(r => !r.passed).length;
const successRate = ((passedAssertions / totalAssertions) * 100).toFixed(1);

console.log(`Total Assertions : ${totalAssertions}`);
console.log(`Passed           : ${passedAssertions}`);
console.log(`Failed           : ${failedAssertions}`);
console.log(`Success Rate     : ${successRate}%\n`);

if (failedAssertions === 0) {
  console.log('\x1b[92mEMPIRICAL VERDICT: APPROVE (Zero defects discovered across all stress vectors)\x1b[0m\n');
  process.exit(0);
} else {
  console.log('\x1b[91mEMPIRICAL VERDICT: REQUEST_CHANGES (Defects detected during stress execution)\x1b[0m\n');
  process.exit(1);
}
