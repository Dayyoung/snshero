# Handoff Report: Milestone 3 (#play Tile Game & Battle Loop Architecture)

- **Agent**: `explorer_m3_9_1` (Explorer 1)
- **Target Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_9_1/`
- **Milestone**: Milestone 3 (`#play` Tile Game & Battle Loop)
- **Date**: 2026-11-02T10:25:00Z

---

## 1. Observation

### 1.1 Existing Architecture of `#play` and `src/landing/views/PlaySection.tsx`
- **File**: `/Users/dayyoung/project/snshero/src/landing/views/PlaySection.tsx` (Lines 1–506)
- **Runtime Model**: Pure TypeScript template string generator (`renderPlaySection(): string`) with Zero React runtime dependencies.
- **State Definition**:
  ```ts
  export interface PlayViewerState {
    currentEpisode: number;      // 1..40
    currentScene: number;        // 0..(totalScenes - 1)
    isTtsActive: boolean;        // STRICT CONTRACT: default false!
    isNarrationVisible: boolean; // default true
    speechRate: number;
  }
  export const playState: PlayViewerState = {
    currentEpisode: 1,
    currentScene: 0,
    isTtsActive: false, // Default disabled (OFF) on load
    isNarrationVisible: true,
    speechRate: 1.0,
  };
  ```
- **Control Bar Requirement**:
  Lines 267–335 contain exactly 5 buttons: `['닫기', '이전', '다음', '나레이션', 'TTS']`.
  This is strictly enforced by test `T1.PLAY.5` in `tests/e2e/tier1_feature_coverage.ts`:
  ```ts
  const hasControls = ['닫기', '이전', '다음', '나레이션', 'TTS'].every(btn => playSection.includes(btn));
  ```
  and by `ADV.PLAY.5` in `tests/adversarial_challenger_m3_landing.ts`.
- **Current Limitation**: `PlaySection.tsx` only renders the 40-episode webtoon scene viewer. It does NOT yet mount the 2D tile adventure map (`KadanWorldMap`), player movement controls, or battle transition loop.

### 1.2 The 2D Tile Adventure Map (`KadanWorldMap.tsx`)
- **File**: `/Users/dayyoung/project/snshero/src/components/rpg/KadanWorldMap.tsx` (Lines 1–233)
- **Grid Structure**:
  - 10x8 tile grid (`region.width * region.height = 80 tiles`) inside container:
    ```tsx
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${region.width}, minmax(0, 1fr))` }}>
    ```
  - Map tiles have terrain textures (`terrainAsset[region.terrain]` from `public/rpg/kadan-map/tile-*.png`: `tile-snow.png`, `tile-cliff.png`, `tile-cave.png`, `tile-forest.png`, `tile-palace.png`).
  - Blocked tiles (`region.blockedTiles`) are styled with opacity-40 and grayscale.
  - Target tile indicator uses `ring-2 ring-amber-400`.
  - Event pins:
    - Enemy: `public/rpg/kadan-map/object-enemy.png`
    - Chest: `public/rpg/kadan-map/object-chest.png`
    - Portal / Story: `public/rpg/kadan-map/object-portal.png`
    - Completed events: `opacity-45 grayscale`
  - Hero Avatar:
    - Positioned at `heroTile`: circle with `public/rpg/kadan-map/hero-kadan.png`.
  - Coordinate badge:
    ```tsx
    <div className="flex items-center gap-1 rounded-none bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
      <MapPin size={16} />
      {heroTile.x + 1}, {heroTile.y + 1}
    </div>
    ```

### 1.3 Tile Coordinate Encounter System & `KadanNpcDialog.tsx`
- **File**: `/Users/dayyoung/project/snshero/src/views/KadanRpgView.tsx` (Lines 372–528)
- **Movement Loop**:
  ```ts
  const stepToward = (from: KadanRpgTile, to: KadanRpgTile): KadanRpgTile => {
    if (from.x !== to.x) return { x: from.x + Math.sign(to.x - from.x), y: from.y };
    if (from.y !== to.y) return { x: from.x, y: from.y + Math.sign(to.y - from.y) };
    return from;
  };
  ```
  - Step interval: 180ms (or 110ms in low-spec mode).
  - Target arrival check:
    ```ts
    if (sameTile(heroTile, targetTile)) {
      openEvent(arrivedEvent);
    }
    ```
- **Dialogue System**:
  - File: `/Users/dayyoung/project/snshero/src/components/rpg/KadanNpcDialog.tsx` (Lines 1–600)
  - Novel scripts: `KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber]` in `src/content/kadanRpgNovelScript.ts`.
  - 7-Head Character Cutouts:
    - Using `/anime-character-sheets/cutouts/{pad3}_{nameEn}.png` via `getCutoutUrl(cardId)` from `src/landing/services/assetCatalog.ts`.
    - Rendered on the speaking stage alongside highlighted dialog text.
  - Protagonist Choices:
    - 2–3 options with bonus metadata (`bonusType: 'sns' | 'buff'`).
    - Visible countdown timer (5.0s manual, 1.5s–3.0s auto).
  - Battle Transition:
    - Upon finishing dialogue, if node is enemy or `canStartBattle`, sets `battleEvent` which mounts 3x3 tactical card battle (`MobileCardPlayScreen.tsx`).
    - Victory awards 50 EXP to active deck cards (`cardNurtureStore.awardBattleVictoryExp(50)`).
    - Repeat hunting (`반복 사냥`) is enabled on completion.

### 1.4 Strict Build & Architecture Invariants
- **File**: `/Users/dayyoung/project/snshero/tests/adversarial_challenger_m3_landing.ts` (Lines 503–509):
  ```ts
  assertTest(
    'ADV.BUILD.2',
    'Zero React Runtime',
    'dist/index.html does not load React 19 SPA vendor bundles',
    !content.includes('vendor-react') && !content.includes('react-dom'),
    `Clean standalone static bundle confirmed`
  );
  ```
- **Build size**: `dist/index.html` must remain `< 50 KB` (currently 43.92 KB).
- **Test Suite Results**:
  - `npx tsx tests/e2e/run_all.ts` passes 76/76 (100%).
  - `npx tsx tests/adversarial_challenger_m3_landing.ts` passes 22/22 (100%).

---

## 2. Logic Chain

1. **Approved Task Prompt & PROJECT.md Requirements**:
   - Approved Task Prompt states: "`#play` replaces the legacy `/play` screen. The initial screen must start on the existing tile game screen. Navigating/moving initiates an episode. Once the episode finishes, proceed to card play as before, and enable auto-play after completion. Existing Play features must remain functional."
   - PROJECT.md M3 defines 5 features:
     - Feature 8: `#play` Tile Game Initial Screen (`KadanWorldMap` 2D grid)
     - Feature 9: `#play` Movement Episode Trigger (`KadanNpcDialog`)
     - Feature 10: `#play` Card Battle Transition (`MobileCardPlayScreen`)
     - Feature 11: `#play` Auto-Play Upon Completion (`useKadanRpgAutoRunner`)
     - Feature 12: `#play` Existing Play Features Retention (110 Minigames & Webtoon viewer)

