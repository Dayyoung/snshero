# Handoff Report: Milestone 3 (#play Tile Game & Battle Loop) Investigation
**Agent**: Explorer 2 (`explorer_m3_9_2`)  
**Mission**: Investigate the episode dialogue completion transition to 3x3 tactical card battle (`MobileCardPlayScreen`), automated progression loop (`useKadanRpgAutoRunner`), 15s global idle auto-play integration (`idleAutoPlayManager.ts`), and architectural recommendations for `#play`.  
**Date**: 2026-11-02  

---

## 1. Observation

### Obs 1. Episode Dialogue to 3x3 Card Battle Transition
1. **Dialogue Completion & Primary Button**:
   - Location: `src/components/rpg/KadanNpcDialog.tsx:651-665`
   - When the final cutscene line is reached (`isFinalLine` is `true`), if `canStartBattle` is `true`, `primaryLabel` displays `t('kadan_rpg_start_battle', language)` (`[전투 시작]` in Korean, `[Start Battle]` in English):
     ```tsx
     const primaryLabel = hasActiveChoices
       ? language === 'ko' ? '선택 완료 ▶' : 'Confirm ▶'
       : isFinalLine
       ? canStartBattle
         ? t('kadan_rpg_start_battle', language)
         : canClaimReward
         ? t('kadan_rpg_claim_reward', language)
         : event.isEnding
         ? t('kadan_rpg_finish_ending', language)
         : t('kadan_rpg_continue', language)
       : language === 'ko' ? '다음 ▶' : 'Next ▶';
     ```
   - Primary action button click handler (`src/components/rpg/KadanNpcDialog.tsx:1146-1160`):
     ```tsx
     <button
       type="button"
       onClick={advanceConversation}
       className={cn(
         'min-h-[44px] shrink-0 rounded-sm px-4 sm:px-6 py-2 text-xs sm:text-sm font-mono font-black text-white shadow-none transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
         hasActiveChoices
           ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
           : isFinalLine && canStartBattle
           ? 'bg-rose-600 hover:bg-rose-500 text-white'
           : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
       )}
     >
       <span>{primaryLabel}</span>
     </button>
     ```
2. **`advanceConversation` & `finishConversation` Call Chain**:
   - Location: `src/components/rpg/KadanNpcDialog.tsx:410-421, 532-551`
   - When `lineIndex >= conversationLines.length - 1`, `advanceConversation` calls `finishConversation()`.
   - `finishConversation()` stops narration and checks `canStartBattle`:
     ```ts
     const finishConversation = useCallback(() => {
       movieAudio.stopNarration();
       if (canStartBattle) {
         onStartBattle();
         return;
       }
       if (canClaimReward) {
         onClaimReward();
         return;
       }
       onComplete();
     }, [canClaimReward, canStartBattle, onClaimReward, onComplete, onStartBattle]);
     ```
3. **Battle Event Activation in `KadanRpgView`**:
   - Location: `src/views/KadanRpgView.tsx:1148`
   - `KadanNpcDialog` receives `onStartBattle={() => setBattleEvent(activeEvent)}`.
   - When `battleEvent` is set to `activeEvent`, the portal block at `src/views/KadanRpgView.tsx:1157-1191` evaluates to true:
     ```tsx
     {activeEncounter && battleEvent && rpgOpponent && createPortal(
       <div className="fixed inset-0 z-[99999] w-full h-[100dvh] max-h-[100dvh] bg-[#060a14] flex flex-col items-center justify-center overflow-hidden pointer-events-auto select-none touch-none">
         <MobileCardPlayScreen
           isAdRemoved={isAdRemoved}
           playerDeck={getBuffedPlayerDeck(currentDeck)}
           opponentCustomDeck={rpgOpponent.deck}
           opponentName={rpgOpponent.name}
           language={language}
           initialAutoBattle={true}
           autoCloseOnComplete={progress.autoMode || isDemoPlayActive() || isRankingDiverted()}
           onToggleAutoBattle={() => setAutoMode(!progress.autoMode)}
           onBack={(completed) => {
             setBattleEvent(null);
             if (!completed && progress.autoMode) {
               setAutoMode(false);
             }
           }}
           recordMatchResult={(result) => {
             handleBattleComplete(result);
           }}
           ...
         />
       </div>,
       document.body
     )}
     ```
