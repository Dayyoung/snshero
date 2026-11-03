/**
 * tests/challenger_m3_it2_2_adversarial_matrix.ts
 *
 * Milestone 3 Iteration 2 Challenger 2 Empirical Stress Harness:
 * - 110 Arcade & 11-Faction Partition Invariants
 * - Search Query Narrowing Multi-vector Stress (case, korean, desc, regex, combined)
 * - Random Play Modal Behavior across all 110 cards & 11 factions
 * - Event Dispatcher Interactive Integration
 * - 100dvh Fullscreen Modal & 44px+ Touch Ergonomics
 */

import { CARD_DATABASE } from '../src/cardDatabase';
import {
  playRpgState,
  setActiveTab,
  launchArcadeGame,
  closeArcadeModal,
  rollRandomArcadeGame,
} from '../src/landing/services/playRpgEngine';
import { renderPlaySection, handlePlayAction, playState } from '../src/landing/views/PlaySection';
import * as fs from 'fs';
import * as path from 'path';

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
console.log('  CHALLENGER M3_IT2_2: EMPIRICAL ADVERSARIAL STRESS HARNESS            ');
console.log('  110 Arcade Catalog, 11-Faction Partition & Random Modal Invariants   ');
console.log('========================================================================\n');

// Set active tab to arcade
setActiveTab('arcade');

// ===========================================================================
// SUITE 1: 11-Faction Disjoint Partition & Database Invariants
// ===========================================================================
console.log('--- Suite 1: 11-Faction Disjoint Partition & Database Invariants ---');

const canonicalFactions: {
  key: string;
  expectedRange: [number, number];
  koreanName: string;
}[] = [
  { key: 'water', expectedRange: [1, 10], koreanName: '물' },
  { key: 'fire', expectedRange: [11, 20], koreanName: '불' },
  { key: 'wind', expectedRange: [21, 30], koreanName: '바람' },
  { key: 'earth', expectedRange: [31, 40], koreanName: '땅' },
  { key: 'human', expectedRange: [41, 50], koreanName: '인간' },
  { key: 'undead', expectedRange: [51, 60], koreanName: '언데드' },
  { key: 'elf', expectedRange: [61, 70], koreanName: '엘프' },
  { key: 'dwarf', expectedRange: [71, 80], koreanName: '호빗' },
  { key: 'monster', expectedRange: [81, 90], koreanName: '야수' },
  { key: 'robot', expectedRange: [91, 100], koreanName: '메카' },
  { key: 'dragon', expectedRange: [101, 110], koreanName: '드래곤' },
];

// 1.1 All 110 cards exist in CARD_DATABASE with valid stats
let dbValid = true;
let invalidDbIds: number[] = [];
for (let id = 1; id <= 110; id++) {
  const c = CARD_DATABASE[id];
  if (!c || !c.title || typeof c.top !== 'number' || typeof c.right !== 'number' ||
      typeof c.bottom !== 'number' || typeof c.left !== 'number') {
    dbValid = false;
    invalidDbIds.push(id);
  }
}
assert(
  'CHAL.PART.1',
  'Partition Invariants',
  'All 110 cards have complete non-null titles and 4-way numerical stats in CARD_DATABASE',
  dbValid,
  '0 invalid IDs',
  `${invalidDbIds.length} invalid IDs: [${invalidDbIds.join(', ')}]`
);

// 1.2 Every faction chip returns exactly 10 cards matching expected ID range
let factionPartitionSuccess = true;
const factionIdSets: Map<string, number[]> = new Map();
let totalCardsAcrossFactions = 0;

for (const f of canonicalFactions) {
  playRpgState.arcadeQuery = '';
  playRpgState.arcadeElement = f.key;
  const html = renderPlaySection();

  const matchedIds: number[] = [];
  for (let id = 1; id <= 110; id++) {
    if (html.includes(`data-card-id="${id}"`)) {
      matchedIds.push(id);
    }
  }

  factionIdSets.set(f.key, matchedIds);
  totalCardsAcrossFactions += matchedIds.length;

  const [minId, maxId] = f.expectedRange;
  const rangeMatch = matchedIds.length === 10 &&
    matchedIds[0] === minId &&
    matchedIds[matchedIds.length - 1] === maxId;

  if (!rangeMatch) {
    factionPartitionSuccess = false;
  }
}

