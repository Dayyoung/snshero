# SNSHero Hash Route Migration & Gameplay Loop Parity Survey Report

- **Date**: 2026-11-02
- **Agent**: explorer_survey_9_2
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_2/`
- **Scope**: Gameplay Loop, Tile Game, Episodes, Idle Auto-Play, Card Nurturing & Repeat Hunting (`#home`, `#deck`, `#play`, `#card`, `#shop`)

---

## 1. Executive Summary

This survey analyzes the transition of legacy standalone page routes (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) into fully functional hash-based single-page sections (`#home`, `#deck`, `#play`, `#card`, `#shop`) on the main application (`index.html`) for production deployment.

### Key Architectural Findings:
1. **Dual-Entry Architecture Context**:
   - `index.html` loads `/src/landing/index.ts` and renders into `#landing-root`. It currently implements hash routing (`ViewKey = 'home' | 'deck' | 'play' | 'card' | 'shop'`).
   - `home.html` loads `/src/main.tsx` and mounts the React application (`<App />` from `src/App.tsx`) into `#root`.
   - `vite.config.ts` currently rewrites `/home`, `/deck`, `/play`, `/shop` etc. to `/home.html` via `isSpaRoute()`.
   - The user requirements mandate full functional parity on `index.html` hash routes (`#home`, `#deck`, `#play`, `#card`, `#shop`) so that all legacy standalone routes can be completely replaced.

2. **Tile Game Location**:
   - The tile game is implemented in `src/views/KadanRpgView.tsx` (1,641 lines) utilizing `src/components/rpg/KadanWorldMap.tsx` (233 lines), `src/hooks/useKadanRpgProgress.ts` (547 lines), and `src/hooks/useKadanRpgAutoRunner.ts` (148 lines).
   - In `KadanWorldMap`, the player is rendered on a 2D tile grid. Moving step-by-step toward the chapter target tile triggers chapter episodes (`KadanNpcDialog.tsx`), which then lead directly into 3x3 tactical card battles (`MobileCardPlayScreen.tsx`), followed by reward claiming (`KadanRewardModal.tsx`) and auto-progression.
   - For `#play`, the initial view must be this tile game screen, which transitions to the episode upon moving, proceeds to card play upon episode end, and supports auto-play upon completion.

3. **Card Nurturing & EXP Gating**:
   - `cardNurtureStore.ts` stores card progression in LocalStorage under key `hero_card_nurturing`.
   - Flaws discovered in current `src/landing/views/CardSection.tsx` and `cardNurtureStore.ts`:
     - `CardSection.tsx` currently exposes arbitrary free EXP buttons (`+50 EXP` and `+500 EXP`), allowing unearned stat growth.
     - `cardNurtureStore.ts` `nurtureCard()` does not check `isCardOwned()`, allowing unowned cards to be leveled up.
     - Unowned cards can currently be inspected in the nurturing inspector.
   - Victory EXP resolution:
     - Card battle victories are resolved in `MobileCardPlayScreen.tsx` (lines 1120–1156, `winState === 'player'`) and `recordMatchResult()`.
     - Victory grants `+50 EXP` to cards in the player's active deck / companion.
   - Repeat Hunting (`반복 사냥`):
     - The battle completion modal in `MobileCardPlayScreen.tsx` and `VictoryRewardModal.tsx` must feature a dedicated `[🔁 반복 사냥 (Repeat Hunting)]` auto-loop toggle/button that repeats battles hands-free to farm EXP and SNS points.