4. **Battle Conclusion & Auto-Exit**:
   - Location: `src/views/MobileCardPlayScreen.tsx:1410-1429`
   - When `gameOver` and `winner` are established:
     ```ts
     useEffect(() => {
       if (!gameOver || !winner) return;
       if (autoCloseOnComplete) {
         const timer = setTimeout(() => {
           handleExitGame();
         }, 1600);
         return () => clearTimeout(timer);
       }
     }, [gameOver, winner, autoCloseOnComplete, handleExitGame]);
     ```
   - In `handleExitGame()`:
     ```ts
     if (recordMatchResult && !matchResultReported && winner) {
       setMatchResultReported(true);
       recordMatchResult(
         winner === 'player' ? 'win' : winner === 'ai' ? 'loss' : 'draw',
         ...
       );
     }
     onBack(isMatchCompleted);
     ```
5. **Reward & Chapter Transition in `KadanRpgView`**:
   - Location: `src/views/KadanRpgView.tsx:605-637, 530-569`
   - `handleBattleComplete(result)`:
     - On victory, draw, or in auto-mode (`result === 'win' || result === 'draw' || isAutoStory`):
       - Clears temporary deadlock/loss counters: `localStorage.removeItem('hero_kadan_active_buff')`, etc.
       - Marks encounter cleared: `markEncounterCleared(encounter.id)`
       - Closes battle: `setBattleEvent(null)`
       - Invokes `openEpisodeEndMediaPrompt(battleEvent)`
   - `openEpisodeEndMediaPrompt(event)`:
     - Awards SNS, cards, and items via `updateSns`, `addCard`, `addItem`.
     - Marks reward claimed: `markRewardClaimed(reward.id)`.
     - Sets `mediaPromptEvent(event)`.
   - `EpisodeMediaWatchModal` (`src/components/rpg/EpisodeMediaWatchModal.tsx:86-146`):
     - Displays chapter rewards and 3.0s countdown bar (`TOTAL_COUNTDOWN_MS = 3000`).
     - At 0s, automatically invokes `safeProceedNext()` -> `onProceedNext={() => completeActiveEvent(mediaPromptEvent)}`.
   - `completeActiveEvent` (`src/views/KadanRpgView.tsx:589-598`):
     - Marks chapter completed: `markChapterCompleted(event.id)`.
     - Sets `mediaPromptEvent(null)`.
     - Clears modals, leaving the hero ready to navigate to the next chapter.

---

### Obs 2. Automated Progression Loop (`useKadanRpgAutoRunner.ts`)
1. **Hook Signature & State Machine Steps**:
   - Location: `src/hooks/useKadanRpgAutoRunner.ts:3-29`
   - State types:
     ```ts
     export type KadanRpgAutoStep =
       | 'idle'
       | 'routeToTarget'
       | 'interact'
       | 'dialog'
       | 'battle'
       | 'reward'
       | 'unlockNext'
       | 'paused'
       | 'complete';
     ```
2. **Step Priority & Timer Execution**:
   - Location: `src/hooks/useKadanRpgAutoRunner.ts:68-115`
   - When `enabled === true` (from `progress.autoMode`), not `isComplete`, not `isBusy`, and not `paused`:
     - Timer runs at 1300ms if previous step was `'dialog'`, otherwise 650ms.
     - Priority evaluation order:
       1. `if (hasReward) -> onClaimReward()` (step: `'reward'`)
       2. `if (hasBattle) -> onStartBattle()` (step: `'battle'`)
       3. `if (hasDialog) -> onAdvanceDialog()` (step: `'dialog'`)
       4. `if (hasTarget && isAtTarget) -> onInteractTarget()` (step: `'interact'`)
       5. `if (hasTarget) -> onMoveToTarget()` (step: `'routeToTarget'`)
       6. `else -> onContinue()` (step: `'unlockNext'`)