assert(
  'CHAL.PART.2',
  'Partition Invariants',
  'All 11 factions each contain exactly 10 cards strictly matching contiguous ID blocks [1..10], [11..20], ..., [101..110]',
  factionPartitionSuccess,
  '11 factions x 10 contiguous cards = 110',
  `Total: ${totalCardsAcrossFactions}, Faction results: ${Array.from(factionIdSets.entries()).map(([k, v]) => `${k}:${v.length}`).join(', ')}`
);

// 1.3 Strict Zero-Overlap: Faction pairwise intersection is empty
let overlapFound = false;
let overlapPair = '';
const allFactionKeys = Array.from(factionIdSets.keys());
for (let i = 0; i < allFactionKeys.length; i++) {
  for (let j = i + 1; j < allFactionKeys.length; j++) {
    const setA = new Set(factionIdSets.get(allFactionKeys[i])!);
    const listB = factionIdSets.get(allFactionKeys[j])!;
    const intersection = listB.filter(id => setA.has(id));
    if (intersection.length > 0) {
      overlapFound = true;
      overlapPair = `${allFactionKeys[i]} ∩ ${allFactionKeys[j]} = [${intersection.join(', ')}]`;
      break;
    }
  }
  if (overlapFound) break;
}

assert(
  'CHAL.PART.3',
  'Partition Invariants',
  'Pairwise intersection across all 11 factions is strictly empty (0 overlaps)',
  !overlapFound,
  '0 overlaps',
  overlapFound ? overlapPair : 'Disjoint partition verified'
);

// 1.4 Wind faction specifically maps cards 21..30 and renders element badge as wind with CSS uppercase
playRpgState.arcadeQuery = '';
playRpgState.arcadeElement = 'wind';
const windHtml = renderPlaySection();
let windCardsRenderCorrectly = true;
for (let id = 21; id <= 30; id++) {
  const card = CARD_DATABASE[id];
  if (!windHtml.includes(card?.title || '') || !windHtml.includes('>wind<')) {
    windCardsRenderCorrectly = false;
  }
}
assert(
  'CHAL.PART.4',
  'Partition Invariants',
  'Wind faction correctly normalizes air->wind and renders element badge >wind< for cards 21..30',
  windCardsRenderCorrectly && factionIdSets.get('wind')?.length === 10,
  '10 cards with wind badge',
  `Wind count: ${factionIdSets.get('wind')?.length}, rendered wind badge: ${windCardsRenderCorrectly}`
);

// 1.5 Element filter 'all' returns all 110 cards
playRpgState.arcadeQuery = '';
playRpgState.arcadeElement = 'all';
const allHtml = renderPlaySection();
let allCount = 0;
for (let id = 1; id <= 110; id++) {
  if (allHtml.includes(`data-card-id="${id}"`)) {
    allCount++;
  }
}
assert(
  'CHAL.PART.5',
  'Partition Invariants',
  'Element filter "all" renders exactly all 110 cards in CARD_DATABASE',
  allCount === 110,
  '110 cards',
  `${allCount} cards rendered`
);

// ===========================================================================
// SUITE 2: Search Query Narrowing Multi-vector Stress
// ===========================================================================
console.log('\n--- Suite 2: Search Query Narrowing Multi-vector Stress ---');

// 2.1 Korean Title Exact & Partial Search ("드래곤" - Dragon in Korean)
playRpgState.arcadeElement = 'all';
playRpgState.arcadeQuery = '드래곤';
const dragonHtml = renderPlaySection();
let dragonMatches: number[] = [];
for (let id = 1; id <= 110; id++) {
  if (dragonHtml.includes(`data-card-id="${id}"`)) dragonMatches.push(id);
}
assert(
  'CHAL.SEARCH.1',
  'Search Query',
  'Searching "드래곤" matches Korean dragon cards (count >= 1 and < 110)',
  dragonMatches.length >= 1 && dragonMatches.length < 110,
  'Partial match list with dragon cards',
  `Found ${dragonMatches.length} matches: [${dragonMatches.join(', ')}]`
);

// 2.2 Case Insensitive Search
playRpgState.arcadeElement = 'all';
playRpgState.arcadeQuery = 'kadan';
const kadanLowerHtml = renderPlaySection();
const kadanLowerMatches = (kadanLowerHtml.match(/data-card-id=/g) || []).length;

playRpgState.arcadeQuery = 'KADAN';
const kadanUpperHtml = renderPlaySection();
const kadanUpperMatches = (kadanUpperHtml.match(/data-card-id=/g) || []).length;

