# Milestone 4 Iteration 2 Independent Review & Adversarial Challenge Report

**Reviewer**: Reviewer 1 (`teamwork_preview_reviewer_m4_r2_1`)  
**Roles**: Reviewer, Adversarial Critic  
**Milestone**: Milestone 4 Iteration 2 (100% Hands-Free Auto-Progression Mode & Contract Fixes)  
**Date**: 2026-10-18T22:15:00Z  
**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW** (All iteration 1 findings resolved and verified)

---

## 1. Observation

Direct, verbatim observations from codebase inspection, interface contract tracing, and test execution:

### 1.1 `MobileCardPlayScreen.tsx` onBack Contract & Result Flag
- **File**: `src/views/MobileCardPlayScreen.tsx`
- **Line 80**: Prop definition updated to accept an optional completion flag:
  ```typescript
  onBack: (completed?: boolean) => void;
  ```
- **Lines 1250–1270**:
  ```typescript
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
- When `autoCloseOnComplete` runs post-battle (line 1283), `gameOver` and `winner` are true, resulting in `isMatchCompleted === true`, passed directly to `onBack(true)`.
- If the player taps the exit button or triggers `popstate` mid-match before game over, `isMatchCompleted === false`, passed directly to `onBack(false)`.

### 1.2 `KadanRpgView.tsx` Portal Mounts onBack Handlers
- **File**: `src/views/KadanRpgView.tsx`
- **Lines 750–755** (Chapter Boss Battle Portal):
  ```tsx
  onBack={(completed) => {
    setBattleEvent(null);
    if (!completed && progress.autoMode) {
      setAutoMode(false);
    }
  }}
  ```
- **Lines 786–791** (Random Ambush Battle Portal):
  ```tsx
  onBack={(completed) => {
    setAmbushBattle(null);
    if (!completed && progress.autoMode) {
      setAutoMode(false);
    }
  }}
  ```
- In both portals, `setAutoMode(false)` is only executed if `!completed`. When a battle finishes naturally via `autoCloseOnComplete`, `completed === true`, so `setAutoMode(false)` is completely bypassed and `progress.autoMode` remains `true`.

### 1.3 `KadanRpgView.tsx` Ambush Alert Pure Wall-Clock Countdown Pattern
- **File**: `src/views/KadanRpgView.tsx`
- **Lines 453–478**:
  ```tsx
  useEffect(() => {
    if (!ambushAlert || !progress.autoMode) {
      setAmbushCountdown(1.0);
      return;
    }

    const durationMs = 1000;
    const deadline = Date.now() + durationMs;
    setAmbushCountdown(1.0);

    let hasEngaged = false;
    const intervalId = window.setInterval(() => {
      const remainingMs = Math.max(0, deadline - Date.now());
      setAmbushCountdown(remainingMs / 1000);

      if (remainingMs <= 0 && !hasEngaged) {
        hasEngaged = true;
        window.clearInterval(intervalId);
        handleEngageAmbush();
      }
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [ambushAlert, handleEngageAmbush, progress.autoMode]);
  ```
- `setAmbushCountdown` only updates state with the numeric remaining fraction (`remainingMs / 1000`).
- `handleEngageAmbush()` and `window.clearInterval(intervalId)` are called directly inside the interval callback, completely outside of any React `setState` functional updater.
- Real wall-clock measurement (`deadline - Date.now()`) eliminates timer drift under frame throttling.
- The `hasEngaged` flag guarantees single invocation even if interval ticks coincide with expiration.

### 1.4 Test Suite & Build Outputs
1. **Master RPG E2E Suite** (`python3 tests/e2e_rpg/run_rpg_e2e_tests.py`):
   - 52/52 Assertions Passed (0.04s, 100.0% compliance rate).
   - `T1.F12.4` explicitly validates that neither boss nor ambush portal in `KadanRpgView.tsx` disables `autoMode` unconditionally.
   - `T1.F12.6` explicitly validates that `handleEngageAmbush` is called outside `setState` updaters.
2. **Empirical Adversarial Challenger** (`npx tsx tests/adversarial_challenger_m4_empirical.ts`):
   - 34/34 Assertions Passed (Exit code 0).
   - Validates that simulation inspects `KadanRpgView.tsx` code contracts, that `onBack` preserves `autoMode: true`, and that 40 consecutive chapters run without stalls.
3. **Rebirth & Safe Retreat Adversarial Suite** (`npx tsx tests/adversarial_challenger2_m4_rebirth_retreat.ts`):
   - 27/27 Assertions Passed (Exit code 0).
   - Validates that `autoMode` is preserved across Rebirth 0 through 10, and safe retreat allows complete pathing.
4. **Consecutive Battle & Manual Abort Suite** (`npx tsx tests/adversarial_challenger_m4_consecutive_and_abort.ts`):
   - 24/24 Assertions Passed (Exit code 0).
   - Validates that 80 consecutive battles (40 ambush + 40 boss) execute without autoMode disengaging.
   - Validates that mid-match manual exits cleanly set `autoMode: false` and pause the runner.
5. **Design System E2E Suite** (`python3 tests/e2e_design_system/run_all_e2e_tests.py`):
   - 377/377 Assertions Passed (5.93s, 100.0% compliance rate).
6. **TypeScript Compilation** (`npx tsc --noEmit`):
   - 0 errors (Exit code 0).
7. **Production Build** (`npm run build`):
   - Built cleanly in 22.27s (0 bundling errors, exit code 0).

---

## 2. Logic Chain

1. In Milestone 4 Iteration 1, Reviewer 2 detected that `onBack` in `KadanRpgView.tsx` unconditionally executed `if (progress.autoMode) setAutoMode(false);` when `MobileCardPlayScreen` auto-closed after battle victory, halting the auto-progression loop.
2. In Iteration 2, `MobileCardPlayScreen.tsx` was updated to differentiate match completion (`const isMatchCompleted = Boolean(gameOver && winner);`) and pass this flag to `onBack(isMatchCompleted)`.
3. In `KadanRpgView.tsx`, both portal mounts were updated to check `if (!completed && progress.autoMode) setAutoMode(false);`:
   - Case A (Normal Battle Victory/Defeat Auto-Close): `completed` is `true`. `!completed` evaluates to `false`. `setAutoMode(false)` is NOT called. `autoMode` remains `true`. The auto-runner hook (`useKadanRpgAutoRunner`) detects the battle portal unmounting and immediately advances the hero to the next chapter node or claims rewards hands-free.
   - Case B (Manual Mid-Match Exit / Popstate): `completed` is `false`. `!completed` evaluates to `true`. `setAutoMode(false)` safely pauses the auto-runner, respecting the user's manual exit decision.
4. In `KadanRpgView.tsx`, the ambush alert countdown was refactored into a pure wall-clock deadline pattern with a local interval callback. `handleEngageAmbush()` is invoked outside the React `setState` updater, fully conforming to React 19 state updater purity and concurrent rendering standards.
5. In the test harness (`tier1_feature_coverage.py`, `helpers.py`, `adversarial_challenger_m4_empirical.ts`), tests were updated to inspect the actual implementation contract of `KadanRpgView.tsx` rather than synthetic mocks. Any regression in `onBack` immediately fails the test suite.
6. Across all 4 empirical and E2E test runners (137 combined assertions), 0 failures occurred. TypeScript compilation and production build completed with 0 errors.
7. Therefore, all requirements of Milestone 4 are fully satisfied with zero regressions and zero integrity violations.

---

## 3. Caveats

- In manual mode (`progress.autoMode === false`), dialogue choice countdowns wait 5.0 seconds before auto-selecting if untouched, and ambush alerts remain active until the player manually taps `[전투 개시]` or `[후퇴하기]`. This is the intended manual player experience.
- If an external consumer of `MobileCardPlayScreen` (such as `App.tsx`) invokes `onBack` without arguments, `completed` evaluates to `undefined`, which safely defaults to `!completed === true`. In `KadanRpgView`, this defensive default ensures mid-match unmounts do not accidentally leave auto-play in an orphaned state.
- In `npm run build`, an initial attempt encountered an OS directory lock on `dist/images/webtoon` (`ENOTEMPTY`). Running `rm -rf dist` cleared the stale directory lock and the production build succeeded in 22.27s with exit code 0.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 4 Iteration 2 has completely resolved both findings from Iteration 1:
1. **Finding 1 (AutoMode Disengagement on Auto-Close)** is 100% resolved: `onBack(isMatchCompleted)` preserves `progress.autoMode === true` across all chapter boss and ambush battles. Hands-free progression runs seamlessly end-to-end across all 40 chapters.
2. **Finding 2 (Cascading State Updater in Ambush Countdown)** is 100% resolved: the ambush countdown now uses a pure wall-clock deadline loop with `handleEngageAmbush()` called externally, strictly conforming to React 19 state updater purity.
3. **Verification Harness & Integrity**: Real code contract checks have been integrated into `tier1_feature_coverage.py` and `adversarial_challenger_m4_empirical.ts`. 100% of test suites pass (52/52 RPG E2E, 34/34 empirical challenger, 27/27 rebirth/retreat, 24/24 consecutive/abort, 377/377 design system, 0 TS errors, 0 build errors).

---

## 5. Verification Method

To independently verify the entire solution:

```bash
# 1. Verify onBack contract in MobileCardPlayScreen.tsx
grep -n -C 3 "onBack(isMatchCompleted)" src/views/MobileCardPlayScreen.tsx

# 2. Verify !completed checks in KadanRpgView.tsx portal mounts
grep -n -C 4 "!completed && progress.autoMode" src/views/KadanRpgView.tsx

# 3. Verify pure wall-clock deadline ambush countdown in KadanRpgView.tsx
sed -n '453,478p' src/views/KadanRpgView.tsx

# 4. Run Master RPG E2E Runner (52/52 PASS)
python3 tests/e2e_rpg/run_rpg_e2e_tests.py

# 5. Run Empirical Adversarial Challenger (34/34 PASS)
npx tsx tests/adversarial_challenger_m4_empirical.ts

# 6. Run Rebirth Loop & Safe Retreat Adversarial Suite (27/27 PASS)
npx tsx tests/adversarial_challenger2_m4_rebirth_retreat.ts

# 7. Run Consecutive Battles & Manual Abort Adversarial Suite (24/24 PASS)
npx tsx tests/adversarial_challenger_m4_consecutive_and_abort.ts

# 8. Run Design System E2E Suite (377/377 PASS)
python3 tests/e2e_design_system/run_all_e2e_tests.py

# 9. Verify TypeScript Compilation (0 errors)
npx tsc --noEmit

# 10. Verify Production Bundle (Exit code 0)
npm run build
```
