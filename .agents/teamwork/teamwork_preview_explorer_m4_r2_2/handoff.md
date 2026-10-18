# Milestone 4 Iteration 2 Explorer 2 Analysis Report
**Ambush Alert Countdown State Updater Cascading Side-Effects Fix**

- **Agent**: Explorer 2 (`teamwork_preview_explorer_m4_r2_2`)
- **Roles**: Investigator, Analyzer, Synthesizer
- **Milestone**: Milestone 4 Iteration 2 (100% Hands-Free Auto-Progression Mode & State Purity)
- **Target File**: `src/views/KadanRpgView.tsx` (lines 453–480)
- **Reference File**: `src/components/rpg/KadanNpcDialog.tsx` (lines 265–291)
- **Date**: 2026-10-18T21:54:30Z

---

## 1. Observation

Direct observations from codebase inspection, interface tracing, and timer pattern comparison:

### 1.1 Current Implementation in `src/views/KadanRpgView.tsx` (lines 453–480)
```tsx
useEffect(() => {
  if (!ambushAlert) {
    setAmbushCountdown(1.0);
    return;
  }

  if (!progress.autoMode) {
    setAmbushCountdown(1.0);
    return;
  }

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
}, [ambushAlert, handleEngageAmbush, progress.autoMode]);
```

### 1.2 Side-Effects Dispatched by `handleEngageAmbush` (lines 437–441)
```tsx
const handleEngageAmbush = useCallback(() => {
  if (!ambushAlert) return;
  setAmbushBattle(ambushAlert);
  setAmbushAlert(null);
}, [ambushAlert]);
```
- `handleEngageAmbush()` triggers two immediate React state updates: `setAmbushBattle(ambushAlert)` and `setAmbushAlert(null)`.
- In the current code (lines 470–472), `handleEngageAmbush()` and `window.clearInterval(timer)` are executed **inside** the functional updater callback passed to `setAmbushCountdown((prev) => { ... })`.

### 1.3 Clean Timer Pattern in `src/components/rpg/KadanNpcDialog.tsx` (lines 265–291)
```tsx
// Choice countdown timer: 5.0s manual / 1.5s auto
useEffect(() => {
  if (!hasActiveChoices || !currentChoices || currentChoices.length === 0) {
    setChoiceTimeLeftMs(0);
    return;
  }

  const duration = autoMode ? 1500 : 5000;
  setChoiceTotalDurationMs(duration);
  setChoiceTimeLeftMs(duration);

  const deadline = Date.now() + duration;

  const intervalId = window.setInterval(() => {
    const remaining = Math.max(0, deadline - Date.now());
    setChoiceTimeLeftMs(remaining);

    if (remaining <= 0) {
      window.clearInterval(intervalId);
      const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];
      handleSelectChoice(defaultChoice);
    }
  }, 50);

  return () => {
    window.clearInterval(intervalId);
  };
}, [autoMode, currentChoices, handleSelectChoice, hasActiveChoices, lineIndex]);
```

### 1.4 Downstream UI Consumption in `src/views/KadanRpgView.tsx` (lines 862–875)
```tsx
{progress.autoMode && (
  <div className="mb-4">
    <div className="flex justify-between text-[10px] text-amber-400/90 font-bold mb-1">
      <span>⚡ {language === 'ko' ? '자동 전투 개시 중...' : 'Engaging Auto-Battle...'}</span>
      <span>{Math.max(0, ambushCountdown).toFixed(1)}s</span>
    </div>
    <div className="h-1.5 w-full bg-stone-800 rounded-none overflow-hidden">
      <div 
        className="h-full bg-amber-400 transition-all duration-100 ease-linear"
        style={{ width: `${Math.max(0, Math.min(100, (ambushCountdown / 1.0) * 100))}%` }}
      />
    </div>
  </div>
)}
```
- `ambushCountdown` is consumed purely as a numeric progress indicator: text rendered via `.toFixed(1)s` and width percentage calculated via `(ambushCountdown / 1.0) * 100%`.

---

## 2. Logic Chain

1. **State Updater Purity Contract in React 19**:
   - In React (and especially under React 19 concurrent features and StrictMode), functional state updaters passed to `setState((prevState) => nextState)` must be strictly pure functions. They compute and return the next state value without side effects.
   - React reserves the right to invoke updater functions multiple times (StrictMode intentionally invokes updaters twice per render in development) or defer/replay them during concurrent lane reconciliations.

2. **Consequences of Side-Effects Inside `setAmbushCountdown`**:
   - In `KadanRpgView.tsx` lines 470–472, `handleEngageAmbush()` is called inside the updater.
   - If React invokes the updater twice or replays it, `handleEngageAmbush()` is called twice, triggering duplicate state dispatches: `setAmbushBattle` and `setAmbushAlert(null)`.
   - Dispatching new state updates (`setAmbushBattle` and `setAmbushAlert`) while React is still executing a state updater for `setAmbushCountdown` violates React's dispatch queue protocol and risks state tearing, race conditions, or warning logs regarding updating state while rendering or updating an active component.
   - Furthermore, `window.clearInterval(timer)` is executed inside the updater closure. If the updater function is aborted or rolled back, the interval timer would have already been cleared imperatively, corrupting the timer lifecycle.