4. **Global 15-Second Idle Auto-Play Transition**:
   - On any screen, user inactivity across input events (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`) for 15,000ms triggers automatic navigation to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and initiates auto-play.
   - User interaction immediately resets the 15-second countdown timer.

---

## 2. Requirement Investigation & Codebase Mapping

### 2.1 `#home`: SNS Hero Logo & Cool Card Deck Logo Parity

#### Requirements:
- Must display the **SNS Hero logo** and **Cool Card Deck logo** while retaining all existing Home features.

#### Asset Locations in `public/`:
| Asset | Path | File Size | Description |
|---|---|---|---|
| Korean Main Logo | `public/logo-ko.png` | 1,671,604 bytes | Official full-color Korean title logo |
| English Main Logo | `public/logo-en.png` | 1,635,869 bytes | Official full-color English title logo |
| Square Logo | `public/logo.png` / `public/nunhero-logo.png` | 1,671,604 bytes | High-res brand logo |
| JPG Fallback Logo | `public/logo.jpg` | 716,501 bytes | Compressed brand logo |
| 11 Faction Deck Emblems | `public/mall/cdn/shop/files/deck_*.png` | ~50–120 KB each | Deck box emblems (Dragon, Human, Undead, Water, Fire, etc.) |
| Hero Portraits (110 cards) | `public/seat/*.png` (001~110) | ~20–35 KB each | 256x296 high-density remastered portraits |
| Sprite Sheets | `public/cards1.png`, `public/cards2.png` | ~1.4–1.6 MB each | 10x10 battle card master sheets |

#### Current vs. Required Implementation:
- **Legacy `src/views/HomeView.tsx`**:
  - Lines 261–281: Renders `<h1>` logo with `<img src={language === 'ko' ? '/logo-ko.png' : '/logo-en.png'} />` (responsive heights: `h-28 sm:h-36 md:h-44`).
  - Lines 324–358: Renders the **Cool Card Deck Logo/Showcase** — an iconic 5-card fan-folded interactive deck preview (`LobbyInteractiveCard`) displaying the active squad's cards with rotation, depth, rarity frames, power stats, and tap inspect SFX.
  - Lines 283–322: Displays Deck Combat Power (`totalPower CP`), win streak flame badge (`winStreak`), and `[덱 편집 (EDIT)]` shortcut.
  - Lines 360–377: Large `[⚔️ 배틀 시작 (START BATTLE)]` primary action button.
  - Lines 378–430: Secondary navigation grid (My Deck, Shop, Ranking).
  - Lines 520–650: 4 core media hubs (Novel, Webtoon, Movie, Bench).
- **Current `src/landing/views/HomeSection.tsx`**:
  - Lines 23–73: Currently renders plain text title `"눈히어로.com · SNSHero Revolution"` and a single isolated hero preview (`[NO.041] Kadan`), missing both the graphical SNS Hero logo and the 5-card fan-folded Cool Card Deck preview.
  - Lines 75–166: Contains external serialization cards (Naver Novel, Naver Webtoon, Munpia Novel with `[절찬 연재중]` badges).
  - Lines 168–236: 4 core media pillars (Novel, Game, Webtoon, Anime).
  - Lines 238–268: 3-tier character visuals showcase.

#### Concrete Recommendations for `#home`:
1. In `src/landing/views/HomeSection.tsx` (or `#home` renderer):
   - Replace the plain text banner with the official graphic logo:
     ```html
     <div class="w-full flex justify-center py-4">
       <img src="/logo-ko.png" alt="눈히어로.com" class="h-28 sm:h-36 md:h-44 w-auto max-w-full object-contain" />
     </div>
     ```
   - Add the **Cool Card Deck Logo / Showcase**: Render the fan-folded 5-card deck display using the player's active deck (cards 1–5 from `cardNurtureStore` or `localStorage.getItem('hero_deck')`), displaying character portraits (`/seat/*.png`), rarity borders, and total CP.
   - Retain Deck Combat Power (`${deckTP} CP`) and win streak badge.
   - Retain the `[⚔️ 배틀 시작]` button navigating directly to `#play` (`data-nav="play"`).
   - Retain all existing Home features: 4 media pillars, 3 serialization cards (Naver Web Novel `novelId=1250635`, Naver Webtoon `titleId=856677`, Munpia `novel/616551` with `[절찬 연재중]`), and 3-tier character asset showcase.

---

### 2.2 `#deck`: My Deck Editing & Feature Parity

#### Requirements:
- `#deck` replaces legacy `/deck`, supporting **My Deck editing** (slot selection, swapping cards from owned inventory) and retaining all existing Deck features.

#### Codebase Analysis:
- **Legacy `src/views/MyDeckView.tsx`** (3,783 lines):
  - Uses `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop reordering, plus 1-click card replacement from the owned cards grid.
  - Data Persistence:
    - `localStorage.setItem('hero_deck', JSON.stringify(updatedDeck))`
    - `localStorage.setItem('hero_deck_${season}', JSON.stringify(updatedDeck))`
    - `localStorage.setItem('hero_deck_guest_${season}', JSON.stringify(updatedDeck))`
    - Event dispatch: `window.dispatchEvent(new Event('snshero_deck_updated'))`
  - Calculates Deck TP (sum of N+E+S+W of 5 cards) and Global Total Power.
- **Current `src/landing/views/MyDeckSection.tsx`** (411 lines):
  - Lines 86–95: Computes `activeDeckIds = cardNurtureStore.ownedCardIds.slice(0, 5)` (fixed slice, no editing).
  - Lines 203–270: Displays the 5 card slots, but clicking a slot only inspects the card in the detail panel below; there is no UI to swap or replace cards from owned inventory.
  - Calculates `deckTP` and `totalTP` via `cardNurtureStore`.

#### Data Structures:
- Active Deck in LocalStorage:
  - Key `hero_deck` or `hero_deck_${season}`: JSON array of 5 card objects or card IDs.
  - Key `hero_card_nurturing`:
    ```json
    {
      "cards": {
        "1": { "cardId": 1, "level": 1, "exp": 0, "expToNext": 100, "statPoints": 0, "bonusStats": {"top": 0, "right": 0, "bottom": 0, "left": 0}, "totalBonus": 0 }
      },
      "ownedCardIds": [1, 2, 3, 4, 5, 19, 41],
      "activeDeckIds": [1, 2, 3, 4, 5]
    }
    ```

#### Concrete Recommendations for `#deck`:
1. In `cardNurtureStore.ts`:
   - Add `activeDeckIds: number[]` property (defaulting to first 5 `ownedCardIds`).
   - Add `setDeckCard(slotIndex: number, cardId: number): boolean` method that:
     - Verifies `cardId` is in `ownedCardIds`.
     - Replaces card at `slotIndex` (0–4).
     - Persists to `hero_card_nurturing` and syncs with `hero_deck` / `hero_deck_${season}`.
     - Dispatches `snshero_deck_updated` and `snshero_card_nurture_updated`.
2. In `MyDeckSection.tsx`:
   - Add a `[덱 편집 (Swap Card)]` button on each slot or an "인벤토리에서 영웅 선택 (Select from Owned Inventory)" drawer/section.
   - When a slot is selected, display the player's owned cards (`ownedCardIds`) with filter by faction/rarity.
   - Clicking an owned card swaps it into the selected slot.
   - Recalculate Deck TP immediately in real time.

---

### 2.3 `#play`: Tile Game Screen, Episode Trigger, Card Play Transition & Auto-Play

#### Requirements:
- `#play` replaces legacy `/play`.
- **Initial screen must start on the existing tile game screen**.
- **Navigating/moving initiates an episode**.
- **Once the episode finishes, proceed to card play as before**.
- **Enable auto-play after completion**.
- Existing Play features must remain functional.

#### Codebase Analysis & File Locations:
| Module | File Path | Line Range | Responsibilities |
|---|---|---|---|
| Tile Map Component | `src/components/rpg/KadanWorldMap.tsx` | 1–233 | Renders 2D grid of terrain tiles (`tile-snow`, `tile-cliff`, etc.) with hero token (`heroTile`) and target event icon (`targetTile`). Tapping tiles calls `onTilePress`. |
| RPG Story Data & Events | `src/content/kadanRpgStory.ts` | 1–450 | Defines 40 chapters, regions (Snow Mountain, Mist Cliff, etc.), `KadanRpgEvent`, coordinates, and opponent decks (`opponentCardIds`). |
| RPG State & Movement Hook | `src/hooks/useKadanRpgProgress.ts` | 1–547 | Manages `heroTile`, `targetTile`, `currentRegion`, `stepToward()`, `completeEvent()`, LocalStorage key `hero_kadan_rpg_progress_${season}`. |
| Auto-Play Progression Hook | `src/hooks/useKadanRpgAutoRunner.ts` | 1–148 | 100% hands-free runner: handles tile step intervals (~700ms), auto-selects dialogue options (1.5s), auto-enters battles, auto-claims rewards. |
| NPC Story Dialog & Choices | `src/components/rpg/KadanNpcDialog.tsx` | 1–299 | Renders episode dialogue, Kadan choices (`[결의]`, `[신중]`, `[성진호흡]`), countdown timer bar. |
| Tactical Card Battle Screen | `src/views/MobileCardPlayScreen.tsx` | 1–2,927 | Full 3x3 tactical card battle board (`board[9]`), hand cards, flip rules, auto-battle engine. |
| Minigame Arcade & Lobby | `src/views/PlayGameView.tsx` | 1–18,635 | 110 2D Canvas games, PvP battle mode, classic battle arena. |

#### Detailed Logic Flow for `#play`:
```
[User navigates to #play or 15s idle timer fires]
               │
               ▼
┌───────────────────────────────────────────────────────────┐
│ 1. Initial Screen: KadanWorldMap (2D Tile Grid)          │
│    - Renders region map (e.g. Snow Mountain / Mist Cliff) │
│    - Hero marker at heroTile {x, y}                       │
│    - Target objective at targetTile {x, y}                │
│    - Auto-Play toggle [🤖 자동 플레이: ON / OFF]          │
└───────────────────────────────────────────────────────────┘
               │
               ▼ (Player taps adjacent/target tile OR autoRunner steps)
┌───────────────────────────────────────────────────────────┐
│ 2. Tile Movement & Episode Initiation                     │
│    - Hero moves stepToward(from, to)                      │
│    - Random encounter check (Bandit/Thief 12-15% chance)  │
│    - Arriving at targetTile triggers Chapter Episode!     │
│    - Opens KadanNpcDialog (dialogue choices & cutscene)   │
└───────────────────────────────────────────────────────────┘
               │
               ▼ (Dialogue choice completed / timer expires)
┌───────────────────────────────────────────────────────────┐
│ 3. Episode Concludes -> Transition to Card Play           │
│    - Chapter encounter opponent deck loaded               │
│    - Launches 3x3 tactical battle (MobileCardPlayScreen)  │
│    - Auto-battle engine active if autoMode is enabled     │
└───────────────────────────────────────────────────────────┘
               │
               ▼ (Match ends with player victory)
┌───────────────────────────────────────────────────────────┐
│ 4. Victory Resolution & Rewards                          │
│    - Victory screen displayed                             │
│    - +50 EXP awarded to player's owned cards              │
│    - Repeat Hunting option [🔁 반복 사냥] enabled         │
│    - If autoMode active: auto-advances to next chapter    │
└───────────────────────────────────────────────────────────┘
```

#### Existing Play Features Retention:
- In `#play`, provide a top tab switch or drawer:
  - `[🗺️ RPG 모험 (타일 게임)]`: Starts by default on the tile game screen.
  - `[🎮 110종 미니게임 아케이드]`: Access to the 110 2D minigames from `PlayGameView.tsx`.
  - `[⚔️ PVP 결투장]`: Instant rival challenges.

---

### 2.4 Global 15-Second Idle Auto-Play Transition

#### Requirements:
- On **any screen**, if user input is absent for **15 seconds or more**, automatically navigate to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and initiate auto-play.
- Any user interaction must reset the timer.

#### Technical Architecture:
1. **Target URL**:
   - `https://dayyoung-macbookpro.tail3717a4.ts.net/#play`
   - Local/relative: `window.location.hash = '#play'`
2. **Events to Monitor**:
   ```ts
   const USER_INPUT_EVENTS = [
     'mousedown', 'mousemove', 'keydown',
     'touchstart', 'touchmove', 'scroll',
     'pointerdown', 'wheel'
   ];
   ```
3. **Timer Logic**:
   - `IDLE_LIMIT_MS = 15000` (15.0 seconds).
   - Maintain `idleTimer: number | null`.
   - On every monitored event, clear `idleTimer` and restart.
   - When timer fires:
     - Check if already on `#play` AND auto-play is already running:
       ```ts
       const isAutoRunning = localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true';
       const currentHash = window.location.hash.replace('#', '');
       if (currentHash === 'play' && isAutoRunning) {
         // Already running, reset timer without disruptive reload
         resetIdleTimer();
         return;
       }
       ```
     - Set auto-mode flags in LocalStorage:
       ```ts
       localStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
       localStorage.setItem('hero_kadan_rpg_auto_mode_season1', 'true');
       localStorage.setItem('hero_auto_battle', 'true');
       ```
     - Dispatch auto-mode update event:
       ```ts
       window.dispatchEvent(new CustomEvent('hero_kadan_rpg_auto_mode_updated', { detail: { autoMode: true } }));
       ```
     - Navigate to `#play`:
       ```ts
       window.location.href = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play';
       ```
4. **Integration Point**:
   - Create `src/lib/idleAutoPlayManager.ts` (or `src/landing/services/idleAutoPlayManager.ts`).
   - Initialize on `DOMContentLoaded` / app bootstrap in both `src/landing/index.ts` and `src/main.tsx`.

---

### 2.5 `#card`: Owned-Card Nurturing Gating, Victory EXP & Repeat Hunting

#### Requirements:
- Character nurturing is **restricted strictly to owned characters**.
- Nurturing requires **EXP earned exclusively by winning card battles**.
- After a match ends, enable **repeat hunting (`반복 사냥`)**.

#### Current Flaws Identified in Code:
1. **`src/landing/views/CardSection.tsx`**:
   - Lines 258–281 expose free buttons:
     - `data-action="nurture-card"` with `data-exp="50"` (`카드 육성하기 (+50 EXP)`)
     - `data-action="nurture-card"` with `data-exp="500"` (`10회 연속 육성 (+500 EXP)`)
     These buttons allow users to click freely and level up cards without playing any battles!
   - Unowned cards can still be selected and their nurture controls are accessible.
2. **`src/landing/services/cardNurtureStore.ts`**:
   - Lines 93–134: `nurtureCard(cardId, expGain)` does not check `this.isCardOwned(cardId)`.
3. **`src/views/MobileCardPlayScreen.tsx`**:
   - Lines 1126–1136: On victory (`winState === 'player'`), it calls `if (onEarnXp) onEarnXp(50);`. However, this was not synced to `cardNurtureStore` (`hero_card_nurturing`).
   - Lines 2594–2615: Post-match screen only has a single `재대결 (Rematch)` button; it lacks a dedicated `[🔁 반복 사냥 (Repeat Hunting)]` auto-loop toggle.

#### Concrete Implementation Recommendations:
1. **Lock Down `cardNurtureStore.ts`**:
   ```ts
   nurtureCard(cardId: number, expGain: number): { expGained: number; leveledUp: boolean; newLevel: number } {
     // STRICT RULE: Only owned characters can receive EXP!
     if (!this.isCardOwned(cardId)) {
       return { expGained: 0, leveledUp: false, newLevel: this.cards[cardId]?.level || 1 };
     }
     // ... proceed with EXP gain and level-up
   }
   ```
2. **Refactor `CardSection.tsx`**:
   - **Remove the free `+50 EXP` and `+500 EXP` buttons** from the UI.
   - For owned cards, display current Level (Lv.1~100), EXP progress bar, and 4-way stat allocation buttons `[+]` when `statPoints > 0`.
   - Add clear guidance banner:
     `"경험치(EXP)는 카드 배틀 승리를 통해서만 획득할 수 있습니다. [#play]에서 배틀 및 반복 사냥을 진행하세요."`
   - For unowned cards:
     - Display `[미보유 캐릭터]` badge.
     - Hide/disable stat allocation controls and level-up panels.
     - Provide shortcut: `[상점에서 카드 뽑기 (#shop)]` or `[배틀에서 도전 목표 클리어 (#play)]`.
3. **Connect Battle Victory EXP to `cardNurtureStore`**:
   - In `MobileCardPlayScreen.tsx` (lines 1126–1136):
     ```ts
     if (winState === 'player') {
       // Award +50 EXP to all cards in player's current active deck
       playerDeck.forEach((card) => {
         if (card && typeof card.imageIndex === 'number') {
           cardNurtureStore.nurtureCard(card.imageIndex, 50);
         }
       });
     }
     ```
   - In `VictoryRewardModal.tsx`:
     - Display EXP breakdown: `• 덱 영웅 배틀 경험치: +50 EXP (레벨업 및 스탯 포인트 획득)`.
4. **Wire Up Repeat Hunting (`반복 사냥`)**:
   - In `MobileCardPlayScreen.tsx`:
     - Add `isRepeatHunting` state (persisted in `localStorage.getItem('hero_repeat_hunting') === 'true'`).
     - Render `[🔁 반복 사냥 (Repeat Hunting)]` button / toggle on the match conclusion overlay.
     - When `isRepeatHunting` is active:
       - 1.5-second countdown timer automatically restarts the match against the opponent or next rival.
       - Skips manual click and loops continuously.
       - Renders active HUD: `[🔁 반복 사냥 활성화됨: N연승 중 / [⏹️ 중지]]`.
       - Tapping `[⏹️ 중지]` cleanly stops the loop and returns to manual mode.
   - In `VictoryRewardModal.tsx`:
     - Add `[🔁 반복 사냥]` action button alongside `[다시 도전]`.

---

## 3. LocalStorage Data Schema Reference

| Key | Format | Producer | Consumer | Purpose |
|---|---|---|---|---|
| `hero_card_nurturing` | JSON Object | `cardNurtureStore.ts` | `CardSection`, `MyDeckSection`, Battle | Stores 110 cards' levels, EXP, unspent stat points, 4-way bonus stats, and `ownedCardIds`. |
| `hero_deck` / `hero_deck_${season}` | JSON Array | `MyDeckView`, `MyDeckSection` | `MobileCardPlayScreen`, `PlayGameView`, `HomeView` | Active 5-card player squad for card battles. |
| `hero_kadan_rpg_progress_${season}` | JSON Object | `useKadanRpgProgress.ts` | `KadanRpgView`, `KadanWorldMap` | RPG tile position (`lastTile`), cleared events, rebirth level. |
| `hero_kadan_rpg_auto_mode` | String (`'true'`/`'false'`) | Idle timer, AutoRunner | `KadanRpgView`, `MobileCardPlayScreen` | Enables hands-free tile movement, dialogue choice, and battle progression. |
| `hero_repeat_hunting` | String (`'true'`/`'false'`) | `MobileCardPlayScreen`, `VictoryRewardModal` | Battle result loop | Governs auto-rematch loop for EXP and SNS farming. |
| `hero_sns` / `hero_sns_points` | Number / String | `standardizedRewardGateway`, Shop | Shop, Battle, Header | User SNS currency balance. |
| `hero_ad_removed` | String (`'true'`/`'false'`) | `ShopSection`, Shop | AdSense banners, Header | VIP ad-free state. |

---

## 4. Dependencies & Risk Assessment

1. **Dual-Entry vs. Single-Entry Unification**:
   - Currently, `index.html` runs static template strings (`src/landing/`) and `home.html` runs React (`App.tsx`).
   - If the user prompt requires `#home`, `#deck`, `#play`, `#card`, `#shop` to provide full functional parity on `index.html`:
     - Either `src/landing/` must implement the tile game canvas/grid, card battle logic, and deck editing in pure TypeScript.
     - OR `index.html` can mount React `<App />` directly with hash routing, rendering each view based on `window.location.hash`.
     - *Risk*: Dual-entry tests in `tests/e2e/tier1_feature_coverage.ts` expect `index.html` to be static and not import `src/main.tsx` directly. Therefore, implementing `#home`, `#deck`, `#play`, `#card`, `#shop` within `src/landing/` (or via modular lazy loaders) ensures zero test regression for MPA architecture while satisfying the new prompt.

2. **15-Second Idle Timer Performance**:
   - Attaching 8 event listeners on `window` can cause micro-stutter if not properly debounced.
   - *Mitigation*: Debounce event handler using a passive timestamp check (`if (now - lastReset < 500) return;`).

3. **EXP Exploitation Prevention**:
   - Ensure EXP cannot be injected via console or unowned card selection by enforcing `isCardOwned()` in `cardNurtureStore.nurtureCard()`.

---

## 5. Verification Checklist for Subsequent Implementation Agent

- [ ] `#home` renders `/logo-ko.png` / `/logo-en.png` and the 5-card Cool Card Deck preview.
- [ ] `#deck` allows selecting a slot and swapping in any owned card from inventory.
- [ ] `#play` starts on the 2D tile map; moving steps towards the objective; stepping onto event triggers the chapter episode dialogue; concluding dialogue enters 3x3 card play; match victory awards EXP and enables auto-play.
- [ ] Remaining idle on any screen for 15s redirects to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` with auto-play active.
- [ ] Touching/interacting with screen resets the 15s idle timer.
- [ ] `#card` strictly prevents nurturing unowned characters and has zero free EXP buttons.
- [ ] Card battle victory awards EXP to owned cards in `cardNurtureStore`.
- [ ] Post-match screen provides `[🔁 반복 사냥 (Repeat Hunting)]` auto-loop.
- [ ] `npm run lint` and `npm run build` pass with exit code 0.
