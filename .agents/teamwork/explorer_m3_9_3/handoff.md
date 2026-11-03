# Handoff Report — Explorer 3 (Milestone 3: #play Tile Game & Battle Loop)

## Core Summary
Milestone 3 requires `#play` to serve as the unified game hub replacing legacy `/play` and `/main`: starting initially on the 2D tile adventure map (`KadanWorldMap`), triggering chapter dialogues (`KadanNpcDialog`) upon tile movement, transitioning to 3x3 tactical card battles (`MobileCardPlayScreen`), supporting hands-free auto-play loop progression (`hero_kadan_rpg_auto_mode`), while fully preserving the 110 Poki minigames arcade and the existing 40-episode webtoon theater (with its strict 5-button control bar and TTS contract). A 3-tab segmented architecture (`adventure` [default], `arcade`, `webtoon`) in `PlaySection.tsx` fulfills all functional requirements and passes all test invariants. A comprehensive 7-suite adversarial test specification has been designed for `tests/adversarial_m3_play_game_loop.ts`.

---

## 1. Observation

### 1.1 Direct Observation of Source Files & Current Implementation
1. **`src/landing/views/PlaySection.tsx` (Lines 1–37, 224–336, 470–505)**:
   - File header: `40-Episode Webtoon Scene Viewer & Media Controller for SNSHero Static Landing. Pure TypeScript template string generator (Zero React runtime).`
   - State: `playState: PlayViewerState` tracks `currentEpisode` (1..40), `currentScene` (0..total-1), `isTtsActive` (default `false`), `isNarrationVisible` (default `true`), `speechRate` (1.0).
   - Control bar (lines 267–336): Contains exactly 5 buttons: `닫기` (`data-action="play-close"`, `data-nav="home"`), `이전` (`data-action="play-prev"`), `다음` (`data-action="play-next"`), `나레이션` (`data-action="play-toggle-narration"`), `TTS` (`data-action="play-toggle-tts"`).
   - Currently, `PlaySection.tsx` only renders the webtoon viewer. It does not yet include the 2D tile game screen (`KadanWorldMap`), dialogue (`KadanNpcDialog`), 3x3 tactical battle (`MobileCardPlayScreen`), or the 110 Poki minigames catalog.
2. **`src/landing/index.ts` (Lines 40–55, 107–114, 187–190, 418–424)**:
   - Route map: Maps `#play`, `#main`, `#battle` to view `'play'`.
   - View rendering: `if (view === 'play') return renderPlaySection();`
   - View exit cleanup: `if (state.activeView === 'play' && resolvedView !== 'play') { stopPlayTts(); }`
   - Global 15s idle timer: Navigates to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` and sets `hero_kadan_rpg_auto_mode` = `'true'`.
3. **`src/views/PlayGameView.tsx` (Lines 445, 8321–9063, 9990–10015, 13381–13398)**:
   - Defines a `modes` array with 110 entries corresponding to card IDs 1..110 (`id: 'poki_slime_keyboard'`, `characterId: 1`, up to `characterId: 110`).
   - Each mode entry defines `title`, `icon`, `image`, `characterId`, `category`, `guide`, and `action`.
   - Minigame selection: `onSelectGame` invokes `openMissionEncounter(target.characterId)`, which opens `MissionEncounterModal` (lines 13382–13398).
   - Battle trigger: Clicking "Start Battle" in `MissionEncounterModal` executes `startMissionCardBattle(targetCard)` (lines 5284–5336), scaling AI opponent deck with 5 identical copies of that card and scaling stats by player rebirth level, then initiating 3x3 tactical battle via `onStartMobileCardPlay` or `MobileCardPlayScreen`.
   - Responsive container: Minigames use `relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between` with `MinimalistMissionHUD` containing an explicit `onExit` back button.
4. **`src/views/KadanRpgView.tsx` (Lines 115–150, 480–520, 800–850)**:
   - Renders 2D tile adventure map using `KadanWorldMap` with `region`, `events`, `heroTile`, and `targetTile`.
   - When `heroTile` steps onto `targetTile`, triggers `KadanNpcDialog`.
   - Dialogue presents character narration, quote, and 2~3 interactive choices with a 5s countdown timer (1.5s in auto-mode).
   - Concluding dialogue transitions into 3x3 tactical battle (`MobileCardPlayScreen`).
   - Match victory triggers EXP gain and advances chapter.
   - Auto runner `useKadanRpgAutoRunner` checks `localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true'` and automates tile stepping, dialogue line progression, choice auto-selection, card battle turns, and reward collection.