playRpgState.arcadeQuery = 'KaDaN';
const kadanMixedHtml = renderPlaySection();
const kadanMixedMatches = (kadanMixedHtml.match(/data-card-id=/g) || []).length;

assert(
  'CHAL.SEARCH.2',
  'Search Query',
  'Search is case-insensitive ("kadan" vs "KADAN" vs "KaDaN" return identical match count)',
  kadanLowerMatches === kadanUpperMatches && kadanUpperMatches === kadanMixedMatches,
  `Equal counts`,
  `kadan: ${kadanLowerMatches}, KADAN: ${kadanUpperMatches}, KaDaN: ${kadanMixedMatches}`
);

// 2.3 Description Search Capability
// Find a word that appears only in card.desc, not in card.title
let uniqueDescWord = '';
let targetCardIdWithDesc = -1;
for (let id = 1; id <= 110; id++) {
  const card = CARD_DATABASE[id];
  if (card && card.desc && card.desc.length > 5) {
    const words = card.desc.split(/\s+/).filter(w => w.length >= 3);
    for (const w of words) {
      const cleanW = w.replace(/[^가-힣a-zA-Z]/g, '').toLowerCase();
      if (cleanW.length >= 3 && !card.title?.toLowerCase().includes(cleanW)) {
        uniqueDescWord = cleanW;
        targetCardIdWithDesc = id;
        break;
      }
    }
  }
  if (uniqueDescWord) break;
}

if (uniqueDescWord) {
  playRpgState.arcadeQuery = uniqueDescWord;
  const descSearchHtml = renderPlaySection();
  const foundInDesc = descSearchHtml.includes(`data-card-id="${targetCardIdWithDesc}"`);
  assert(
    'CHAL.SEARCH.3',
    'Search Query',
    `Searching keyword from description ("${uniqueDescWord}") includes target Card #${targetCardIdWithDesc}`,
    foundInDesc,
    `Card #${targetCardIdWithDesc} included`,
    `Found in DOM: ${foundInDesc}`
  );
} else {
  assert(
    'CHAL.SEARCH.3',
    'Search Query',
    'Searching description skipped (no unique desc word found)',
    true,
    'true',
    'skipped'
  );
}

// 2.4 Whitespace and Input Trimming through handlePlayAction
const mockInputElement = {
  value: '   카단   ',
} as HTMLInputElement;

handlePlayAction('play-arcade-search', mockInputElement);
assert(
  'CHAL.SEARCH.4',
  'Search Query',
  'handlePlayAction("play-arcade-search") trims whitespace from input value ("   카단   " -> "카단")',
  playRpgState.arcadeQuery === '카단',
  '카단',
  playRpgState.arcadeQuery
);

// 2.5 Regex Special Characters do NOT Crash or Throw
const regexPayloads = ['.*', '+', '(', '[a-z]', '(?=.*)', '***', '\\d+'];
let regexCrash = false;
for (const payload of regexPayloads) {
  try {
    playRpgState.arcadeQuery = payload;
    const html = renderPlaySection();
    if (typeof html !== 'string') regexCrash = true;
  } catch {
    regexCrash = true;
  }
}
assert(
  'CHAL.SEARCH.5',
  'Search Query',
  'Adversarial regex metacharacters in search input evaluate safely without runtime exceptions',
  !regexCrash,
  'No crash',
  regexCrash ? 'Exception thrown' : 'All regex payloads handled safely'
);

// 2.6 Dual Enforcement: Search + Element Chip
playRpgState.arcadeElement = 'human';
playRpgState.arcadeQuery = '카단';
const humanKadanHtml = renderPlaySection();
const hasHumanKadan = humanKadanHtml.includes(`data-card-id="41"`);

playRpgState.arcadeElement = 'water'; // Kadan is human (41), not water
playRpgState.arcadeQuery = '카단';
const waterKadanHtml = renderPlaySection();
const hasWaterKadan = waterKadanHtml.includes(`data-card-id="41"`);

assert(
  'CHAL.SEARCH.6',
  'Search Query',
  'Combined Search + Element Chip strictly enforces both criteria (Kadan in human: true, Kadan in water: false)',
  hasHumanKadan && !hasWaterKadan,
  'human: true, water: false',
  `human: ${hasHumanKadan}, water: ${hasWaterKadan}`
);

