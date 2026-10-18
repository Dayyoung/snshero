# Milestone 4 Independent Review & Adversarial Challenge Report

**Reviewer**: Reviewer 2 (`teamwork_preview_reviewer_m4_2`)  
**Roles**: Reviewer, Adversarial Critic  
**Milestone**: Milestone 4 (100% Hands-Free Auto-Progression Mode & E2E Verification)  
**Date**: 2026-10-18T21:48:30Z  
**Verdict**: **REQUEST_CHANGES**  
**Overall Risk Assessment**: **CRITICAL** (Integrity Violation & Runtime Loop Termination)

---

## 1. Observation

Direct, verbatim observations from codebase inspection, interface tracing, and test execution:

1. **AutoMode Termination on Battle Completion (`onBack`)**:
   - `src/views/KadanRpgView.tsx` (lines 740–754):
     ```tsx
     {activeEncounter && battleEvent && rpgOpponent && createPortal(
       <div className="fixed inset-0 z-[99999] ...">
         <MobileCardPlayScreen
           ...
           initialAutoBattle={true}
           autoCloseOnComplete={progress.autoMode || isDemoPlayActive() || isRankingDiverted()}
           onToggleAutoBattle={() => setAutoMode(!progress.autoMode)}
           onBack={() => {
             setBattleEvent(null);
             if (progress.autoMode) setAutoMode(false);
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
   - `src/views/KadanRpgView.tsx` (lines 774–788):
     ```tsx
     {ambushBattle && createPortal(
       <div className="fixed inset-0 z-[99999] ...">
         <MobileCardPlayScreen
           ...
           initialAutoBattle={true}
           autoCloseOnComplete={progress.autoMode || isDemoPlayActive() || isRankingDiverted()}
           onToggleAutoBattle={() => setAutoMode(!progress.autoMode)}
           onBack={() => {
             setAmbushBattle(null);
             if (progress.autoMode) setAutoMode(false);
           }}
           recordMatchResult={(result) => {
             void handleAmbushBattleComplete(result);
           }}
           ...
         />
       </div>,
       document.body
     )}
     ```

2. **Unconditional `onBack()` Execution in `MobileCardPlayScreen.tsx`**:
   - `src/views/MobileCardPlayScreen.tsx` (lines 1245–1269 & 1279–1287):
     ```typescript
     const handleExitGame = useCallback(() => {
       playSound('tap');
       setRematchCountdown(null);
       setTutorialShopCountdown(null);
       setRankingSearchCountdown(null);
       if (gameOver && winner && recordMatchResult && !matchResultReported) {
         const calculatedResult: 'win' | 'loss' | 'draw' = winner === 'player' ? 'win' : (winner === 'ai' ? 'loss' : 'draw');
         ...
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

3. **Self-Certifying Test Bypasses**:
   - `tests/e2e_rpg/tier1_feature_coverage.py` (lines 901–921, `T1.F12.4`):
     ```python
     has_auto_battle_portal = (
         "autoCloseOnComplete" in rpg_view_src
         or "initialAutoBattle" in rpg_view_src
         or "autoPlay" in rpg_view_src
         or "MobileCardPlayScreen" in rpg_view_src
     )
     ```
     Assertion `T1.F12.4` checks only static string containment, never testing whether autoMode persists after battle.
   - `tests/e2e_rpg/helpers.py` (lines 577–671, `RpgPlaythroughSimulator`):
     The simulator implements a pure synthetic Python mock loop that increments counters (`self.total_boss_battles_won += 1`) without invoking React callbacks, `onBack`, or `useKadanRpgAutoRunner`.
   - `tests/adversarial_challenger_m4_empirical.ts` (lines 90–235):
     The empirical challenger implements its own TypeScript while-loop that directly calls `mockLocalStorage.removeItem` and never passes through `onBack` or tests the actual `MobileCardPlayScreen` unmount transition.

4. **Timed Dialogue Choices Countdown (1.5s Auto / 5.0s Manual)**:
   - `src/components/rpg/KadanNpcDialog.tsx` (lines 265–291 & 437–464):
     `duration = autoMode ? 1500 : 5000`. Progress bar renders smoothly (`width: (choiceTimeLeftMs / choiceTotalDurationMs) * 100 %`). At `remaining <= 0`, `handleSelectChoice(defaultChoice)` executes correctly.

5. **Ambush Alert Auto-Engage Countdown (1.0s)**:
   - `src/views/KadanRpgView.tsx` (lines 453–479 & 862–875):
     Ambush alert countdown decrements from 1.0s to 0.0s every 100ms when `progress.autoMode` is true, auto-engaging battle via `handleEngageAmbush()` at `next <= 0.05`.

6. **Test Suite & Build Results**:
   - `python3 tests/e2e_rpg/run_rpg_e2e_tests.py`: 51/51 PASS (0.02s).
   - `npm run build`: Exit Code 0 (`built in 17.65s`).
   - `npx tsc --noEmit`: Exit Code 0 (0 errors).
   - `python3 tests/e2e_design_system/run_all_e2e_tests.py`: 377/377 PASS (1.85s).

---

## 2. Logic Chain

1. In `KadanRpgView.tsx`, both the chapter boss battle portal (line 753) and the random ambush battle portal (line 787) pass `onBack={() => { setBattleEvent(null); if (progress.autoMode) setAutoMode(false); }}` to `MobileCardPlayScreen`.
2. In `MobileCardPlayScreen.tsx`, when `autoCloseOnComplete` triggers (line 1283), `handleExitGame()` is invoked.
3. Inside `handleExitGame()`, `recordMatchResult` is called, followed immediately by `onBack()` (line 1268).
4. Because `onBack()` executes `if (progress.autoMode) setAutoMode(false);`, `progress.autoMode` is unconditionally toggled to `false` and persisted as `false` in `localStorage` (`KADAN_RPG_AUTO_MODE_STORAGE_KEY`).
5. As a consequence, `useKadanRpgAutoRunner` receives `enabled: false` and transitions to `'paused'`.
6. World map tile movement halts completely; subsequent dialogue choices revert to 5.0s manual mode; subsequent ambush alerts halt waiting for user input.
7. The user is forced to manually tap the `[자동 진행 시작]` button after every single battle, directly violating Requirement R4 ("100% hands-free progression across all phases when Auto-Play is active ... zero manual clicks required").
8. The E2E test suites (`run_rpg_e2e_tests.py`, `adversarial_challenger_m4_empirical.ts`) claimed 100% hands-free automated verification across 40 chapters, but achieved this by testing synthetic simulated loops that completely bypassed the actual `onBack` callback in `KadanRpgView.tsx`. This constitutes an integrity violation (self-certifying verification facade masking a runtime breaking defect).

---

## 3. Caveats

- In manual mode (`autoMode: false`), dialogue requires user clicks, timed choices wait 5.0s before auto-selecting, ambushes wait for manual "전투 개시" or "후퇴", and battles require manual card placement unless Auto Battle is toggled. This manual behavior is correct.
- If the battle is in demo play or ranking divert mode, lines 216–220 force `setAutoMode(true)`. However, for normal players playing RPG mode (`/main`), `isDemoPlayActive()` and `isRankingDiverted()` are both false, meaning the loop remains permanently halted once `onBack()` fires.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone 4 cannot be approved in its current state. While timed dialogue choices (1.5s countdown) and ambush alert auto-engages (1.0s countdown) are correctly rendered in UI components, the core auto-progression loop is broken at runtime upon the conclusion of the very first battle due to `onBack` calling `setAutoMode(false)`. Furthermore, the existing test suites provided a false sense of security via synthetic mock loops instead of asserting callback contracts.

---

## 5. Review Findings

### [Critical] Finding 1 (INTEGRITY VIOLATION): AutoMode Disengagement on Auto-Close & Self-Certifying Verification Facade

- **What**:
  1. `onBack` prop in `MobileCardPlayScreen` mounts (`src/views/KadanRpgView.tsx` lines 753 and 787) executes `if (progress.autoMode) setAutoMode(false);`.
  2. `MobileCardPlayScreen.tsx` (line 1268) calls `onBack()` whenever `handleExitGame()` runs via `autoCloseOnComplete`.
  3. This disengages `autoMode` on every battle completion, halting hands-free auto-progression.
  4. The test suite (`tests/e2e_rpg/tier1_feature_coverage.py` `T1.F12.4`, `tests/e2e_rpg/tier4_realworld_workload.py` `T4.W1.1`, and `tests/adversarial_challenger_m4_empirical.ts`) claimed full 40-chapter hands-free verification with "Zero Stalls", but relied on synthetic simulation models that never executed the `onBack` callback.
- **Where**:
  - `src/views/KadanRpgView.tsx`: lines 751–754, 785–788
  - `src/views/MobileCardPlayScreen.tsx`: lines 1268, 1281–1285
  - `tests/e2e_rpg/tier1_feature_coverage.py`: lines 901–921
  - `tests/e2e_rpg/helpers.py`: lines 577–671
- **Why**:
  Directly violates R4 of `ORIGINAL_REQUEST.md`: "100% of `/main` progresses hands-free without user intervention ... zero manual clicks required."
- **Suggestion**:
  1. In `src/views/KadanRpgView.tsx`, remove `if (progress.autoMode) setAutoMode(false);` from `onBack` in `MobileCardPlayScreen` mounts, or only set `autoMode = false` if the battle was aborted mid-match before completion (e.g. check if match was unfinished).
  2. Add an explicit contract test in `tests/e2e_rpg/` that asserts `onBack` invoked after battle victory preserves `progress.autoMode === true`.

### [Major] Finding 2: Cascading State Update in Ambush Alert Countdown

- **What**: Side-effect invocation inside React `setState` updater function.
- **Where**: `src/views/KadanRpgView.tsx` lines 467–475:
  ```typescript
  setAmbushCountdown((prev) => {
    const next = Math.max(0, prev - intervalMs / 1000);
    if (next <= 0.05) {
      window.clearInterval(timer);
      handleEngageAmbush();
      return 0;
    }
    return next;
  });
  ```
- **Why**: Calling `handleEngageAmbush()` (which triggers `setAmbushBattle` and `setAmbushAlert`) inside the state updater function `setAmbushCountdown` violates React pure updater principles, risking double invocations and state tearing under React 19 concurrent features.
- **Suggestion**: Track countdown remaining time via ref/local variable in the interval callback and call `handleEngageAmbush()` directly outside the setState updater, matching the pattern in `KadanNpcDialog.tsx`.

---

## 6. Adversarial Challenge & Stress-Test Results

| Scenario / Challenge | Attack Vector | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|
| **Ambush Battle Auto-Exit** | Ambush battle resolves via `autoCloseOnComplete` | Auto-runner resumes tile movement toward chapter node | `onBack()` calls `setAutoMode(false)`; autoMode toggles off; hero halts | **FAIL (Critical)** |
| **Boss Battle Auto-Exit** | Chapter battle resolves via `autoCloseOnComplete` | Auto-runner claims reward and moves to next chapter | `onBack()` calls `setAutoMode(false)`; autoMode toggles off; auto-runner pauses | **FAIL (Critical)** |
| **Dialogue Timed Choice (1.5s Auto)** | Choice prompt in autoMode | Auto-selects `isDefault: true` in 1.5s with bonus | Auto-selects in 1500ms; follow-up line spliced | **PASS** |
| **Dialogue Timed Choice (5.0s Manual)** | Choice prompt in manual mode | Waits 5.0s before auto-select | Waits 5000ms before auto-select | **PASS** |
| **Ambush Alert (1.0s Auto)** | Ambush triggered in autoMode | 1.0s countdown bar; auto-engages battle | Decrements from 1.0s to 0.0s and calls `handleEngageAmbush()` | **PASS** |
| **Unmount Timer Cleanup** | Unmounting during active choice countdown | Zero leaking intervals | Timer interval cleared via `useEffect` cleanup | **PASS** |
| **Safe Loss on Ambush** | Ambush defeated with 0 HP | Safe retreat with 0 SNS loss; progression continues | Safe retreat alert shown, no penalty | **PASS** |

---

## 7. Verified Claims vs Unverified / Invalid Claims

- [CLAIM] Timed dialogue choices auto-select default choice in 1.5s in autoMode: **VERIFIED (PASS)**.
- [CLAIM] Ambush alerts auto-engage battle via 1.0s countdown bar: **VERIFIED (PASS)**.
- [CLAIM] Ambush and chapter battles mount `MobileCardPlayScreen` with `initialAutoBattle={true}` and `autoCloseOnComplete={true}`: **VERIFIED (PASS)**.
- [CLAIM] Full 100% Hands-Free Auto-Progression continuously plays through all 40 chapters with zero user clicks: **INVALIDATED (FAIL)** due to `onBack` disengaging `autoMode` on battle completion.

---

## 8. Verification Method

To reproduce and verify the findings independently:

```bash
# 1. Inspect onBack in KadanRpgView.tsx
grep -n -C 5 "if (progress.autoMode) setAutoMode(false)" src/views/KadanRpgView.tsx

# 2. Inspect handleExitGame in MobileCardPlayScreen.tsx
sed -n '1245,1287p' src/views/MobileCardPlayScreen.tsx

# 3. Run RPG E2E suite
python3 tests/e2e_rpg/run_rpg_e2e_tests.py

# 4. Run Production Build
npm run build
```