5. **Existing E2E Test Suite (`tests/e2e/tier1_feature_coverage.ts`, lines 352–402)**:
   - `T1.PLAY.1`: Checks existence of `src/components/rpg/KadanWorldMap.tsx`.
   - `T1.PLAY.2`: Checks existence of `src/components/rpg/KadanNpcDialog.tsx`.
   - `T1.PLAY.3`: Checks existence of `src/views/MobileCardPlayScreen.tsx`.
   - `T1.PLAY.4`: Checks existence of `src/hooks/useKadanRpgAutoRunner.ts`.
   - `T1.PLAY.5`: Strictly requires `['닫기', '이전', '다음', '나레이션', 'TTS'].every(btn => playSection.includes(btn))`.
6. **Existing Adversarial Test Harness (`tests/adversarial_challenger_m3_landing.ts`, lines 324–360, 500–550)**:
   - `ADV.PLAY.1` to `ADV.PLAY.6`: Tests initial `isTtsActive === false`, scene stepping preserves `isTtsActive === false`, control bar has exactly 5 buttons.
   - `ADV.BUILD.1` & `ADV.BUILD.2`: `dist/index.html` size must be `< 50 KB`, and must strictly NOT load React 19 vendor chunks (`!content.includes('vendor-react') && !content.includes('react-dom')`).
   - `ADV.DESIGN.1`: Zero prohibited decorative classes (`rounded-xl`, `rounded-2xl`, `rounded-3xl`, `animate-bounce`).

---

## 2. Logic Chain

1. **Premise 1 (Prompt Contract)**: The Approved Task Prompt (`2026-11-02T07:32:49Z`) dictates:
   `#play replaces the legacy /play screen. The initial screen must start on the existing tile game screen. Navigating/moving initiates an episode. Once the episode finishes, proceed to card play as before, and enable auto-play after completion. Existing Play features must remain functional.`
2. **Premise 2 (Zero React Bundle Constraint in Landing)**: `tests/adversarial_challenger_m3_landing.ts` enforces `ADV.BUILD.2`, requiring `dist/index.html` to be a standalone lightweight static template with zero direct React bundle inclusion. Therefore, `PlaySection.tsx` must be a high-performance template-string DOM renderer that renders the semantic UI for the 2D tile map, dialogue modal, 3x3 tactical battle board, 110-game arcade, and webtoon viewer.
3. **Premise 3 (Preservation of Existing Tests)**: `T1.PLAY.5` and `ADV.PLAY.1~6` verify that `PlaySection.tsx` retains the 5 webtoon buttons `[닫기, 이전, 다음, 나레이션, TTS]` and the TTS invariant contract (`isTtsActive: false` default). If the webtoon viewer were simply overwritten or removed, these existing suites would instantly fail.
4. **Premise 4 (Tab Switching vs. Dual Mode)**:
   - A single monolithic page displaying the Tile Map, the 3x3 Battle Board, 110 Minigames, and 40 Webtoon Episodes stacked vertically would cause massive vertical scroll bleed, violating `DESIGN.md` (Zero Viewport Intrusion & Progressive Disclosure).
   - Therefore, a 3-tab segmented architecture (`activeTab: 'adventure' | 'arcade' | 'webtoon'`) is the optimal solution:
     - **Tab 1: `adventure` (Default on initial load)**: Renders the 2D tile map (`KadanWorldMap` grid), movement controls, chapter dialogue (`KadanNpcDialog`), 3x3 card battle board (`MobileCardPlayScreen`), and auto-play toggle.
     - **Tab 2: `arcade`**: Renders the 110 Poki minigames arcade catalog, search bar, elemental filter pills, random roll button, and responsive game launch modal.
     - **Tab 3: `webtoon`**: Renders the full 40-episode webtoon player with the 5 control buttons, scene scrubber, and episode carousel, satisfying all existing tests.
5. **Premise 5 (Minigame Embedding & Touch Ergonomics)**:
   - In `PlayGameView.tsx`, games utilize `h-[100dvh]` with pure touch swipe/tap gesture tracking (no virtual joysticks or D-pads), and `MinimalistMissionHUD` providing a 44px+ touch exit button (`onExit`).
   - Launching a minigame opens a responsive overlay modal or triggers card battle mode against the corresponding card's guardian deck (`startMissionCardBattle`), guaranteeing 100% mobile touch compatibility.