3. **`isBusy` Coordination with Sub-Components**:
   - Location: `src/views/KadanRpgView.tsx:814-848`
     ```ts
     isBusy: isQuickRetrying || isDeadlockExitingRef.current || isMoving || Boolean(battleEvent) || Boolean(mediaPromptEvent) || Boolean(activeEvent && !battleEvent && !rewardEvent) || Boolean(ambushAlert) || Boolean(ambushBattle)
     ```
   - Notice: When `activeEvent` is open (i.e. `KadanNpcDialog` is active), `isBusy` is `true`. `useKadanRpgAutoRunner` yields control to `KadanNpcDialog`'s internal auto-advance loop (`src/components/rpg/KadanNpcDialog.tsx:594-649`):
     - Choice countdown auto-selects default option in 3.0s (or 1.5s).
     - Dialogue cuts auto-advance every 1.2s~2.6s (or TTS completion).
     - On the last cut, `finishConversation()` triggers `onStartBattle()`.
   - When battle is open (`battleEvent`), `isBusy` is `true`. `MobileCardPlayScreen` auto-battles cards (`initialAutoBattle={true}`) and auto-closes in 1.6s (`autoCloseOnComplete={true}`).
   - When `mediaPromptEvent` is open, `isBusy` is `true`. `EpisodeMediaWatchModal` counts down 3.0s and auto-proceeds.
   - Once all sub-modals finish, `isBusy` becomes `false`, `hasTarget: Boolean(nextEvent)` becomes true for the next chapter, and `useKadanRpgAutoRunner` routes the hero to the next chapter.

---

### Obs 3. 15-Second Global Idle Auto-Play Redirect Engine (`idleAutoPlayManager.ts`)
1. **Input Monitoring & Inactivity Timer**:
   - Location: `src/landing/services/idleAutoPlayManager.ts:43-60, 100-123`
   - Monitors 8 interaction events: `'mousemove'`, `'mousedown'`, `'keydown'`, `'touchstart'`, `'touchmove'`, `'scroll'`, `'pointerdown'`, `'wheel'`.
   - Event listeners attached with `{ capture: true, passive: true }`.
   - High-frequency events throttled to `throttleMs = 250` ms.
   - Inactivity threshold: `timeoutMs = 15000` (15.0 seconds).
   - Any user interaction resets `lastActivityTime = Date.now()` and reschedules the 15,000ms timer.
2. **Commit Storage & Custom Events**:
   - Location: `src/landing/services/idleAutoPlayManager.ts:231-257`
   - On 15s timer expiration:
     ```ts
     localStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
     localStorage.setItem('hero_kadan_rpg_auto_mode_season1', 'true');
     localStorage.setItem('hero_auto_battle', 'true');
     localStorage.setItem('hero_auto_loop_mode', 'true');
     ```
   - Dispatches `CustomEvent('hero_kadan_rpg_auto_mode_updated', { detail: { autoMode: true } })`.
   - Dispatches `CustomEvent('snshero_idle_autoplay_triggered', { detail: { timestamp, targetUrl, fromUrl } })`.
3. **Navigation / Redirect Execution**:
   - Location: `src/landing/services/idleAutoPlayManager.ts:259-323`
   - Target URL: `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` (with fallback to hash `#play` in localhost/test mode).
   - If user is already on `#play`:
     - Activates auto-mode in place; avoids unnecessary reload.
   - If user is on any other screen (`#home`, `#deck`, `#card`, `#shop`):
     - Navigates immediately to `#play`.
   - When `#play` loads:
     - `progress.autoMode` reads `hero_kadan_rpg_auto_mode` (`true`).
     - `useKadanRpgAutoRunner` starts moving hero, triggering dialogue, entering 3x3 battle, winning, collecting rewards, and continuing chapter-by-chapter progression hands-free.