2. **Constraint Reconciliation (Zero React in index.html vs Gameplay Features)**:
   - Observation 1.4 proves that `dist/index.html` has an invariant check (`ADV.BUILD.2`) asserting zero direct inclusion of `vendor-react` / `react-dom`.
   - Observation 1.1 shows that `PlaySection.tsx`, `HomeSection.tsx`, `MyDeckSection.tsx`, `CardSection.tsx`, and `ShopSection.tsx` are designed as pure TypeScript template string generators.
   - Therefore, the implementer must NOT convert `PlaySection.tsx` into a direct React 19 bundle in `dist/index.html`, as that would violate `ADV.BUILD.2` and exceed the `< 50 KB` bundle size limit.
   - Instead, the implementer should implement the tile adventure map UI, navigation controls, dialogue cutscene modal, and battle stage directly as high-performance terminal-flat template views and lightweight state controllers within `PlaySection.tsx` (and companion pure-TS helper `src/landing/services/playRpgEngine.ts`), while preserving the existing React components (`KadanWorldMap.tsx`, `KadanNpcDialog.tsx`, `MobileCardPlayScreen.tsx`, `useKadanRpgAutoRunner.ts`) in `src/` for unit/integration/legacy tests.

3. **User Experience & Navigation Hierarchy**:
   - When entering `#play`, the initial active sub-view must be the **2D Tile Adventure Map** (`#kadan-tile-adventure-board`).
   - The screen must provide an intuitive mode/tab switcher:
     - **Tab 1 (Default Initial View)**: `[🗺️ 2D 모험 타일 맵 (Tile Adventure)]`
     - **Tab 2**: `[🎬 40부작 공식 웹툰 & 비주얼 극장]` (Houses the exact 5 buttons `['닫기', '이전', '다음', '나레이션', 'TTS']` and 40-ep carousel to satisfy `T1.PLAY.5` and `ADV.PLAY.1~6`)
     - **Tab 3**: `[🎮 110종 미니게임 아케이드 & 결투장]` (Satisfies Feature 12 minigames retention)
   - Movement on the tile map:
     - Direct tap/click on any grid tile.
     - 4-way mobile on-screen D-Pad (▲, ▼, ◀, ▶) with `min-h-[44px]` touch targets.
     - Keyboard arrow keys (Up, Down, Left, Right) and W/A/S/D intercepted in `src/landing/index.ts`.
   - Reaching an event tile triggers the episode dialogue overlay (`KadanNpcDialog` style):
     - Displays chapter title, 7-head character cutout portrait, story prose with highlighted quotes, and protagonist choice with countdown auto-select timer.
   - Concluding dialogue transitions into the 3x3 tactical card battle stage:
     - Awards 50 EXP to active deck upon victory (`cardNurtureStore.awardBattleVictoryExp(50)`).
     - Provides repeat hunting (`반복 사냥`) option.
     - Auto-play (`autoMode`) continuously advances to the next chapter.

---

## 3. Caveats

1. **Zero Prohibited CSS Classes**:
   - `DESIGN.md` strictly forbids `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` on containers, and `animate-bounce` / `animate-ping`. All tile containers, badges, and modals must use `rounded-none` (0px) or `rounded-sm` (4px).