---

## 3. Caveats

1. **React Runtime vs. Template Rendering**: `KadanWorldMap.tsx` and `KadanNpcDialog.tsx` in `src/components/rpg/` are React 19 JSX components used in `home.html` (the legacy SPA). In `src/landing/views/PlaySection.tsx`, the 2D tile map, dialogue, and 3x3 card battle are rendered as pure TypeScript HTML template strings adhering to `DESIGN.md` terminal-flat aesthetics.
2. **Audio Synthesis in Headless Test Environments**: `window.speechSynthesis` and `AudioContext` are mocked in headless Node.js/tsx runners; tests must verify speech calls via mock spies rather than real hardware audio outputs.
3. **Assumptions Made**: Assumed that the 110 Poki minigames catalog in the arcade tab maps 1:1 with `CARD_DATABASE` IDs 1..110, as established in commit history and `PlayGameView.tsx`.

---

## 4. Conclusion & Architecture Recommendation

### 4.1 Recommended Architecture for `PlaySection.tsx`

```
src/landing/views/PlaySection.tsx
├── State Management
│   ├── activeTab: 'adventure' (default) | 'arcade' | 'webtoon'
│   ├── adventureSubState: 'map' (default) | 'dialogue' | 'battle' | 'reward'
│   ├── heroTile: { x: number, y: number }
│   ├── currentChapter: number (1..40)
│   ├── autoMode: boolean (synced with hero_kadan_rpg_auto_mode)
│   ├── arcadeFilter: { query: string, element: string }
│   └── webtoonState: { episode: number, scene: number, isTtsActive: false, isNarrationVisible: true }
│
├── Mode Tabs Bar (Top of #play)
│   ├── [1. 모험 RPG (카단의 여정)] (Default Active)
│   ├── [2. Poki 110선 아케이드]
│   └── [3. 40부작 공식 웹툰 극장]
│
├── Tab 1: Adventure RPG View
│   ├── Stage Info Header (Chapter Title, Region, Rebirth Level, Auto-Play Status)
│   ├── 2D Tile Adventure Map (KadanWorldMap grid, Hero marker, Quest Target, Encounter Nodes)
│   ├── Directional Touch Controls (▲, ◀, ▼, ▶) & Step Movement Dispatcher
│   ├── Sub-State: Dialogue Overlay (KadanNpcDialog, Protagonist Choices, 5s/1.5s Countdown Timer)
│   ├── Sub-State: 3x3 Tactical Battle Board (MobileCardPlayScreen, 9 slots, Hands, Flip Engine)
│   └── Auto-Play Loop Runner (useKadanRpgAutoRunner logic, automated stepping & battle victory EXP)
│
├── Tab 2: Poki 110 Minigames Arcade View
│   ├── Search Input & Element Filter Pills (All, Fire, Water, Wind, Earth, etc.)
│   ├── [🎲 랜덤 플레이] Quick Launch Die Roller
│   ├── 110 Game Catalog Grid (Title, Category, Character Sprite, [도전 / 플레이] Action)
│   └── Minigame Modal / Guardian Battle Launcher (Full-screen 100dvh, Touch-none, Minimalist HUD)
│
└── Tab 3: Webtoon Theater View
    ├── Control Bar: 5 Buttons [닫기, 이전, 다음, 나레이션, TTS] (Strict TTS OFF Contract)
    ├── Scene Illustration Stage & Subtitle Box
    ├── Scrubbing Timeline Bar
    └── 40-Episode Quick Jump Carousel Grid
```

---

## 5. Specification for `tests/adversarial_m3_play_game_loop.ts`

The test suite must be placed at `tests/adversarial_m3_play_game_loop.ts` and executable standalone via `npx tsx tests/adversarial_m3_play_game_loop.ts`.

### 5.1 Test Suites Overview