// 2.7 Nonsense Query Yields Exactly 0 Matches
playRpgState.arcadeElement = 'all';
playRpgState.arcadeQuery = 'xyz_nonexistent_impossible_query_999';
const noneHtml = renderPlaySection();
const noneMatches = (noneHtml.match(/data-card-id=/g) || []).length;
assert(
  'CHAL.SEARCH.7',
  'Search Query',
  'Zero-match search query returns empty game list (0 cards rendered) without crashing',
  noneMatches === 0,
  '0 matches',
  `${noneMatches} matches`
);

// ===========================================================================
// SUITE 3: Random Play Modal Behavior Across All 11 Factions
// ===========================================================================
console.log('\n--- Suite 3: Random Play Modal Behavior Across All 11 Factions ---');

// 3.1 Monte Carlo 10,000 rolls: Coverage and Boundary Check
let rollsValid = true;
const rollCounts = new Map<number, number>();
for (let i = 0; i < 10000; i++) {
  const rolled = rollRandomArcadeGame();
  if (!Number.isInteger(rolled) || rolled < 1 || rolled > 110) {
    rollsValid = false;
    break;
  }
  rollCounts.set(rolled, (rollCounts.get(rolled) || 0) + 1);
}
assert(
  'CHAL.RANDOM.1',
  'Random Die Roller',
  'Monte Carlo 10,000 rolls: All roll outputs are integers strictly within [1..110]',
  rollsValid && rollCounts.size === 110,
  '110 distinct card IDs rolled, 0 out-of-bounds',
  `Distinct IDs: ${rollCounts.size}, All Valid: ${rollsValid}`
);

// 3.2 Modal Rendering Invariants Across All 110 Cards
let all110ModalsValid = true;
let failedModalIds: number[] = [];

for (let id = 1; id <= 110; id++) {
  launchArcadeGame(id);
  const modalHtml = renderPlaySection();
  const card = CARD_DATABASE[id];
  const padId = String(id).padStart(3, '0');

  const hasFullscreenContainer = modalHtml.includes('fixed inset-0') &&
    modalHtml.includes('h-[100dvh]') &&
    modalHtml.includes('select-none touch-none') &&
    modalHtml.includes('z-[99999]');

  const hasCardTitle = modalHtml.includes(card?.title || '');
  const hasPortrait = modalHtml.includes(`/seat/Hero_${padId}.png`);
  const hasCloseBtn = modalHtml.includes('data-action="play-arcade-close"') &&
    modalHtml.includes('min-h-[44px]') &&
    modalHtml.includes('min-w-[44px]');
  const hasDuelBtn = modalHtml.includes('data-action="play-ambush-start"') &&
    modalHtml.includes('min-h-[44px]');

  if (!hasFullscreenContainer || !hasCardTitle || !hasPortrait || !hasCloseBtn || !hasDuelBtn) {
    all110ModalsValid = false;
    failedModalIds.push(id);
  }

  // Unmount modal
  closeArcadeModal();
}

assert(
  'CHAL.RANDOM.2',
  'Random Modal Invariants',
  '100dvh fullscreen launch modal renders with 100% integrity across ALL 110 cards (IDs 1..110)',
  all110ModalsValid,
  '110/110 valid modals',
  `${110 - failedModalIds.length}/110 valid modals, failures: [${failedModalIds.join(', ')}]`
);

// 3.3 Modal Dismissal completely unmounts modal DOM markup
launchArcadeGame(41);
let renderedWithModal = renderPlaySection();
const modalWasMounted = renderedWithModal.includes('h-[100dvh]');

closeArcadeModal();
let renderedWithoutModal = renderPlaySection();
const modalWasUnmounted = !renderedWithoutModal.includes('h-[100dvh]');

assert(
  'CHAL.RANDOM.3',
  'Random Modal Invariants',
  'closeArcadeModal() completely removes the 100dvh modal markup from the rendered DOM string',
  modalWasMounted && modalWasUnmounted,
  'Mounted: true -> Unmounted: true',
  `Mounted: ${modalWasMounted}, Still in DOM: ${!modalWasUnmounted}`
);

// 3.4 Interactive Action Delegation for Random Roll & Close
// Call handlePlayAction('play-arcade-random')
handlePlayAction('play-arcade-random');
const randomRolledId = playRpgState.activeArcadeModalId;
const isRandomRolledValid = typeof randomRolledId === 'number' && randomRolledId >= 1 && randomRolledId <= 110;

handlePlayAction('play-arcade-close');
const isClosedAfterAction = playRpgState.activeArcadeModalId === null;