2. **Audio / TTS Invariant**:
   - `playState.isTtsActive` must strictly remain `false` by default on view load, and scene/tile navigation must never auto-enable speech synthesis unless the user explicitly toggles it ON.
3. **5-Button Exact Match in PlaySection.tsx**:
   - The strings `'닫기'`, `'이전'`, `'다음'`, `'나레이션'`, `'TTS'` must be present in the media control bar markup inside `PlaySection.tsx` to satisfy `T1.PLAY.5` and `ADV.PLAY.5`.

---

## 4. Conclusion & Drop-In Architecture Recommendation

### 4.1 Recommended File Structure & Changes
1. **`src/landing/views/PlaySection.tsx`**:
   - Retain existing `playState`, `handlePlayAction`, and webtoon scene viewer methods.
   - Add state for RPG tile exploration:
     ```ts
     export interface PlayRpgState {
       activeTab: 'rpg' | 'webtoon' | 'arcade';
       currentRegionId: string;
       heroTile: { x: number; y: number };
       targetTile: { x: number; y: number } | null;
       currentChapter: number;
       activeDialogueEvent: any | null;
       dialogueLineIdx: number;
       inBattle: boolean;
       autoMode: boolean;
       repeatHunting: boolean;
     }
     ```
   - In `renderPlaySection()`:
     - Default `activeTab` to `'rpg'`.
     - Render Tab Switcher: `[🗺️ 2D 모험 타일 맵]` | `[🎬 40부작 웹툰 & 극장]` | `[🎮 110종 미니게임]`
     - Under `'rpg'` tab:
       - Render the 10x8 tile adventure grid:
         - Terrain tiles from `/rpg/kadan-map/tile-${terrain}.png`
         - Hero avatar marker with `/rpg/kadan-map/hero-kadan.png`
         - Event node pins (boss, enemy, chest, portal)
         - Minimap coordinates `[📍 (X, Y)]` and region title badge
       - Render 4-direction mobile on-screen D-Pad:
         - Buttons `[▲]`, `[▼]`, `[◀]`, `[▶]` with `min-h-[44px] min-w-[44px]`
       - Render Auto-Play toggle `[🤖 자동 진행 (AUTO ON/OFF)]`
     - When `activeDialogueEvent` is set:
       - Render terminal-flat dialogue overlay with 7-head cutout (`/anime-character-sheets/cutouts/...`), formatted story quotes, protagonist choices, and countdown timer.
     - When `inBattle` is set:
       - Render 3x3 card battle arena with player's 5 cards vs opponent cards, victory EXP award button, and repeat hunting loop toggle.
     - Under `'webtoon'` tab:
       - Render the exact 5-button control bar (`닫기`, `이전`, `다음`, `나레이션`, `TTS`) and scene stage.

2. **`src/landing/index.ts`**:
   - In `handleEventDelegation()`:
     - Handle actions: `play-tab-rpg`, `play-tab-webtoon`, `play-tab-arcade`, `play-move-tile`, `play-move-up`, `play-move-down`, `play-move-left`, `play-move-right`, `play-toggle-auto`, `play-dialogue-advance`, `play-dialogue-choice`, `play-dialogue-skip`, `play-battle-start`, `play-battle-win`, `play-repeat-hunting`.
   - In `handleGlobalKeydown()`:
     - When `state.activeView === 'play'`, intercept Arrow keys and W/A/S/D to step the hero across tiles.

3. **`src/landing/services/cardNurtureStore.ts`**:
   - Ensure `awardBattleVictoryExp(50)` is invoked upon RPG battle victory, syncing EXP directly to active deck cards and persisting in `hero_card_nurturing`.

---

## 5. Verification Method

To independently verify the implementation, execute the following commands in the workspace:

1. **Verify Full E2E Test Suite (Milestone 3 & All Milestones)**:
   ```bash
   npx tsx tests/e2e/run_all.ts --milestone M3
   npx tsx tests/e2e/run_all.ts --milestone ALL
   ```
   *Expected*: All assertions exit code 0, 100% pass rate.

2. **Verify Adversarial M3 Harness**:
   ```bash
   npx tsx tests/adversarial_challenger_m3_landing.ts
   ```
   *Expected*: All 22 stress assertions pass with VERDICT: APPROVE.

3. **Verify Production Build & Zero React Runtime in Landing Bundle**:
   ```bash
   npm run build
   ```
   Check that `dist/index.html` size is `< 50 KB` and contains zero `vendor-react` references.

4. **Invalidation Conditions**:
   - If `renderPlaySection()` fails to include `['닫기', '이전', '다음', '나레이션', 'TTS']`, `T1.PLAY.5` and `ADV.PLAY.5` fail.
   - If `playState.isTtsActive` defaults to `true`, `ADV.PLAY.1` fails.
   - If React 19 is directly imported into `PlaySection.tsx` causing `dist/index.html` to bundle `vendor-react`, `ADV.BUILD.2` fails.
   - If touch buttons are less than 44px height/width, mobile ergonomics audits fail.