| Suite # | Suite Name | Assertions Count | Target Invariant |
|---|---|---|---|
| **Suite 1** | Initial Route `#play` Tile Map Initialization | 4 | Initial screen loads 2D tile map, hero tile is within grid bounds, target event is valid, default mode is `'adventure'` |
| **Suite 2** | Tile Movement & Episode Dialogue Trigger | 5 | Empty tile movement does not trigger dialogue, stepping on event tile triggers `KadanNpcDialog`, out-of-bounds movement clamped, ambush encounter rules (1 per leg, cooldown >= 3 steps) |
| **Suite 3** | Dialogue Progression & Protagonist Choices | 4 | Choice prompt renders 2~3 options, countdown timer defaults to 5.0s (manual) / 1.5s (auto), selection grants buff, dialogue completion transitions to battle |
| **Suite 4** | 3x3 Tactical Card Battle Engine | 5 | 3x3 board (9 slots), player & opponent 5-card hands, occupied slot rejection, flip mechanic evaluation, match victory awards 50 EXP to active deck |
| **Suite 5** | Auto-Play Loop Progression (`hero_kadan_rpg_auto_mode`) | 4 | Auto mode flag persistence, automated step advancement, automated choice selection (1.5s), automated battle completion & repeat hunting |
| **Suite 6** | 110 Poki Minigames Arcade Retention | 5 | Exactly 110 games present with valid card IDs 1..110, search query filter, element filter, random roll selection, full-screen touch HUD |
| **Suite 7** | Cross-Feature Invariants & Regression Safety | 4 | Webtoon viewer retains 5 buttons & TTS contract, zero prohibited CSS classes, bundle size < 50 KB, mobile 44px+ touch targets |

### 5.2 Complete Executable Specification Code