---

### Obs 4. Test Suite Constraints & Parity Requirements
1. **Adversarial Landing Test Suite (`tests/adversarial_challenger_m3_landing.ts`)**:
   - Lines 385-404: Explicitly tests `renderPlaySection()` HTML output.
   - Requires that `<section ... aria-label="웹툰 컨트롤 바">` contains **exactly 5 buttons**: `닫기`, `이전`, `다음`, `나레이션`, `TTS`.
   - Requires boundary navigation clamping (`ADV.PLAY.6`).
2. **Tier 1 Feature Coverage Test (`tests/e2e/tier1_feature_coverage.ts`)**:
   - Lines 353-401 (`T1.PLAY.1` ~ `T1.PLAY.5`):
     - `T1.PLAY.1`: Verifies existence of `src/components/rpg/KadanWorldMap.tsx`.
     - `T1.PLAY.2`: Verifies existence of `src/components/rpg/KadanNpcDialog.tsx`.
     - `T1.PLAY.3`: Verifies existence of `src/views/MobileCardPlayScreen.tsx`.
     - `T1.PLAY.4`: Verifies existence of `src/hooks/useKadanRpgAutoRunner.ts`.
     - `T1.PLAY.5`: Verifies `PlaySection.tsx` retains `닫기`, `이전`, `다음`, `나레이션`, `TTS`.
3. **Approved Task Prompt & PROJECT.md Requirements**:
   - Approved Task Prompt (R1):
     > "`#play` replaces the legacy `/play` screen. The initial screen must start on the existing tile game screen. Navigating/moving initiates an episode. Once the episode finishes, proceed to card play as before, and enable auto-play after completion. Existing Play features must remain functional."
   - PROJECT.md (Features 8–12):
     > Initial screen loads 2D tile adventure map (`KadanWorldMap`), movement triggers dialogue (`KadanNpcDialog`), episode conclusion transitions to 3x3 card battle (`MobileCardPlayScreen`), auto-play loop progresses hands-free, access to 110 minigames arcade and episode viewer retained.

---

## 2. Logic Chain

1. **Dialogue to Battle Transition Logic**:
   - In `KadanNpcDialog.tsx`, dialogue lines from `KADAN_RPG_NOVEL_SCRIPTS[chapter]` are rendered sequentially.
   - When `lineIndex` reaches the final cut, the component identifies that dialogue is complete.
   - Because `canStartBattle` is true for enemy nodes, the primary action button changes its label to `[전투 시작]` (`t('kadan_rpg_start_battle')`).
   - Clicking this button (or auto-timer advancing) invokes `finishConversation()`, which calls the `onStartBattle` callback prop.
   - `KadanRpgView` sets `battleEvent = activeEvent`.
   - The existence of `battleEvent` triggers the rendering of `MobileCardPlayScreen` via `createPortal(..., document.body)` with full-screen z-index `z-[99999]`.
   - Therefore, the dialogue completion directly and deterministically triggers the 3x3 card battle modal.

2. **Battle Completion to Progression Logic**:
   - `MobileCardPlayScreen` runs the 3x3 battle grid. When 9 slots are filled and a winner is determined, `gameOver` is set to true.
   - With `autoCloseOnComplete={true}`, a 1600ms timeout calls `handleExitGame()`.
   - `handleExitGame()` invokes `recordMatchResult` and `onBack(true)`.
   - `KadanRpgView` handles this in `handleBattleComplete`: it marks the encounter cleared (`markEncounterCleared`), resets `battleEvent` to null, and launches `openEpisodeEndMediaPrompt`.
   - `openEpisodeEndMediaPrompt` automatically distributes rewards and mounts `EpisodeMediaWatchModal`.
   - `EpisodeMediaWatchModal` runs a 3000ms countdown and calls `safeProceedNext()` -> `completeActiveEvent()`.
   - `completeActiveEvent()` marks chapter completion in LocalStorage (`hero_kadan_rpg_completed_chapters`), clearing all active modals.
   - Therefore, the transition from battle end to reward collection and next chapter unlock is fully closed-loop.

