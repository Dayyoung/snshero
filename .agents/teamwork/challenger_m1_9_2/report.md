# Empirical Adversarial Challenge Report — Milestone 1 (Idle Auto-Play & Boundaries)

- **Challenger**: `challenger_m1_9_2` (Challenger 2)
- **Role**: Empirical Challenger (critic, specialist)
- **Target**: Milestone 1 (Hash Routing Core & Global 15s Idle Auto-Play Transition)
- **Worker Report Reviewed**: `worker_m1_9/handoff.md`
- **Date**: 2026-11-02T08:28:00Z
- **Verdict**: **APPROVE**
- **Overall Risk Assessment**: **LOW**

---

## 1. Challenge Summary

Challenger 2 conducted an empirical adversarial stress test targeting the boundary conditions, event concurrency, high-frequency event storm resilience, and storage/event dispatch contracts of the Milestone 1 Idle Auto-Play implementation (`src/landing/services/idleAutoPlayManager.ts`).

A dedicated, comprehensive adversarial test harness was authored and executed at `tests/adversarial_m1_challenger2.ts`, executing **38 rigorous assertions** across 10 critical challenge dimensions. All 38 assertions passed (**100.0% pass rate**), proving that the implementation is mathematically exact at the millisecond boundary, robust under high-polling event floods, and clean in resource cleanup.

---

## 2. Adversarial Challenges & Findings

### Challenge 1: High-Frequency Input Event Storm (500 events/sec) & 250ms Throttle
- **Assumption Challenged**: Rapid input events (such as 120Hz/240Hz gaming mouse movement or high-rate drag gestures) could overwhelm the JavaScript timer queue with thousands of `setTimeout`/`clearTimeout` calls, causing GC stutter, CPU thrashing, or drifted idle timers.
- **Attack Scenario**: Subject the `IdleAutoPlayManager` to 1,000 rapid input events over 2,000ms (1 event every 2ms, spanning all 8 monitored event types) during active monitoring.
- **Observed Behavior**:
  - The 250ms throttle (`now - this.lastResetTime < this.throttleMs`) successfully intercepted 99.2% of events.
  - Over 1,000 events across 2,000ms, `scheduleTimer` was invoked exactly **8 times** (expected: 7..12 calls; ratio: 0.80%), completely eliminating timer churn.
  - Crucially, `lastActivityTime` was updated on every event, ensuring that when the storm halted at t=2,000ms, the subsequent idle countdown was measured from the true last event (t=2,000ms).
  - Post-storm verification confirmed: auto-play did NOT fire at t=16,999ms (14,999ms post-storm), and fired cleanly at t=17,000ms (exact 15,000ms post-storm).
- **Result**: **PASS** (Zero event flood, zero timer drift).

### Challenge 2: Exact Millisecond Boundary Testing (14,999ms vs 15,000ms)
- **Assumption Challenged**: Off-by-one errors in `Date.now()` differences (`>` vs `>=`) or timer scheduling could trigger transition prematurely at 14,999ms or delay beyond 15,000ms.
- **Attack Scenario**: Controlled virtual clock advanced to exactly t=14,999ms, inspected state, and then advanced by 1ms to t=15,000ms.
- **Observed Behavior**:
  - At t=14,999ms: `getRemainingTimeMs()` returned exactly `1`. `triggerCount` remained `0`, `hero_kadan_rpg_auto_mode` remained unset.
  - At t=15,000ms: `onTimerExpired()` detected `elapsedSinceActivity >= 15000` (15000ms elapsed), dispatched `snshero_idle_autoplay_triggered`, committed `hero_kadan_rpg_auto_mode = 'true'`, and executed navigation.
- **Result**: **PASS** (14,999ms does not trigger; 15,000ms strictly triggers).

