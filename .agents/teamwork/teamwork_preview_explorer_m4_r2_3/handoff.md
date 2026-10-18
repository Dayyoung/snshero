# Milestone 4 Iteration 2 Explorer 3 Investigation & Contract Test Design Report

**Agent**: Explorer 3 (`teamwork_preview_explorer_m4_r2_3`)  
**Roles**: Investigation, Synthesis, Contract Test Architect  
**Milestone**: Milestone 4 Iteration 2 (Contract Test & Regression Verification)  
**Date**: 2026-10-18T21:56:30Z  
**Target File**: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_m4_r2_3/handoff.md`  

---

## 1. Observation

Direct, verbatim code observations and tool outputs:

### 1.1 `KadanRpgView.tsx` — `onBack` Disengages `autoMode`
- `src/views/KadanRpgView.tsx` (lines 740–757):
  ```tsx
  {activeEncounter && battleEvent && rpgOpponent && createPortal(
    <div className="fixed inset-0 z-[99999] ...">
      <MobileCardPlayScreen
        isAdRemoved={isAdRemoved}
        playerDeck={getBuffedPlayerDeck(currentDeck)}
        opponentCustomDeck={rpgOpponent.deck}
        opponentName={rpgOpponent.name}
        language={language}
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
- `src/views/KadanRpgView.tsx` (lines 774–791):
  ```tsx
  {ambushBattle && createPortal(
    <div className="fixed inset-0 z-[99999] ...">
      <MobileCardPlayScreen
        isAdRemoved={isAdRemoved}
        playerDeck={getBuffedPlayerDeck(currentDeck)}
        opponentCustomDeck={ambushBattle.deck}
        opponentName={language === 'ko' ? `[기습] ${ambushBattle.name}` : `[Ambush] ${ambushBattle.nameEn}`}
        language={language}
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

### 1.2 `MobileCardPlayScreen.tsx` — Unconditional `onBack()` Execution on Auto-Close
- `src/views/MobileCardPlayScreen.tsx` (lines 1245–1269, 1281–1287):
  ```typescript
  const handleExitGame = useCallback(() => {
    playSound('tap');
    setRematchCountdown(null);
    setTutorialShopCountdown(null);
    setRankingSearchCountdown(null);
    if (gameOver && winner && recordMatchResult && !matchResultReported) {
      const calculatedResult: 'win' | 'loss' | 'draw' = winner === 'player' ? 'win' : (winner === 'ai' ? 'loss' : 'draw');
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

### 1.3 `useKadanRpgAutoRunner.ts` — Halts When `enabled === false`
- `src/hooks/useKadanRpgAutoRunner.ts` (lines 68–72):
  ```typescript
  useEffect(() => {
    if (!enabled) {
      setGuardedStep('paused');
      return;
    }
    ...
  ```
  In `KadanRpgView.tsx` line 526: `enabled: progress.autoMode`. As soon as `progress.autoMode` becomes `false`, the auto-runner transitions to `'paused'` and never executes subsequent steps.

### 1.4 Test Harness Deficiencies in Iteration 1
1. **`tests/e2e_rpg/tier1_feature_coverage.py`** (lines 901–921, `T1.F12.4`):
   ```python
   has_auto_battle_portal = (
       "autoCloseOnComplete" in rpg_view_src
       or "initialAutoBattle" in rpg_view_src
       or "autoPlay" in rpg_view_src
       or "MobileCardPlayScreen" in rpg_view_src
   )
   ```
   Tested only whether keywords existed in source strings. Never checked whether `onBack` in `MobileCardPlayScreen` disabled `autoMode`.
2. **`tests/e2e_rpg/helpers.py`** (lines 577–671, `RpgPlaythroughSimulator`):
   Did not maintain or assert `auto_mode` state. Completely decoupled from React callbacks; incremented victory counters without invoking simulated `onBack` callback contracts.
3. **`tests/adversarial_challenger_m4_empirical.ts`** (lines 90–235):
   Simulated chapter legs via standalone loops that modified mock state directly (`state.bossBattleCount++`) without asserting that `autoMode` remained `true` through portal unmounts.

### 1.5 Finding 2: Cascading State Updater in Ambush Alert Countdown
- `src/views/KadanRpgView.tsx` (lines 466–476):
  ```typescript
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
  `handleEngageAmbush()` triggers multiple state updates (`setAmbushBattle`, `setAmbushAlert`) from inside a React `setState` updater callback. This violates React 19 pure updater rules and risks concurrency tearing.

---

## 2. Logic Chain

1. In `MobileCardPlayScreen.tsx`, there is only a single exit pathway: `handleExitGame()`.
2. `handleExitGame()` is invoked by the automatic completion timer:
   `if (autoCloseOnComplete) setTimeout(() => handleExitGame(), 1600);`.
3. `handleExitGame()` records the match result (`recordMatchResult`) and then immediately invokes the `onBack()` prop.
4. In `KadanRpgView.tsx`, both the boss battle portal (line 753) and the ambush battle portal (line 787) provide:
   `onBack={() => { setBattleEvent(null); if (progress.autoMode) setAutoMode(false); }}`.
5. Therefore, whenever any auto-battle concludes and auto-closes normally via `autoCloseOnComplete`, `onBack()` is executed, and `progress.autoMode` is unconditionally toggled to `false`.
6. When `progress.autoMode` becomes `false`, `useKadanRpgAutoRunner` receives `enabled: false` and halts permanently in `'paused'`.
7. Consequence: Hands-free auto-progression is killed after the very first battle. The player is forced to manually tap the Auto-Play button again.
8. Requirement R4 of `ORIGINAL_REQUEST.md` mandates:
   *"100% of `/main` progresses hands-free without user intervention: Map movement, NPC/story dialogue lines, timed protagonist dialogue choices (auto-picked in 1.5s), random Bandit/Thief ambush alerts and 3x3 card battles, chapter boss/enemy battles, and reward collection modals all advance automatically ... zero manual clicks required."*
9. The defect was masked in Iteration 1 because the test suites (`run_rpg_e2e_tests.py` and `adversarial_challenger_m4_empirical.ts`) tested synthetic simulations where `autoMode` was never checked or affected by `onBack`.

---

## 3. Caveats

- In manual mode (`progress.autoMode === false`), `onBack` simply unmounts the battle portal (`setBattleEvent(null)` or `setAmbushBattle(null)`), returning the user to the map canvas. This is the desired manual behavior.
- If a user in Auto Mode deliberately clicks the back button during an active battle (aborting mid-match before `gameOver`), there are two valid design alternatives:
  - **Option A (Pure unmount)**: `onBack` only clears the portal state (`setBattleEvent(null)`). Auto Mode remains active and auto-runner resumes. If the user wants to stop Auto Mode, they use the dedicated `[PAUSE]` button.
  - **Option B (Ref-guarded unmount)**: Track match completion via `battleCompletedRef.current`. If `onBack` is called before match completion, toggle `autoMode: false`. If called after match completion, preserve `autoMode: true`.
  - Both options ensure normal auto-close preserves `autoMode: true`. Option A is simpler and free of ref-synchronization edge cases.

---

## 4. Conclusion & Concrete Design Proposals

### 4.1 Production Code Fix in `src/views/KadanRpgView.tsx`

#### Fix A: `onBack` Callbacks in Battle Portals (Lines 751–754 & 785–788)
```tsx
// Before (Lines 751-754)
onBack={() => {
  setBattleEvent(null);
  if (progress.autoMode) setAutoMode(false);
}}

// After (Lines 751-754)
onBack={() => {
  setBattleEvent(null);
}}
```
```tsx
// Before (Lines 785-788)
onBack={() => {
  setAmbushBattle(null);
  if (progress.autoMode) setAutoMode(false);
}}

// After (Lines 785-788)
onBack={() => {
  setAmbushBattle(null);
}}
```

#### Fix B: Ambush Countdown Pure Interval (Finding 2, Lines 464–478)
Align with `KadanNpcDialog.tsx` to eliminate side-effects inside `setState` updater:
```typescript
// Before
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

// After
const durationMs = 1000;
const deadline = Date.now() + durationMs;
setAmbushCountdown(1.0);

const intervalMs = 100;
const timer = window.setInterval(() => {
  const remainingMs = Math.max(0, deadline - Date.now());
  setAmbushCountdown(remainingMs / 1000);
  if (remainingMs <= 0) {
    window.clearInterval(timer);
    handleEngageAmbush();
  }
}, intervalMs);
```

---

### 4.2 Concrete Test Assertions for Test Suites

#### 1. Python Test Suite: `tests/e2e_rpg/tier1_feature_coverage.py`
Upgrade `T1.F12.4` and add `T1.F12.6` to verify the React callback contract and pure timer:
```python
# T1.F12.4: Battle Portal onBack Callback Contract & autoMode Preservation
t0 = time.perf_counter()
mobile_portal_matches = re.findall(r'<MobileCardPlayScreen[\s\S]*?/>', rpg_view_src)
assert len(mobile_portal_matches) >= 2, (
    f"Expected at least 2 MobileCardPlayScreen portals (boss and ambush), found {len(mobile_portal_matches)}"
)

auto_mode_preserved_in_all_portals = True
contract_violations: List[str] = []

for idx, portal_block in enumerate(mobile_portal_matches):
    on_back_match = re.search(r'onBack=\{([^}]+)\}', portal_block)
    if not on_back_match:
        auto_mode_preserved_in_all_portals = False
        contract_violations.append(f"Portal {idx}: missing onBack prop")
        continue

    on_back_code = on_back_match.group(1)
    if "setAutoMode(false)" in on_back_code:
        auto_mode_preserved_in_all_portals = False
        contract_violations.append(
            f"Portal {idx}: onBack violates contract by calling setAutoMode(false)! "
            "autoCloseOnComplete invokes onBack, which improperly terminates hands-free auto-play."
        )

results.append(
    TestResult(
        test_id="T1.F12.4",
        tier=1,
        feature="Feature 12: 100% Hands-Free Auto-Play",
        milestone="M4",
        name="Battle Portal onBack Callback Contract & autoMode Preservation",
        status="PASS" if auto_mode_preserved_in_all_portals else "FAIL",
        message=(
            "Both boss and ambush portals preserve autoMode: true upon battle auto-close"
            if auto_mode_preserved_in_all_portals
            else "; ".join(contract_violations)
        ),
        duration_ms=(time.perf_counter() - t0) * 1000,
    )
)

# T1.F12.6: Pure Ambush Alert Countdown Interval (React 19 Concurrency Compliance)
t0 = time.perf_counter()
has_impure_state_updater = bool(
    re.search(r'setAmbushCountdown\(\s*\([^)]*\)\s*=>[\s\S]*?handleEngageAmbush\(\)', rpg_view_src)
)

results.append(
    TestResult(
        test_id="T1.F12.6",
        tier=1,
        feature="Feature 12: 100% Hands-Free Auto-Play",
        milestone="M4",
        name="Ambush Countdown Pure Interval & Concurrency Compliance",
        status="PASS" if not has_impure_state_updater else "FAIL",
        message=(
            "handleEngageAmbush is called cleanly outside setState updater function"
            if not has_impure_state_updater
            else "handleEngageAmbush invoked inside setAmbushCountdown updater (React 19 violation)"
        ),
        duration_ms=(time.perf_counter() - t0) * 1000,
    )
)
```

#### 2. Python Simulator Upgrade: `tests/e2e_rpg/helpers.py` (`RpgPlaythroughSimulator`)
Add `self.auto_mode = True` and link battle completion directly to `KadanRpgView.tsx`'s actual `onBack` contract:
```python
class RpgPlaythroughSimulator:
    def __init__(self, rebirth_count: int = 0, rng_seed: int = 42):
        ...
        self.auto_mode = True
        self.stalled = False
        self.stall_reason: Optional[str] = None
        self._load_kadan_rpg_view_contract()

    def _load_kadan_rpg_view_contract(self):
        with open("src/views/KadanRpgView.tsx", "r", encoding="utf-8") as f:
            src = f.read()
        self.boss_on_back_disables_auto = bool(
            re.search(r'activeEncounter\s*&&\s*battleEvent[\s\S]*?onBack=\{[\s\S]*?setAutoMode\(false\)[\s\S]*?\}', src)
        )
        self.ambush_on_back_disables_auto = bool(
            re.search(r'ambushBattle[\s\S]*?onBack=\{[\s\S]*?setAutoMode\(false\)[\s\S]*?\}', src)
        )

    def simulate_chapter_leg(self, chapter: int) -> bool:
        if not self.auto_mode:
            self.stalled = True
            self.stall_reason = f"Auto-runner paused before Chapter {chapter} because autoMode is false"
            return False

        # Phase 1: Movement & Ambushes
        ...
        if should_ambush:
            ...
            # Simulate MobileCardPlayScreen autoCloseOnComplete -> handleExitGame -> onBack
            if self.ambush_on_back_disables_auto:
                self.auto_mode = False
                self.stalled = True
                self.stall_reason = f"Ambush battle onBack in Chapter {chapter} called setAutoMode(false)"
                return False

        # Phase 2: Choices (1.5s countdown)
        ...

        # Phase 3: Boss Battle
        ...
        # Simulate MobileCardPlayScreen autoCloseOnComplete -> handleExitGame -> onBack
        if self.boss_on_back_disables_auto:
            self.auto_mode = False
            self.stalled = True
            self.stall_reason = f"Boss battle onBack in Chapter {chapter} called setAutoMode(false)"
            return False

        return True
```
With this simulator upgrade, `T3.C1.1`, `T4.W1.1`, and `T4.W1.2` will automatically FAIL if either `onBack` callback contains `setAutoMode(false)`.

#### 3. TypeScript Empirical Challenger: `tests/adversarial_challenger_m4_empirical.ts`
1. Read `src/views/KadanRpgView.tsx` directly via `fs.readFileSync`.
2. Inspect both portal blocks for `setAutoMode(false)`.
3. In `runFull40ChapterAutonomousSimulation`:
   Track `state.autoMode = true`.
   Simulate battle exits through the actual contract.
   If `state.autoMode` becomes `false`, set `state.stalled = true`.
4. Add SECTION 7 assertions:
   ```typescript
   // --- SECTION 7: React Callback Contract & Consecutive Battle Verification ---
   const kadanViewSrc = fs.readFileSync('src/views/KadanRpgView.tsx', 'utf-8');
   const bossPortalMatch = kadanViewSrc.match(/activeEncounter\s*&&\s*battleEvent[\s\S]*?<MobileCardPlayScreen[\s\S]*?onBack=\{([\s\S]*?)\}[\s\S]*?\/>/);
   const ambushPortalMatch = kadanViewSrc.match(/ambushBattle[\s\S]*?<MobileCardPlayScreen[\s\S]*?onBack=\{([\s\S]*?)\}[\s\S]*?\/>/);

   const bossOnBackCode = bossPortalMatch ? bossPortalMatch[1] : '';
   const ambushOnBackCode = ambushPortalMatch ? ambushPortalMatch[1] : '';

   assert(
     'Callback Contract',
     'Boss battle onBack does not disable autoMode on auto-close',
     !bossOnBackCode.includes('setAutoMode(false)')
   );

   assert(
     'Callback Contract',
     'Ambush battle onBack does not disable autoMode on auto-close',
     !ambushOnBackCode.includes('setAutoMode(false)')
   );

   assert(
     'Consecutive Battle Chain',
     'AutoMode preserved across 40 consecutive chapters and ~50 battles without user clicks',
     simRebirth0.autoMode === true && !simRebirth0.stalled
   );
   ```

---

## 5. Verification Method

To independently verify the defect and test proposals:

1. **Verify Current Regression in `KadanRpgView.tsx`**:
   ```bash
   python3 -c "
   import re
   with open('src/views/KadanRpgView.tsx') as f:
       src = f.read()
   blocks = re.findall(r'<MobileCardPlayScreen[\s\S]*?/>', src)
   for i, b in enumerate(blocks):
       on_back = re.search(r'onBack=\{([\s\S]*?)\}', b)
       if on_back and 'setAutoMode(false)' in on_back.group(1):
           print(f'FAIL: Portal {i} onBack disables autoMode!')
       else:
           print(f'PASS: Portal {i} preserves autoMode')
   "
   ```
   *Expected Output before fix*:
   `FAIL: Portal 0 onBack disables autoMode!`
   `FAIL: Portal 1 onBack disables autoMode!`

2. **Verify Ambush Countdown State Updater Violation**:
   ```bash
   grep -n -C 5 "handleEngageAmbush()" src/views/KadanRpgView.tsx
   ```

3. **Verify Type-Safety & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

4. **Verify Test Suite Execution**:
   ```bash
   python3 tests/e2e_rpg/run_rpg_e2e_tests.py
   npx tsx tests/adversarial_challenger_m4_empirical.ts
   ```