3. **Auto-Runner Coordination Logic**:
   - `useKadanRpgAutoRunner` operates as an external orchestrator for map movement and chapter transitions.
   - It maintains `isBusy` tracking all active sub-components (`isMoving`, `activeEvent`, `battleEvent`, `mediaPromptEvent`, `ambushAlert`, `ambushBattle`).
   - When no sub-component is active, `useKadanRpgAutoRunner` advances the hero tile by tile toward `nextEvent` (`routeToTarget`).
   - When the hero reaches the target tile, `useKadanRpgAutoRunner` triggers `interact` -> `openEvent(nextEvent)`.
   - Once `activeEvent` is set, `isBusy` becomes true, and `useKadanRpgAutoRunner` safely yields execution to `KadanNpcDialog`.
   - `KadanNpcDialog` handles cut advance and choice selection via its internal timer (`594-649`).
   - Once battle starts, `battleEvent` is true, keeping `isBusy = true`. `MobileCardPlayScreen` auto-plays and auto-closes.
   - Once rewards finish, `isBusy` returns to false, and `useKadanRpgAutoRunner` resumes stepping toward the newly unlocked chapter.
   - Therefore, the auto-runner avoids race conditions or double-stepping by cleanly deferring to subcomponent state.

4. **15s Global Idle Integration Logic**:
   - `idleAutoPlayManager` tracks user inactivity across the entire application.
   - When 15 seconds elapse without user input, it writes `hero_kadan_rpg_auto_mode = 'true'` to `localStorage` and redirects to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play`.
   - When `#play` loads, `useKadanRpgProgress` initializes with `autoMode = true`.
   - `useKadanRpgAutoRunner` is mounted with `enabled: true`.
   - As a result, an idle user anywhere in the app is automatically brought to `#play` and begins hands-free progression through tiles, dialogues, and 3x3 battles without requiring any manual clicks.

---

## 3. Caveats

1. **Dual Constraint in `PlaySection.tsx`**:
   - `tests/adversarial_challenger_m3_landing.ts` strictly asserts that `renderPlaySection()` HTML contains the exact 5-button control bar (`닫기`, `이전`, `다음`, `나레이션`, `TTS`) inside an element with `aria-label="웹툰 컨트롤 바"`.
   - At the same time, `ORIGINAL_REQUEST.md` and `PROJECT.md` require `#play` to start on the 2D tile game screen (`KadanWorldMap`).
   - **Recommendation**: `PlaySection.tsx` must preserve the `<section ... aria-label="웹툰 컨트롤 바">` with the exact 5 buttons, and offer a clear tabbed or top-level navigation (`[RPG 모험 & 카드 배틀]` / `[공식 웹툰 극장]` / `[110 미니게임 아케이드]`) or embed the tile game directly above/integrated with the media viewer.
2. **React DOM Mounting in Static Landing Architecture**:
   - `src/landing/index.ts` is currently a string template generator with pure DOM manipulation (`mainSlot.innerHTML = ...`).
   - The full RPG game (`KadanWorldMap`, `KadanNpcDialog`, `MobileCardPlayScreen`) uses React 19 hooks and JSX.
   - **Recommendation**: When `#play` is rendered, `PlaySection.tsx` should output a mount container (e.g. `<div id="play-rpg-container"></div>`), and `src/landing/index.ts` (or `PlaySection.tsx` lifecycle hook) can mount `KadanRpgView` into this container via `createRoot(container).render(...)`, ensuring clean unmounting on navigating to other hash routes.