### Challenge 3: User Activity at 14,900ms (Last-Second Cancellation & 15s Extension)
- **Assumption Challenged**: User activity occurring just 100ms before expiration might suffer race conditions or fail to clear the existing scheduled timer.
- **Attack Scenario**: Clock advanced to t=14,900ms (100ms before timeout). User dispatched a `keydown` event. Clock advanced through the original t=15,000ms mark, to t=29,899ms, and then to t=29,900ms.
- **Observed Behavior**:
  - At t=14,900ms, remaining time immediately reset from 100ms to 15,000ms.
  - At t=15,000ms (the original deadline), `clearTimeout` ensured 0 triggers occurred.
  - At t=29,899ms (14,999ms after the user interaction), auto-play had NOT triggered (`remaining = 1ms`).
  - At t=29,900ms (exactly 15,000ms post-interaction), auto-play triggered.
- **Result**: **PASS** (Timer cancelled and cleanly extended by 15s).

### Challenge 4: Throttled Activity Tail-Window Rescheduling Accuracy
- **Assumption Challenged**: If a user interacts during the 250ms throttle window (e.g., at t=100ms), `scheduleTimer` is not invoked. When the original timer fires at t=15,000ms, could it prematurely trigger auto-play even though only 14,900ms have elapsed since the user's last activity?
- **Attack Scenario**: Start at t=0. Dispatch user interaction at t=100ms (within throttle window). Advance clock to t=15,000ms.
- **Observed Behavior**:
  - In `onTimerExpired()`, `elapsedSinceActivity` was computed: `15000 - 100 = 14900ms < 15000ms`.
  - The manager detected that 100ms remained (`this.timeoutMs - elapsedSinceActivity`), and rescheduled the timer for the remaining 100ms instead of transitioning.
  - At t=15,099ms, auto-play had not triggered.
  - At t=15,100ms (exactly 15,000ms after the throttled t=100ms event), auto-play triggered.
- **Result**: **PASS** (Dual-timestamp verification prevents premature trigger during throttle window).

### Challenge 5: LocalStorage Persistence (4 Flags) & CustomEvent Dispatching
- **Assumption Challenged**: Auto-play activation might only write the primary key, omitting secondary season/auto-loop flags, or crash on storage exceptions (`QuotaExceededError`).
- **Attack Scenario**: Verify all 4 storage flags upon expiration. Also force `localStorage.setItem` to throw `QuotaExceededError`.
- **Observed Behavior**:
  - All 4 keys are set synchronously: `hero_kadan_rpg_auto_mode = 'true'`, `hero_kadan_rpg_auto_mode_season1 = 'true'`, `hero_auto_battle = 'true'`, `hero_auto_loop_mode = 'true'`.
  - Dispatches `hero_kadan_rpg_auto_mode_updated` with `{ detail: { autoMode: true } }`.
  - Dispatches `snshero_idle_autoplay_triggered` with timestamp, `targetUrl`, and `fromUrl`.
  - Under `QuotaExceededError`, `commitAutoModeFlags` wraps storage writes in `try/catch`, logging a warning without throwing or halting the application.
- **Result**: **PASS**.

### Challenge 6: Screen Disambiguation & Re-entrance Protection
- **Assumption Challenged**: If the user is already on `#play`, triggering auto-play could cause an infinite page reload loop or destroy the active tile map session.
- **Attack Scenario**: Evaluate transitions when:
  1. Already on `#play` with `autoMode` active.
  2. Already on `#play` with `autoMode` inactive.
  3. On `localhost` development environment.
- **Observed Behavior**:
  - Already on `#play` with auto-mode active: Bypasses reload, restarts timer seamlessly.
  - Already on `#play` with auto-mode inactive: Activates auto-mode in place with zero reload.
  - Localhost development: Falls back to relative `#play` hash rather than attempting external Tailscale redirect, preserving local developer server continuity.
- **Result**: **PASS**.

### Challenge 7: Tab Visibility Resynchronization
- **Assumption Challenged**: If the user switches tabs for >15 seconds and returns, an instant jarring redirect could trigger immediately upon tab focus.
- **Attack Scenario**: Advance idle clock by 10,000ms, then dispatch `document.visibilitychange` (`visible`).
- **Observed Behavior**:
  - `handleVisibilityChange` detects tab visibility restoration and calls `resetTimer()`, giving the user a fresh 15,000ms grace period.