3. **Timer Drift and Frame Rate Independence**:
   - The current code subtracts a static constant (`intervalMs / 1000 = 0.1s`) on every interval tick.
   - If browser scheduling is throttled (e.g. background tab, mobile CPU power-saving, heavy main-thread rendering), `setInterval` ticks may occur late (e.g., every 300ms–500ms).
   - Under arithmetic delta subtraction, 10 ticks would take 3–5 seconds of real wall-clock time rather than 1.0 second.
   - By contrast, `KadanNpcDialog.tsx` uses absolute wall-clock deadline tracking (`deadline = Date.now() + duration; remaining = Math.max(0, deadline - Date.now())`), guaranteeing exact 1.0-second auto-engagement regardless of timer throttling.

4. **Architectural Separation in `KadanNpcDialog.tsx`**:
   - `KadanNpcDialog.tsx` separates state updating from side-effect execution:
     a) `setChoiceTimeLeftMs(remaining)` is called directly with the calculated numeric primitive value. No updater callback is used.
     b) Condition evaluation `if (remaining <= 0)` is performed in the interval callback body at the top level.
     c) `window.clearInterval(intervalId)` and `handleSelectChoice(...)` are executed directly within the browser timer callback, completely independent of React's pure state updater pipeline.

---

## 3. Caveats

1. **Manual Mode Invariant**:
   - In manual mode (`progress.autoMode === false`), the countdown timer must not run, and `ambushCountdown` must remain pinned at `1.0`. The early exit guard `if (!ambushAlert || !progress.autoMode)` ensures this behavior is preserved without deviation.
2. **User Preemption (Manual Retreat / Manual Engage)**:
   - If the player manually clicks `[후퇴하기 (RETREAT)]` or `[전투 개시 (ENGAGE BATTLE)]` before the 1.0s countdown reaches 0:
     - `handleRetreatAmbush` or `handleEngageAmbush` will set `ambushAlert` to `null`.
     - When `ambushAlert` becomes `null`, the `useEffect` cleanup function runs immediately, clearing the active `intervalId`.
     - To prevent any edge-case microtask race condition where an interval tick fires in the exact same event loop cycle as a manual click, an idempotent boolean guard (`hasEngaged = true`) should be maintained inside the effect scope.
3. **No Caveats Beyond Scope**:
   - The scope of this fix is strictly contained within `src/views/KadanRpgView.tsx` (lines 453–480). It does not alter public interfaces, props, or data contracts.

---

## 4. Conclusion & Concrete Recommendations for Worker 4

### 4.1 Recommended Implementation
Replace lines 453–480 in `src/views/KadanRpgView.tsx` with the following clean, deadline-based pattern:

```tsx
  // Ambush Alert countdown timer: 1.0s auto-engagement in autoMode
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
      const remainingSec = remainingMs / 1000;
      setAmbushCountdown(remainingSec);

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

### 4.2 Key Engineering Benefits for Worker 4
1. **Zero Side-Effects Inside State Updaters**: `setAmbushCountdown(remainingSec)` receives a plain numeric value. The updater function `(prev) => ...` is completely eliminated.
2. **Outside Execution of Action**: `handleEngageAmbush()` is called directly inside the interval callback body, ensuring 100% compliance with React 19 pure updater guidelines.
3. **Double-Invocation Protection**: `let hasEngaged = false;` guarantees that `handleEngageAmbush()` can never be invoked more than once per encounter, even under browser event-loop jitter.
4. **Wall-Clock Precision**: Using `Date.now()` prevents timer drift on low-power or throttled devices.
5. **Fluid Animation (20 FPS)**: The 50ms interval interval matches `KadanNpcDialog.tsx` and produces twice as smooth progress bar rendering compared to the legacy 100ms interval.

---

## 5. Verification Method

To independently verify this fix:

1. **Static Analysis & Inspection**:
   ```bash
   # Confirm no state setters or clearInterval remain inside setAmbushCountdown
   grep -n -C 10 "setAmbushCountdown" src/views/KadanRpgView.tsx
   ```

2. **TypeScript Compilation & Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   - Criteria: Exit code 0, 0 type errors, 0 bundling warnings related to circular state updates.

3. **E2E Design System & Touch Target Verification**:
   ```bash
   python3 tests/e2e_design_system/run_all_e2e_tests.py
   ```
   - Criteria: 377/377 assertions pass (100% compliance).

4. **RPG Autonomous Regression Test Suite**:
   ```bash
   python3 tests/e2e_rpg/run_rpg_e2e_tests.py
   ```
   - Criteria: 51/51 assertions pass.