assert(
  'CHAL.RANDOM.4',
  'Random Modal Invariants',
  'handlePlayAction("play-arcade-random") and ("play-arcade-close") orchestrate modal state accurately',
  isRandomRolledValid && isClosedAfterAction,
  'Random ID in [1..110], then null on close',
  `Rolled ID: ${randomRolledId}, Closed: ${isClosedAfterAction}`
);

// ===========================================================================
// SUITE 4: Cross-Feature Invariants & Production Build Integrity
// ===========================================================================
console.log('\n--- Suite 4: Cross-Feature Invariants & Production Build Integrity ---');

// 4.1 Webtoon 5-button control bar
setActiveTab('webtoon');
const webtoonHtml = renderPlaySection();
const hasClose = webtoonHtml.includes('닫기');
const hasPrev = webtoonHtml.includes('이전');
const hasNext = webtoonHtml.includes('다음');
const hasNarration = webtoonHtml.includes('나레이션');
const hasTts = webtoonHtml.includes('TTS');

assert(
  'CHAL.CROSS.1',
  'Cross-Feature Invariants',
  'Webtoon view strictly preserves the 5 canonical control buttons: 닫기, 이전, 다음, 나레이션, TTS',
  hasClose && hasPrev && hasNext && hasNarration && hasTts,
  'All 5 buttons present',
  `Close:${hasClose}, Prev:${hasPrev}, Next:${hasNext}, Narration:${hasNarration}, TTS:${hasTts}`
);

// 4.2 TTS Default and Non-Activation Invariant
assert(
  'CHAL.CROSS.2',
  'Cross-Feature Invariants',
  'TTS state is strictly false on initial load and navigation',
  playState.isTtsActive === false,
  'isTtsActive: false',
  `isTtsActive: ${playState.isTtsActive}`
);

// 4.3 DESIGN.md Geometry Compliance
const playSectionPath = path.resolve(process.cwd(), 'src/landing/views/PlaySection.tsx');
const playSectionSrc = fs.readFileSync(playSectionPath, 'utf-8');
const prohibitedClasses = ['rounded-xl', 'rounded-2xl', 'rounded-3xl', 'animate-bounce', 'animate-ping'];
let prohibitedFound: string[] = [];
for (const cls of prohibitedClasses) {
  if (playSectionSrc.includes(cls)) {
    prohibitedFound.push(cls);
  }
}
assert(
  'CHAL.CROSS.3',
  'Design Compliance',
  'src/landing/views/PlaySection.tsx contains 0 prohibited decorative classes (rounded-xl/2xl/3xl, animate-bounce/ping)',
  prohibitedFound.length === 0,
  '0 prohibited classes',
  `${prohibitedFound.length} found: [${prohibitedFound.join(', ')}]`
);

// 4.4 Production Bundle Size & Zero React 19 Runtime
const distIndexPath = path.resolve(process.cwd(), 'dist/index.html');
const distExists = fs.existsSync(distIndexPath);
let bundleSizeKb = 0;
let hasReactVendor = true;

if (distExists) {
  const stats = fs.statSync(distIndexPath);
  bundleSizeKb = stats.size / 1024;
  const distContent = fs.readFileSync(distIndexPath, 'utf-8');
  hasReactVendor = distContent.includes('vendor-react');
}

assert(
  'CHAL.CROSS.4',
  'Production Bundle',
  'dist/index.html exists, size < 50 KB ceiling, and zero React 19 vendor bundles loaded',
  distExists && bundleSizeKb < 50 && !hasReactVendor,
  'Size < 50 KB and hasReactVendor: false',
  `dist exists: ${distExists}, size: ${bundleSizeKb.toFixed(2)} KB, hasReactVendor: ${hasReactVendor}`
);

// ===========================================================================
// SUMMARY & VERDICT
// ===========================================================================
console.log('\n========================================================================');
console.log('                 EMPIRICAL STRESS TEST SUMMARY                          ');
console.log('========================================================================');
const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = total - passed;
const rate = ((passed / total) * 100).toFixed(1);

console.log(`Total Assertions : ${total}`);
console.log(`Passed           : ${passed}`);
console.log(`Failed           : ${failed}`);
console.log(`Success Rate     : ${rate}%`);

if (failed === 0) {
  console.log('\nEMPIRICAL VERDICT: APPROVE (Zero defects detected across all test vectors)');
  process.exit(0);
} else {
  console.log('\nEMPIRICAL VERDICT: REQUEST_CHANGES (Defects detected during stress execution)');
  process.exit(1);
}