- **Result**: **PASS**.

### Challenge 8: Idempotency & Listener Cleanup
- **Assumption Challenged**: Multiple calls to `start()` (e.g. from both `src/main.tsx` and `src/landing/index.ts`) could attach duplicate event listeners causing memory leaks.
- **Attack Scenario**: Invoke `manager.start()` 5 times consecutively, then invoke `manager.stop()`.
- **Observed Behavior**:
  - `isTracking` guard ensures exactly 8 event listeners are attached once. Consecutive `start()` calls attach 0 duplicate listeners.
  - `manager.stop()` cleanly removes all 8 window event listeners and the document visibility listener (0 listener leakage).
- **Result**: **PASS**.

### Challenge 9: Exhaustive Verification of All 8 Input Event Types
- **Assumption Challenged**: Some event types (e.g. `pointerdown` or `wheel` or `touchstart`) might not be properly monitored or might fail to reset the timer.
- **Attack Scenario**: Tested each of the 8 event types individually (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`).
- **Observed Behavior**:
  - Every single event type individually and independently resets the countdown timer from 14,000ms back to 15,000ms.
- **Result**: **PASS** (8/8 events verified).

### Challenge 10: Real Wall-Clock Asynchronous Event Loop Concurrency
- **Assumption Challenged**: Behavior observed in the virtual clock harness might diverge from the real Node.js / browser asynchronous event loop.
- **Attack Scenario**: Restored genuine Node.js runtime timers (`setTimeout` and `Date.now()`). Executed real-time asynchronous test with `timeoutMs: 60ms`, `throttleMs: 15ms`, user reset at 30ms, and verified trigger at 105ms.
- **Observed Behavior**:
  - Did not trigger at 30ms.
  - Mid-point at 70ms: cancelled and not triggered.
  - Post-expiration at 105ms: triggered reliably.
- **Result**: **PASS**.

---

## 3. Stress Test Results Summary

| Assertion ID | Category | Description | Result |
|---|---|---|---|
| `CH2-STORM-1` | Throttle Concurrency | 250ms throttle restricts timer rescheduling during 500 events/sec storm | **PASS** |
| `CH2-STORM-2` | Post-Storm Idle Count | Auto-play does NOT trigger at 14,999ms post-storm | **PASS** |
| `CH2-STORM-3` | Post-Storm Exact Expiration | Auto-play triggers at exact 15,000ms post-storm | **PASS** |
| `CH2-BOUND-1` | Boundary Precision | Initial remaining time is 15,000ms | **PASS** |
| `CH2-BOUND-2` | Boundary Precision | 14,999ms boundary: MUST NOT trigger auto-play | **PASS** |
| `CH2-BOUND-3` | Boundary Precision | 15,000ms boundary: MUST trigger auto-play and navigate | **PASS** |
| `CH2-RESET-1` | Last-Second Interaction | At 14,900ms, timer is active and has not triggered | **PASS** |
| `CH2-RESET-2` | Last-Second Interaction | User interaction at 14,900ms resets remaining time to 15,000ms | **PASS** |
| `CH2-RESET-3` | Last-Second Interaction | At 15,000ms, auto-play is CANCELLED and does NOT trigger | **PASS** |
| `CH2-RESET-4` | Last-Second Interaction | At 29,899ms (14,999ms post-reset), auto-play has NOT triggered | **PASS** |
| `CH2-RESET-5` | Last-Second Interaction | At 29,900ms (exactly 15,000ms post-reset), auto-play MUST trigger | **PASS** |
| `CH2-THROTTLE-TAIL-1` | Throttle Tail Accuracy | Throttled tail event prevents early trigger and reschedules | **PASS** |
| `CH2-THROTTLE-TAIL-2` | Throttle Tail Accuracy | At 15,099ms (14,999ms since throttled activity), NOT triggered | **PASS** |
| `CH2-THROTTLE-TAIL-3` | Throttle Tail Accuracy | At 15,100ms (15,000ms since throttled activity), MUST trigger | **PASS** |
| `CH2-STORAGE-1` | Storage Persistence | All 4 auto-play persistence flags written to localStorage | **PASS** |
| `CH2-EVENT-1` | CustomEvent Dispatch | `hero_kadan_rpg_auto_mode_updated` dispatched with `{ autoMode: true }` | **PASS** |
| `CH2-EVENT-2` | CustomEvent Dispatch | `snshero_idle_autoplay_triggered` dispatched with targetUrl and timestamp | **PASS** |
| `CH2-STORAGE-2` | Storage Resilience | Storage QuotaExceededError does NOT crash or unhandle exception | **PASS** |
| `CH2-ROUTE-1` | Redundant Reload Guard | On #play with auto-mode active, avoid redundant reload/navigation | **PASS** |
| `CH2-ROUTE-2` | In-Place Activation | On #play without auto-mode, activate in-place without page reload | **PASS** |
| `CH2-ROUTE-3` | Localhost Fallback | On localhost, fallback to relative hash #play | **PASS** |
| `CH2-VIS-1` | Visibility Sync | Idle time accumulates normally during active tab | **PASS** |
| `CH2-VIS-2` | Visibility Sync | Tab return resets timer to 15,000ms | **PASS** |
| `CH2-VIS-3` | Visibility Sync | Auto-play does NOT trigger at 14,999ms post-visibility reset | **PASS** |
| `CH2-VIS-4` | Visibility Sync | Auto-play triggers at 15,000ms post-visibility reset | **PASS** |
| `CH2-IDEMP-1` | Idempotent Start | Multiple `start()` calls attach listeners exactly once | **PASS** |
| `CH2-IDEMP-2` | Clean Stop Cleanup | `stop()` removes all 8 window listeners and visibility listener | **PASS** |
| `CH2-EVENT-TYPE-mousemove` | Event Type Coverage | `mousemove` cleanly resets idle timer | **PASS** |
| `CH2-EVENT-TYPE-mousedown` | Event Type Coverage | `mousedown` cleanly resets idle timer | **PASS** |
| `CH2-EVENT-TYPE-keydown` | Event Type Coverage | `keydown` cleanly resets idle timer | **PASS** |
| `CH2-EVENT-TYPE-touchstart` | Event Type Coverage | `touchstart` cleanly resets idle timer | **PASS** |
| `CH2-EVENT-TYPE-touchmove` | Event Type Coverage | `touchmove` cleanly resets idle timer | **PASS** |
| `CH2-EVENT-TYPE-scroll` | Event Type Coverage | `scroll` cleanly resets idle timer | **PASS** |
| `CH2-EVENT-TYPE-pointerdown` | Event Type Coverage | `pointerdown` cleanly resets idle timer | **PASS** |
| `CH2-EVENT-TYPE-wheel` | Event Type Coverage | `wheel` cleanly resets idle timer | **PASS** |
| `CH2-REAL-CLOCK-1` | Real Wall-Clock Concurrency | Real clock does not trigger prematurely at 30ms | **PASS** |
| `CH2-REAL-CLOCK-2` | Real Wall-Clock Concurrency | Real clock interaction at 30ms cancels trigger at 60ms | **PASS** |
| `CH2-REAL-CLOCK-3` | Real Wall-Clock Concurrency | Real clock triggers reliably after reset expiration | **PASS** |

**Summary**: 38 executed, 38 passed, 0 failed (100.0% pass rate).

---

## 4. Build & Production Verification

- `npx tsc --noEmit`: 0 errors (Exit code 0).
- `npm run build`: Production bundle succeeded with exit code 0 (`dist/index.html` built, 60 static route fallback stubs generated).
- `npx tsx tests/e2e/run_all.ts --milestone M1`: 16/16 assertions PASS (100.0%).
- `npx tsx tests/adversarial_m1_challenger2.ts`: 38/38 assertions PASS (100.0%).

---

## 5. Explicit Verdict

**APPROVE**

Milestone 1's Idle Auto-Play Transition and Hash Routing Core are thoroughly validated, empirically sound, and free of boundary or concurrency defects.