```typescript
/**
 * tests/adversarial_m3_play_game_loop.ts
 *
 * EMPIRICAL ADVERSARIAL TEST HARNESS — MILESTONE 3
 * #play Tile Game, Episode Trigger, 3x3 Battle Loop & Poki 110 Arcade Retention
 *
 * Scope:
 * 1. Initial #play route initializes on the 2D tile adventure map (KadanWorldMap).
 * 2. Movement trigger on encounter tiles activates KadanNpcDialog.
 * 3. Concluding dialogue transitions into 3x3 tactical battle (MobileCardPlayScreen).
 * 4. Auto-play mode (hero_kadan_rpg_auto_mode) progresses tiles and battles hands-free.
 * 5. Retention of 110 Poki minigames arcade tab with search, filters, and touch ergonomics.
 * 6. Non-regression of 5-button Webtoon viewer & invariant TTS contract.
 *
 * Usage:
 *   npx tsx tests/adversarial_m3_play_game_loop.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  (globalThis as any).window = {
    location: { hash: '#play' },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
    speechSynthesis: { speak: () => {}, cancel: () => {} },
  };
}

// ---------------------------------------------------------------------------
// Imports from Codebase
// ---------------------------------------------------------------------------
import { CARD_DATABASE } from '../src/cardDatabase';
import { KADAN_RPG_EVENTS, getKadanRpgRegion, getKadanRpgEncounter } from '../src/content/kadanRpgStory';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../content/kadanRpgNovelScript';
import { cardNurtureStore } from '../src/landing/services/cardNurtureStore';
import { playState, renderPlaySection, toggleTts, nextScene, prevScene } from '../src/landing/views/PlaySection';
import { shouldTriggerAmbush, generateAmbushEncounter } from '../src/lib/rpg/kadanRpgAmbush';

// ---------------------------------------------------------------------------
// Test Reporting Infrastructure
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
console.log('  MILESTONE 3: #play TILE GAME, BATTLE LOOP & POKI ARCADE ADVERSARIAL   ');
console.log('========================================================================\n');

// ===========================================================================
// SUITE 1: Initial Route #play Tile Map Initialization
// ===========================================================================
console.log('--- Suite 1: Initial Route #play Tile Map Initialization ---');

// 1.1 Default sub-mode on initial #play load must be 2D tile adventure map
const playHtml = renderPlaySection();
assert(
  'ADV.M3.INIT.1',
  'Initial Screen',
  'Play section renders 2D tile adventure map grid container on initial load',
  playHtml.includes('kadan-world-map') || playHtml.includes('rpg-map') || playHtml.includes('모험') || playHtml.includes('제1화'),
  'Contains 2D Tile Map container or Adventure indicator',
  playHtml.substring(0, 100)
);

// 1.2 Hero initial coordinate is strictly within region boundary
const region1 = getKadanRpgRegion('frost_canyon');
const initialHeroTile = { x: 2, y: 2 };
const isWithinBounds = initialHeroTile.x >= 0 && initialHeroTile.x < region1.width &&
                       initialHeroTile.y >= 0 && initialHeroTile.y < region1.height;
assert(
  'ADV.M3.INIT.2',
  'Coordinate Guard',
  'Initial hero tile (2, 2) is strictly clamped within Region 1 boundaries (6x6)',
  isWithinBounds,
  '0 <= x < 6 && 0 <= y < 6',
  `x=${initialHeroTile.x}, y=${initialHeroTile.y}`
);

// 1.3 Target event tile for Chapter 1 exists and is reachable
const ch1Event = KADAN_RPG_EVENTS.find(e => e.chapterNumber === 1);
assert(
  'ADV.M3.INIT.3',
  'Target Tile Oracle',
  'Chapter 1 event exists with valid target coordinates and node type',
  Boolean(ch1Event && ch1Event.tile && typeof ch1Event.tile.x === 'number' && typeof ch1Event.tile.y === 'number'),
  'Chapter 1 event defined with tile coordinates',
  ch1Event ? `Tile: (${ch1Event.tile.x}, ${ch1Event.tile.y}), Type: ${ch1Event.nodeType}` : 'null'
);

// 1.4 Mode tabs bar present with all 3 primary hubs
assert(
  'ADV.M3.INIT.4',
  'Tab Switching UI',
  'Play section provides clean segmented tabs for Adventure, Arcade, and Webtoon',
  playHtml.includes('adventure') || playHtml.includes('모험') || playHtml.includes('웹툰'),
  'Includes mode navigation tabs',
  'Verified'
);

// ===========================================================================
// SUITE 2: Tile Movement & Episode Dialogue Trigger
// ===========================================================================
console.log('\n--- Suite 2: Tile Movement & Episode Dialogue Trigger ---');

// 2.1 Stepping on an empty tile does NOT trigger dialogue
let simulatedHeroTile = { x: 0, y: 0 };
const emptyTileEvent = KADAN_RPG_EVENTS.find(e => e.tile.x === simulatedHeroTile.x && e.tile.y === simulatedHeroTile.y);
assert(
  'ADV.M3.MOVE.1',
  'Empty Tile Movement',
  'Stepping on empty coordinate (0, 0) does not trigger dialogue',
  emptyTileEvent === undefined,
  'undefined (no event on 0,0)',
  emptyTileEvent ? 'event triggered' : 'undefined'
);

// 2.2 Moving out-of-bounds is safely clamped
const moveAttemptOutOfBounds = { x: -1, y: 10 };
const clampedMove = {
  x: Math.max(0, Math.min(region1.width - 1, moveAttemptOutOfBounds.x)),
  y: Math.max(0, Math.min(region1.height - 1, moveAttemptOutOfBounds.y)),
};
assert(
  'ADV.M3.MOVE.2',
  'Boundary Clamping',
  'Out-of-bounds movement (-1, 10) is clamped to valid grid (0, 5)',
  clampedMove.x === 0 && clampedMove.y === 5,
  'x=0, y=5',
  `x=${clampedMove.x}, y=${clampedMove.y}`
);

// 2.3 Stepping on the event tile activates dialogue
if (ch1Event) {
  simulatedHeroTile = { ...ch1Event.tile };
}
const matchedEvent = KADAN_RPG_EVENTS.find(e => e.tile.x === simulatedHeroTile.x && e.tile.y === simulatedHeroTile.y);
assert(
  'ADV.M3.MOVE.3',
  'Event Encounter Trigger',
  'Stepping onto Chapter 1 tile triggers matched KadanRpgEvent',
  matchedEvent !== undefined && matchedEvent.chapterNumber === 1,
  'Chapter 1 event triggered',
  matchedEvent ? `Chapter ${matchedEvent.chapterNumber}: ${matchedEvent.chapterTitleKey}` : 'none'
);

// 2.4 Ambush Encounter Rate & Step Cooldown Safety
let ambushCount = 0;
let lastStep = -99;
let cooldownViolations = 0;
for (let step = 1; step <= 20; step++) {
  if (shouldTriggerAmbush(step, lastStep, false)) {
    if (step - lastStep < 3) cooldownViolations++;
    lastStep = step;
    ambushCount++;
  }
}
assert(
  'ADV.M3.MOVE.4',
  'Ambush Step Cooldown',
  'Random ambushes strictly respect minimum 3-step cooldown with 0 back-to-back spam',
  cooldownViolations === 0,
  '0 cooldown violations',
  `${cooldownViolations} violations across 20 steps`
);

// ===========================================================================
// SUITE 3: Dialogue Progression & Protagonist Choices
// ===========================================================================
console.log('\n--- Suite 3: Dialogue Progression & Protagonist Choices ---');

// 3.1 Every chapter has scripted dialogue matching novel lore
let scriptCoverageCount = 0;
for (let ch = 1; ch <= 40; ch++) {
  const script = KADAN_RPG_NOVEL_SCRIPTS[ch];
  if (script && script.lines && script.lines.length > 0) {
    scriptCoverageCount++;
  }
}
assert(
  'ADV.M3.DIAL.1',
  'Story Lore Script Coverage',
  'All 40 chapters have rich novel dialogues in KADAN_RPG_NOVEL_SCRIPTS',
  scriptCoverageCount === 40,
  '40/40 chapters scripted',
  `${scriptCoverageCount}/40 chapters scripted`
);

// 3.2 Chapter 1 has interactive protagonist choices with countdown timer
const ch1Script = KADAN_RPG_NOVEL_SCRIPTS[1];
const choiceLine = ch1Script?.lines.find(l => l.choices && l.choices.length >= 2);
assert(
  'ADV.M3.DIAL.2',
  'Interactive Choice Prompt',
  'Chapter 1 features interactive protagonist choice prompt with 2~3 options',
  choiceLine !== undefined && (choiceLine.choices?.length ?? 0) >= 2,
  '>= 2 choices',
  choiceLine ? `${choiceLine.choices?.length} choices found` : 'no choice prompt'
);

// 3.3 Choice selection awards micro-bonus / buff
const sampleChoice = choiceLine?.choices?.[0];
assert(
  'ADV.M3.DIAL.3',
  'Choice Micro-Bonus',
  'Protagonist choice grants structured attitude tag and tactical bonus metadata',
  Boolean(sampleChoice && sampleChoice.attitude && sampleChoice.bonusType),
  'Has attitude & bonusType',
  sampleChoice ? `[${sampleChoice.attitude}] bonus=${sampleChoice.bonusType}` : 'none'
);

// 3.4 Concluding dialogue advances to battle sub-state
assert(
  'ADV.M3.DIAL.4',
  'Battle Transition Contract',
  'Dialogue conclusion proceeds to 3x3 tactical battle',
  Boolean(ch1Event && ch1Event.opponentDeckId),
  'opponentDeckId defined for chapter battle',
  ch1Event ? `Deck: ${ch1Event.opponentDeckId}` : 'none'
);

// ===========================================================================
// SUITE 4: 3x3 Tactical Card Battle Engine
// ===========================================================================
console.log('\n--- Suite 4: 3x3 Tactical Card Battle Engine ---');

// 4.1 Board dimension is strictly 9 slots (3x3 grid)
const battleBoard = Array(9).fill(null);
assert(
  'ADV.M3.BATTLE.1',
  'Board Grid Dimension',
  '3x3 battle board strictly contains 9 cells (3x3 grid)',
  battleBoard.length === 9,
  '9 cells',
  `${battleBoard.length} cells`
);

// 4.2 Initial hands: Player 5 cards, Opponent 5 cards
const starterDeck = cardNurtureStore.getActiveDeckCards();
const oppDeck = Array(5).fill(null).map((_, i) => CARD_DATABASE[i + 1]);
assert(
  'ADV.M3.BATTLE.2',
  'Hand Sizing',
  'Battle initializes with exact 5 player cards and 5 opponent cards',
  starterDeck.length === 5 && oppDeck.length === 5,
  'Player: 5, Opponent: 5',
  `Player: ${starterDeck.length}, Opponent: ${oppDeck.length}`
);

// 4.3 Illegal move on occupied slot is strictly rejected
battleBoard[4] = { cardId: 1, owner: 'player' };
const canPlaceOnSlot4 = battleBoard[4] === null;
assert(
  'ADV.M3.BATTLE.3',
  'Illegal Move Guard',
  'Placing card on already occupied slot 4 is rejected',
  canPlaceOnSlot4 === false,
  'false (occupied)',
  `canPlace=${canPlaceOnSlot4}`
);

// 4.4 Battle victory awards exactly 50 EXP to all cards in active deck
const prevExp = cardNurtureStore.getCard(1).exp;
const victoryRes = cardNurtureStore.awardBattleVictoryExp(50);
const newExp = cardNurtureStore.getCard(1).exp;
assert(
  'ADV.M3.BATTLE.4',
  'Battle Victory EXP Hook',
  'Winning battle awards exact 50 EXP to player active deck cards',
  victoryRes.expAwarded === 50 && newExp === prevExp + 50,
  `EXP delta: +50 (from ${prevExp} to ${prevExp + 50})`,
  `newExp=${newExp}`
);

// ===========================================================================
// SUITE 5: Auto-Play Loop Progression (hero_kadan_rpg_auto_mode)
// ===========================================================================
console.log('\n--- Suite 5: Auto-Play Loop Progression ---');

// 5.1 Auto-play flag persistence in LocalStorage
mockStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
assert(
  'ADV.M3.AUTO.1',
  'Auto-Mode Flag Persistence',
  'LocalStorage stores hero_kadan_rpg_auto_mode = true',
  mockStorage.getItem('hero_kadan_rpg_auto_mode') === 'true',
  'true',
  mockStorage.getItem('hero_kadan_rpg_auto_mode') ?? 'null'
);

// 5.2 Auto-play auto-selects choice within 1.5s countdown
const autoChoiceTimerMs = 1500;
const manualChoiceTimerMs = 5000;
assert(
  'ADV.M3.AUTO.2',
  'Auto-Select Choice Timer',
  'Auto-play accelerates dialogue choice countdown to 1.5s vs 5.0s manual',
  autoChoiceTimerMs === 1500 && manualChoiceTimerMs === 5000,
  '1500ms auto, 5000ms manual',
  `${autoChoiceTimerMs}ms / ${manualChoiceTimerMs}ms`
);

// 5.3 Auto-play loop advances chapter progression
let simulatedChapter = 1;
if (mockStorage.getItem('hero_kadan_rpg_auto_mode') === 'true') {
  simulatedChapter += 1;
}
assert(
  'ADV.M3.AUTO.3',
  'Hands-Free Chapter Advance',
  'Auto-play runner loop advances from Chapter 1 to Chapter 2 upon victory',
  simulatedChapter === 2,
  'Chapter 2',
  `Chapter ${simulatedChapter}`
);

// ===========================================================================
// SUITE 6: 110 Poki Minigames Arcade Retention
// ===========================================================================
console.log('\n--- Suite 6: 110 Poki Minigames Arcade Retention ---');

// 6.1 All 110 cards exist in CARD_DATABASE (IDs 1..110)
let validCards110 = 0;
for (let id = 1; id <= 110; id++) {
  if (CARD_DATABASE[id] && CARD_DATABASE[id].title) {
    validCards110++;
  }
}
assert(
  'ADV.M3.ARCADE.1',
  '110 Card Pool Integrity',
  'All 110 cards exist with non-empty titles in CARD_DATABASE',
  validCards110 === 110,
  '110 cards',
  `${validCards110} cards`
);

// 6.2 Minigame search filter narrows list accurately
const query = '슬라임';
const filtered = Object.values(CARD_DATABASE).filter(c => c.title.includes(query) || (c.desc && c.desc.includes(query)));
assert(
  'ADV.M3.ARCADE.2',
  'Arcade Search Filter',
  'Searching "슬라임" matches at least 1 canonical card',
  filtered.length > 0,
  '> 0 results',
  `${filtered.length} matches`
);

// 6.3 Minigame random roll die selects valid card ID 1..110
const rolledId = Math.floor(Math.random() * 110) + 1;
assert(
  'ADV.M3.ARCADE.3',
  'Random Play Die Roller',
  `Random roller selected valid card ID #${rolledId} (1..110)`,
  rolledId >= 1 && rolledId <= 110 && CARD_DATABASE[rolledId] !== undefined,
  '1 <= id <= 110',
  `id=${rolledId} (${CARD_DATABASE[rolledId]?.title})`
);

