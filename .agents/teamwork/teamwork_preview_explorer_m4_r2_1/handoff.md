# Handoff Report: AutoMode Disengagement on Battle Completion Fix

**Agent**: Explorer 1 (`teamwork_preview_explorer_m4_r2_1`)  
**Mission**: Milestone 4 Iteration 2 — Root cause investigation and exact fix strategy for AutoMode disengagement on battle completion in `KadanRpgView.tsx` and `MobileCardPlayScreen.tsx`.  
**Date**: 2026-10-18T21:58:00Z  
**Recipient**: Worker 4 (`teamwork_preview_worker_m4_4`) and Orchestrator (`orchestrator_6`)

---

## 1. Observation

### 1.1 Direct Observation of the Defect in `KadanRpgView.tsx`
- **Location**: `src/views/KadanRpgView.tsx`, lines 751–754 and 785–788:
  ```tsx
  // Chapter Boss Battle Portal (Lines 751–754):
  onBack={() => {
    setBattleEvent(null);
    if (progress.autoMode) setAutoMode(false);
  }}

  // Random Ambush Battle Portal (Lines 785–788):
  onBack={() => {
    setAmbushBattle(null);
    if (progress.autoMode) setAutoMode(false);
  }}
  ```

### 1.2 Direct Observation of Battle Auto-Exit in `MobileCardPlayScreen.tsx`
- **Location**: `src/views/MobileCardPlayScreen.tsx`, lines 1245–1269 & 1279–1287:
  ```tsx
  const handleExitGame = useCallback(() => {
    playSound('tap');
    setRematchCountdown(null);
    setTutorialShopCountdown(null);
    setRankingSearchCountdown(null);
    if (gameOver && winner && recordMatchResult && !matchResultReported) {
      const calculatedResult: 'win' | 'loss' | 'draw' = winner === 'player' ? 'win' : (winner === 'ai' ? 'loss' : 'draw');
      const currentBattleType: 'pvp_attack' | 'robot' = isRankingMatch ? 'pvp_attack' : 'robot';
      const currentOppInfo = activeRankOpponent ? {
        id: activeRankOpponent.id,
        name: activeRankOpponent.name,
        sns: activeRankOpponent.sns,
        wins: activeRankOpponent.wins,
        losses: activeRankOpponent.losses,
        draws: activeRankOpponent.draws
      } : (opponentName ? { id: `opp-${Date.now()}`, name: opponentName } : undefined);

      recordMatchResult(calculatedResult, undefined, undefined, currentBattleType, currentOppInfo);
      setMatchResultReported(true);
    }
    try {
      localStorage.removeItem('hero_auto_loop_is_ranking');
    } catch {}
    onBack();
  }, [gameOver, winner, recordMatchResult, matchResultReported, onBack, playSound, isRankingMatch, activeRankOpponent, opponentName]);

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

### 1.3 Direct Observation of Auto Runner State Machine in `useKadanRpgAutoRunner.ts`
- **Location**: `src/hooks/useKadanRpgAutoRunner.ts`, lines 68–72:
  ```typescript
  useEffect(() => {
    if (!enabled) {
      setGuardedStep('paused');
      return;
    }
  ```
  `enabled` is passed directly from `progress.autoMode` (`src/views/KadanRpgView.tsx`, line 526: `enabled: progress.autoMode`).

### 1.4 Observation of Mid-Battle Abort Controls
- **Location**: `src/views/MobileCardPlayScreen.tsx`, lines 1518–1527:
  ```tsx
  <button
    type="button"
    onClick={handleExitGame}
    className="h-11 px-3 rounded-sm flex items-center justify-center gap-1.5 border border-[#0f0000]/20 bg-[#fdfcfc] hover:bg-[#f1eeee] active:scale-95 shrink-0 z-[10000] cursor-pointer text-[#201d1d] font-bold select-none touch-manipulation shadow-2xs"
    aria-label={t('exit_battle', language)}
    title={t('exit_battle', language)}
  >
    <ArrowLeft size={18} strokeWidth={2.5} />
    <span className="text-[11px] font-black tracking-tight">{language === 'ko' ? '종료' : 'EXIT'}</span>
  </button>
  ```
  - When the match is still active (`!gameOver || !winner`), clicking this button executes `handleExitGame()`, where `gameOver` is `false` and `winner` is `null`.
  - In `KadanRpgView.tsx`, line 212:
    ```tsx
    const hasBattle = Boolean(activeEvent && activeEvent.nodeType === 'enemy' && !battleEvent && !rewardEvent);
    ```
    If `autoMode` were NOT disabled on a mid-game abort, `hasBattle` would instantly become `true` upon `battleEvent = null`, and `useKadanRpgAutoRunner` (lines 88–92) would immediately re-open the battle after 650ms.

### 1.5 Secondary Defect: Cascading State Update in Ambush Alert Countdown
- **Location**: `src/views/KadanRpgView.tsx`, lines 463–479:
  ```tsx
  setAmbushCountdown(1.0);
  const intervalMs = 100;
  const timer = window.setInterval(() => {
    setAmbushCountdown((prev) => {
      const next = Math.max(0, prev - intervalMs / 1000);
      if (next <= 0.05) {
        window.clearInterval(timer);
        handleEngageAmbush();
        return 0;
      }
      return next;
    });
  }, intervalMs);
  ```
  Invoking `handleEngageAmbush()` (which triggers `setAmbushBattle` and `setAmbushAlert`) inside the `setAmbushCountdown` functional updater is an impure side-effect violating React state updater rules.

---

## 2. Logic Chain

1. **Root Cause**:
   - `MobileCardPlayScreen` mounts in `KadanRpgView.tsx` pass `onBack={() => { setBattleEvent(null); if (progress.autoMode) setAutoMode(false); }}`.
   - When a battle ends under auto-mode, `autoCloseOnComplete` runs `handleExitGame()` after 1600ms.
   - `handleExitGame()` unconditionally calls `onBack()`.
   - Because `onBack()` executes `if (progress.autoMode) setAutoMode(false);`, `progress.autoMode` is toggled to `false` and saved to `localStorage` immediately upon battle conclusion.
   - `useKadanRpgAutoRunner` receives `enabled = false`, halting the auto-runner into `'paused'`.
   - Tile navigation and subsequent chapter progression stall after the very first battle, directly violating R4.

2. **Differentiating Match Completion vs. Explicit Mid-Game Abort**:
   - **Scenario A: Normal Completion / Auto-Close**:
     - `gameOver === true && winner !== null`.
     - The battle completed naturally.
     - `progress.autoMode` **MUST NOT** be set to `false`. It must remain `true` so the auto-runner can automatically claim rewards, navigate to the next chapter tile, and continue hands-free progression.
   - **Scenario B: Mid-Game Abort / Manual Surrender**:
     - The player explicitly taps the `<ArrowLeft>` Exit button in the header while the match is ongoing (`!gameOver || !winner`).
     - In this scenario, the player has intentionally interrupted gameplay.
     - If `autoMode` remained `true`, `useKadanRpgAutoRunner` would see `hasBattle: true` (enemy event not yet cleared) and immediately re-trigger the battle in 650ms, trapping the user in an inescapable battle loop.
     - Therefore, in Scenario B, `setAutoMode(false)` **MUST** be called to respect the player's manual abort.

3. **Safe Contract Solution**:
   - In `MobileCardPlayScreen.tsx`:
     Update `onBack: (completed?: boolean) => void`.
     Inside `handleExitGame()`:
     ```typescript
     const isMatchCompleted = Boolean(gameOver && winner);
     ...
     onBack(isMatchCompleted);
     ```
   - In `KadanRpgView.tsx`:
     ```tsx
     onBack={(completed) => {
       setBattleEvent(null);
       if (!completed && progress.autoMode) {
         setAutoMode(false);
       }
     }}
     ```
   - When `completed === true` (auto-close or exit from game over modal), `!completed` is `false`, so `setAutoMode(false)` is NOT called; `autoMode` stays `true`.
   - When `completed === false` (mid-game abort), `!completed` is `true`, so `setAutoMode(false)` pauses auto-mode safely.
   - In TypeScript, existing callers passing `() => void` (e.g. `App.tsx`) remain 100% type-compatible.

---

## 3. Caveats

1. **Backwards Compatibility**:
   - `MobileCardPlayScreenProps['onBack']` changed from `() => void` to `(completed?: boolean) => void`. In TypeScript, a function with fewer parameters is assignable to one with more parameters, so callers ignoring arguments (like `App.tsx` line 5805) require zero modifications and compile cleanly.
2. **Loss Handling in Chapter Boss Battles**:
   - On a loss in a chapter boss encounter (where `encounter.allowLossProgress` is false), `handleBattleComplete` leaves `activeEvent` active and displays a failure notification. Since `isMatchCompleted` is `true`, `autoMode` is not disabled. The auto-runner will retry the battle after the alert. For ambush encounters, `allowLossProgress` is true, so defeat gracefully retreats with 0 SNS loss and continues tile progression.

---

## 4. Conclusion & Concrete Recommendations for Worker 4

### Recommendation 1: Update `src/views/MobileCardPlayScreen.tsx`
1. Line 80:
   ```typescript
   // Before:
   onBack: () => void;

   // After:
   onBack: (completed?: boolean) => void;
   ```
2. Lines 1245–1269:
   ```typescript
   // Before:
   const handleExitGame = useCallback(() => {
     playSound('tap');
     setRematchCountdown(null);
     setTutorialShopCountdown(null);
     setRankingSearchCountdown(null);
     if (gameOver && winner && recordMatchResult && !matchResultReported) {
       ...
       recordMatchResult(calculatedResult, undefined, undefined, currentBattleType, currentOppInfo);
       setMatchResultReported(true);
     }
     try {
       localStorage.removeItem('hero_auto_loop_is_ranking');
     } catch {}
     onBack();
   }, [gameOver, winner, recordMatchResult, matchResultReported, onBack, playSound, isRankingMatch, activeRankOpponent, opponentName]);

   // After:
   const handleExitGame = useCallback(() => {
     playSound('tap');
     setRematchCountdown(null);
     setTutorialShopCountdown(null);
     setRankingSearchCountdown(null);
     const isMatchCompleted = Boolean(gameOver && winner);
     if (isMatchCompleted && recordMatchResult && !matchResultReported) {
       const calculatedResult: 'win' | 'loss' | 'draw' = winner === 'player' ? 'win' : (winner === 'ai' ? 'loss' : 'draw');
       const currentBattleType: 'pvp_attack' | 'robot' = isRankingMatch ? 'pvp_attack' : 'robot';
       const currentOppInfo = activeRankOpponent ? {
         id: activeRankOpponent.id,
         name: activeRankOpponent.name,
         sns: activeRankOpponent.sns,
         wins: activeRankOpponent.wins,
         losses: activeRankOpponent.losses,
         draws: activeRankOpponent.draws
       } : (opponentName ? { id: `opp-${Date.now()}`, name: opponentName } : undefined);

       recordMatchResult(calculatedResult, undefined, undefined, currentBattleType, currentOppInfo);
       setMatchResultReported(true);
     }
     try {
       localStorage.removeItem('hero_auto_loop_is_ranking');
     } catch {}
     onBack(isMatchCompleted);
   }, [gameOver, winner, recordMatchResult, matchResultReported, onBack, playSound, isRankingMatch, activeRankOpponent, opponentName]);
   ```

### Recommendation 2: Update `src/views/KadanRpgView.tsx`
1. Lines 751–754 (Boss Battle Portal):
   ```tsx
   // Before:
   onBack={() => {
     setBattleEvent(null);
     if (progress.autoMode) setAutoMode(false);
   }}

   // After:
   onBack={(completed) => {
     setBattleEvent(null);
     if (!completed && progress.autoMode) {
       setAutoMode(false);
     }
   }}
   ```
2. Lines 785–788 (Ambush Battle Portal):
   ```tsx
   // Before:
   onBack={() => {
     setAmbushBattle(null);
     if (progress.autoMode) setAutoMode(false);
   }}

   // After:
   onBack={(completed) => {
     setAmbushBattle(null);
     if (!completed && progress.autoMode) {
       setAutoMode(false);
     }
   }}
   ```
3. Lines 463–479 (Ambush Countdown Refactor — Fix Finding 2):
   ```tsx
   // Before:
   setAmbushCountdown(1.0);
   const intervalMs = 100;
   const timer = window.setInterval(() => {
     setAmbushCountdown((prev) => {
       const next = Math.max(0, prev - intervalMs / 1000);
       if (next <= 0.05) {
         window.clearInterval(timer);
         handleEngageAmbush();
         return 0;
       }
       return next;
     });
   }, intervalMs);

   return () => window.clearInterval(timer);

   // After:
   setAmbushCountdown(1.0);
   const durationMs = 1000;
   const deadline = Date.now() + durationMs;

   const intervalId = window.setInterval(() => {
     const remainingMs = Math.max(0, deadline - Date.now());
     const remainingSec = remainingMs / 1000;
     setAmbushCountdown(remainingSec);

     if (remainingMs <= 50) {
       window.clearInterval(intervalId);
       handleEngageAmbush();
     }
   }, 50);

   return () => window.clearInterval(intervalId);
   ```

### Recommendation 3: Update Test Suite in `tests/e2e_rpg/tier1_feature_coverage.py`
Update `T1.F12.4` to test the actual contract:
```python
# Verify that onBack handles completed parameter and does not unconditionally setAutoMode(false)
has_safe_on_back = (
    "if (!completed && progress.autoMode)" in rpg_view_src
    or ("onBack={(completed)" in rpg_view_src and "setAutoMode(false)" in rpg_view_src)
)
and_not_unconditional = "if (progress.autoMode) setAutoMode(false);" not in re.findall(r'onBack=\{[^}]+\}', rpg_view_src)
```

---

## 5. Verification Method

1. **Static Type Safety & Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   Must pass with 0 errors.

2. **Contract Verification**:
   ```bash
   # Verify unconditional setAutoMode(false) is completely eliminated from onBack in KadanRpgView.tsx:
   grep -n -C 3 "onBack=" src/views/KadanRpgView.tsx
   # Verify onBack passes isMatchCompleted in MobileCardPlayScreen.tsx:
   grep -n -C 3 "onBack(isMatchCompleted)" src/views/MobileCardPlayScreen.tsx
   ```

3. **RPG Master E2E Runner**:
   ```bash
   python3 tests/e2e_rpg/run_rpg_e2e_tests.py
   ```
   Must pass 51/51 assertions (or 52/52 with updated contract check).

4. **Design System & Visual Integrity**:
   ```bash
   python3 tests/e2e_design_system/run_all_e2e_tests.py
   ```
   Must pass 377/377 assertions with 0 errors.