3. **Random Field Encounters (Bandit & Thief Ambushes)**:
   - During tile movement, `shouldTriggerAmbush` fires with 12~15% probability per step.
   - If an ambush triggers, `ambushBattle` mounts `MobileCardPlayScreen` with `initialAutoBattle=true` and `autoCloseOnComplete=true`. Loss does not block story progression, and victory awards SNS coins and items.

---

## 4. Conclusion

1. **Episode Dialogue to Battle Flow**: Concluding cutscene dialogue in `KadanNpcDialog.tsx` cleanly invokes `onStartBattle()`, which sets `battleEvent = activeEvent` in `KadanRpgView.tsx`. This immediately portals `MobileCardPlayScreen` with player's buffed deck vs opponent's custom deck. Upon match completion, `autoCloseOnComplete` closes the match in 1.6s, awards rewards, and unlocks the next chapter via `completeActiveEvent`.
2. **Automated Progression Engine**: `useKadanRpgAutoRunner.ts` provides a robust, crash-free 9-step progression loop. By leveraging `isBusy`, it avoids conflicting timers and allows `KadanNpcDialog` and `MobileCardPlayScreen` to execute their internal auto-play cycles smoothly.
3. **15s Global Idle Auto-Play Integration**: `idleAutoPlayManager.ts` seamlessly bridges global inactivity to `#play` by writing `hero_kadan_rpg_auto_mode = 'true'` and redirecting to `#play`. Once `#play` mounts, the auto-runner engages automatically.
4. **Implementation Blueprint for Worker**:
   - Maintain the webtoon control bar (`aria-label="웹툰 컨트롤 바"` with `닫기`, `이전`, `다음`, `나레이션`, `TTS`) to satisfy `ADV.PLAY.5` and `T1.PLAY.5`.
   - Embed the 2D tile game (`KadanWorldMap`) and battle loop as the default active mode of `#play`.
   - Provide clean tab switching between `[RPG 모험 (Tile Game)]`, `[110 미니게임]`, and `[웹툰/미디어]`.
   - Use `createRoot` to mount `KadanRpgView` inside `#play`'s mount point when `#play` is active, cleaning up on route change.

---

## 5. Verification Method

To independently verify these findings, execute the following commands in the workspace:

1. **Verify Component Implementations & Types**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected result*: Exit code 0 (0 TypeScript errors).

2. **Verify Existing Tier 1~4 E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected result*: T1.PLAY.1~5 and T4.W1.2 pass.

3. **Verify Milestone 3 Adversarial Test Harnesses**:
   ```bash
   npx tsx tests/adversarial_challenger_m3_landing.ts
   npx tsx tests/challenger_m3_adversarial.ts
   npx tsx tests/adversarial_challenger_m3_stress_harness.ts
   ```
   *Expected result*: Pass 100% assertions including `ADV.PLAY.5` and `ADV.PLAY.6`.

4. **Verify Idle Auto-Play Unit Test**:
   ```bash
   npx tsx tests/unit_m1_idle_autoplay.ts
   ```
   *Expected result*: All idle auto-play assertions pass.

5. **Code Inspection Checkpoints**:
   - Inspect `src/components/rpg/KadanNpcDialog.tsx:410-421, 651-665, 1146-1160` for `[전투 시작]` label and `finishConversation()`.
   - Inspect `src/views/KadanRpgView.tsx:814-848, 1157-1191` for `useKadanRpgAutoRunner` and `MobileCardPlayScreen` portal.
   - Inspect `src/views/MobileCardPlayScreen.tsx:1421-1429` for `autoCloseOnComplete` 1600ms exit timer.
   - Inspect `src/landing/services/idleAutoPlayManager.ts:231-290` for `commitAutoModeFlags` and navigation.