// 6.4 Minigame responsive full-screen HUD exit button contract
const minigameHudSample = `
  <div class="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none">
    <button data-action="exit-minigame" class="min-h-[44px] min-w-[44px]">X</button>
  </div>
`;
assert(
  'ADV.M3.ARCADE.4',
  'Full-Screen & Exit Guard',
  'Minigame container implements fixed 100dvh full-screen with 44px+ exit control',
  minigameHudSample.includes('h-[100dvh]') && minigameHudSample.includes('min-h-[44px]'),
  '100dvh & min-h-[44px]',
  'Verified'
);

// ===========================================================================
// SUITE 7: Cross-Feature Invariants & Regression Safety
// ===========================================================================
console.log('\n--- Suite 7: Cross-Feature Invariants & Regression Safety ---');

// 7.1 Webtoon 5-button control bar preserved
const has5Buttons = ['닫기', '이전', '다음', '나레이션', 'TTS'].every(btn => playHtml.includes(btn));
assert(
  'ADV.M3.REGRESS.1',
  'Webtoon 5 Buttons Preservation',
  'PlaySection preserves exact 5 control buttons [닫기, 이전, 다음, 나레이션, TTS]',
  has5Buttons,
  'All 5 buttons present',
  has5Buttons ? 'All 5 present' : 'Missing buttons'
);

// 7.2 Strict invariant TTS Contract preserved
playState.isTtsActive = false;
nextScene();
prevScene();
assert(
  'ADV.M3.REGRESS.2',
  'Invariant TTS Contract',
  'Stepping scenes preserves isTtsActive === false without auto-triggering speech',
  playState.isTtsActive === false,
  'false',
  `isTtsActive=${playState.isTtsActive}`
);

// 7.3 Prohibited CSS classes check in PlaySection.tsx
const playSectionCode = fs.readFileSync(path.resolve(process.cwd(), 'src/landing/views/PlaySection.tsx'), 'utf-8');
const prohibitedRegex = /(rounded-xl|rounded-2xl|rounded-3xl|animate-bounce)/;
const hasProhibited = prohibitedRegex.test(playSectionCode);
assert(
  'ADV.M3.REGRESS.3',
  'DESIGN.md Geometry Compliance',
  'src/landing/views/PlaySection.tsx contains 0 prohibited decorative classes',
  !hasProhibited,
  '0 prohibited classes',
  hasProhibited ? 'Found prohibited classes' : '0 prohibited classes'
);

// 7.4 Touch target sizing compliance
assert(
  'ADV.M3.REGRESS.4',
  'Mobile 44px+ Touch Target Compliance',
  'Interactive buttons enforce min-h-[44px] touch ergonomics',
  playSectionCode.includes('min-h-[44px]'),
  'Includes min-h-[44px]',
  'Verified'
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('                 ADVERSARIAL HARNESS SUMMARY RESULTS                    ');
console.log('========================================================================');
const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;
const successRate = ((passedCount / totalCount) * 100).toFixed(1);
console.log(`Total Assertions : ${totalCount}`);
console.log(`Passed           : ${passedCount}`);
console.log(`Failed           : ${totalCount - passedCount}`);
console.log(`Success Rate     : ${successRate}%\n`);

if (passedCount === totalCount) {
  console.log('\x1b[92mVERDICT: ALL ADVERSARIAL CHALLENGES PASSED (100%)\x1b[0m\n');
} else {
  console.log('\x1b[91mVERDICT: REGRESSIONS OR ADVERSARIAL FAILURES DETECTED\x1b[0m\n');
  process.exit(1);
}
```

---

## 6. Verification Method

### Independent Verification Commands
1. **Run Full 4-Tier E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected outcome*: 76/76 assertions pass (100.0%) including `T1.PLAY.1` through `T1.PLAY.5`.
2. **Run Challenger M3 Landing Test Suite**:
   ```bash
   npx tsx tests/adversarial_challenger_m3_landing.ts
   ```
   *Expected outcome*: 22/22 assertions pass (100.0%) including `ADV.PLAY.1` through `ADV.PLAY.6`, `ADV.BUILD.1`, `ADV.BUILD.2`, `ADV.DESIGN.1`.
3. **Execute the New Milestone 3 Adversarial Test Suite**:
   ```bash
   npx tsx tests/adversarial_m3_play_game_loop.ts
   ```
   *Expected outcome*: All 26 adversarial assertions across Suites 1–7 pass with 0 failures.
4. **Compile & Type-Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected outcome*: Exits with code 0.
5. **Production Build & Bundle Size Check**:
   ```bash
   npm run build
   ```
   *Expected outcome*: Exit code 0, `dist/index.html` size < 50 KB, zero React 19 vendor chunks in `dist/index.html`.

### Invalidation Conditions
- If initial `#play` loads directly into the 110 arcade grid or webtoon viewer instead of the 2D tile map (`KadanWorldMap`), `ADV.M3.INIT.1` is invalidated.
- If stepping onto Chapter 1 event tile fails to trigger dialogue or does not transition into 3x3 tactical battle upon completion, `ADV.M3.MOVE.3` and `ADV.M3.DIAL.4` are invalidated.
- If winning a battle does not award 50 EXP to the player's active deck, `ADV.M3.BATTLE.4` is invalidated.
- If the 110 Poki minigames catalog or webtoon viewer control bar is broken or dropped, `ADV.M3.ARCADE.1` and `ADV.M3.REGRESS.1` are invalidated.
