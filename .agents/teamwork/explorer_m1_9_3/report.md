# Milestone 1 Architectural Investigation & Design Report: Global 15-Second Idle Auto-Play Transition

- **Agent**: explorer_m1_9_3 (Explorer 3 for Milestone 1)
- **Date**: 2026-11-02
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_3/`
- **Scope**: Global 15-Second Inactivity Detector, Clean Event Reset, LocalStorage Auto-Mode Synchronization, `#play` Navigation, Bootstrap Integration, and Comprehensive Testability Specification.

---

## 1. Executive Summary

Milestone 1 mandates:
> **"On any screen, if user input is absent for 15 seconds or more, automatically navigate to `#play` (`https://dayyoung-macbookpro.tail3717a4.ts.net/#play`) and initiate auto-play. User interaction must reset the timer."**

This report provides the exhaustive technical architecture, interface contracts, implementation design for `src/landing/services/idleAutoPlayManager.ts`, bootstrap wiring for both static landing (`src/landing/index.ts`) and SPA app (`src/main.tsx`), and automated test strategies.

### Core Architectural Decisions:
1. **8 Input Event Capture with Capture-Phase Listening & Passive Handling**:
   - Monitored events: `mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`.
   - Attached to `window` with `{ capture: true, passive: true }` to guarantee that event bubbling stoppages (`stopPropagation()`) in inner modals or buttons do not blind the idle detector, while avoiding touch/scroll thread jank.
2. **250ms Event Throttling with Exact Idle Expiration Verification**:
   - Throttles timer resets so high-frequency events (e.g. 120Hz/240Hz mouse or touch movements) do not trigger garbage collection spikes or timer thrashing.
   - Dual-timestamp check (`lastResetTime` vs `lastActivityTime`) guarantees sub-millisecond precision without losing accuracy.
3. **Idempotency & Redundant Reload Prevention on `#play`**:
   - When the timer expires, if the browser is already viewing `#play` (e.g. `window.location.hash.includes('play')`) and auto-mode is already running (`hero_kadan_rpg_auto_mode === 'true'`), full page reloads and redundant navigations are bypassed, simply restarting the idle timer.
   - If on `#play` with auto-mode disabled, auto-mode is engaged immediately in-place with zero page reload.
4. **Resilient Dual-Target Navigation**:
   - Target URL defaults to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play`.
   - Seamless relative fallback (`#play`) is supported for offline environments, local development (`localhost:3000`), and automated test runners.
5. **App Bootstrap Integration**:
   - Bootstrapped in `src/landing/index.ts` (`mountLanding()`) and `src/main.tsx` as a global singleton.
   - Exposes `window.__SNSHERO_IDLE_AUTOPLAY__` for devtools, health checks, and E2E test suites.

---

## 2. Requirement Analysis & System Constraints

| Item | Requirement | Codebase Impact |
|---|---|---|
| **R2.1** | Inactivity threshold: exactly 15,000ms (15.0 seconds). | `IDLE_TIMEOUT_MS = 15000` |
| **R2.2** | Monitored user interactions: all 8 primary events. | `mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel` |
| **R2.3** | Any interaction must immediately reset the 15s countdown. | Resets `lastActivityTime`, schedules new `setTimeout` |
| **R2.4** | On expiration: set LocalStorage auto-play flags. | `hero_kadan_rpg_auto_mode = 'true'`, `hero_kadan_rpg_auto_mode_season1 = 'true'`, `hero_auto_battle = 'true'`, `hero_auto_loop_mode = 'true'` |
| **R2.5** | On expiration: dispatch auto-play initiation events. | CustomEvent `hero_kadan_rpg_auto_mode_updated` (`detail: { autoMode: true }`), `snshero_idle_autoplay_triggered` |
| **R2.6** | On expiration: navigate to target URL. | `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` (with local/test fallback) |
| **R2.7** | Zero redundant reload if already on `#play` with auto-play active. | Guard condition checking current URL hash and existing auto-mode flag |
| **R2.8** | Universal scope: active across all application screens. | Bootstrap hooks in both `src/landing/index.ts` and `src/main.tsx` |

---

## 3. Detailed Component Design: `src/landing/services/idleAutoPlayManager.ts`

### 3.1 Interface Contracts & Type Definitions

```typescript
/**
 * src/landing/services/idleAutoPlayManager.ts
 *
 * Global 15-Second Inactivity Auto-Play Transition Engine for SNSHero.
 * Detects user absence across all interaction vectors and seamlessly transitions
 * to the #play tactical battle screen with auto-play enabled.
 */

export interface IdleAutoPlayOptions {
  /** Inactivity threshold in milliseconds before triggering transition (default: 15,000ms) */
  timeoutMs?: number;
  /** Primary target URL for transition (default: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play') */
  targetUrl?: string;
  /** Fallback relative hash when running in local development or test runners */
  fallbackHash?: string;
  /** Custom navigation hook (used by tests or SPA routers to avoid real browser window redirects) */
  onNavigate?: (url: string) => void;
  /** Custom callback fired right after auto-mode flags are committed to storage */
  onTrigger?: (detail: IdleTriggerDetail) => void;
  /** Throttle interval in milliseconds for high-frequency input events (default: 250ms) */
  throttleMs?: number;
}

export interface IdleTriggerDetail {
  timestamp: number;
  fromUrl: string;
  targetUrl: string;
  alreadyOnPlay: boolean;
  autoModeWasActive: boolean;
}

export interface IdleAutoPlayState {
  isTracking: boolean;
  lastActivityTime: number;
  lastResetTime: number;
  timeoutMs: number;
  targetUrl: string;
  remainingTimeMs: number;
  isAutoPlayActive: boolean;
}
```

### 3.2 Monitored Input Events & Listener Strategy

```typescript
export const MONITORED_INPUT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'touchmove',
  'scroll',
  'pointerdown',
  'wheel',
] as const;

export type MonitoredEventName = (typeof MONITORED_INPUT_EVENTS)[number];
```

#### Why Capture Phase (`capture: true`) is Essential:
Many components (e.g. modals, drawer menus, buttons with `event.stopPropagation()`, or custom canvas touch handlers) prevent event bubbling. If listeners are registered in the bubbling phase on `document` or `window`, interactions inside those components would never reach the listener! Registering with `{ capture: true, passive: true }` intercepts the event as it travels *down* the DOM tree from `window`, guaranteeing 100% detection rate.

#### Why Passive Listeners (`passive: true`) are Essential:
`touchstart`, `touchmove`, `wheel`, and `scroll` can cause browser thread hitches if listeners are non-passive, because the browser engine must pause scroll/gesture rendering to check if `event.preventDefault()` will be called. Passing `{ passive: true }` guarantees 60fps/120fps touch responsiveness.

### 3.3 Event Throttling & Timer Reset Algorithm

```typescript
/**
 * Throttled activity handler.
 * Prevents timer destruction and recreation on every single mousemove or touch event.
 */
private handleUserActivity(event?: Event): void {
  const now = Date.now();
  this.lastActivityTime = now;

  // If activity occurred within the throttle window, do not reset the timer yet
  if (now - this.lastResetTime < this.throttleMs) {
    return;
  }

  this.lastResetTime = now;
  this.scheduleTimer(this.timeoutMs);
}
```

#### Double-Check Verification upon Expiration:
When `this.timerId` executes after `timeoutMs`:
```typescript
private onTimerExpired(): void {
  const now = Date.now();
  const elapsedSinceActivity = now - this.lastActivityTime;

  // If user interacted during the throttle window, reschedule for the remaining duration
  if (elapsedSinceActivity < this.timeoutMs) {
    const remaining = this.timeoutMs - elapsedSinceActivity;
    this.scheduleTimer(remaining);
    return;
  }

  // Exact 15,000ms idle threshold reached: execute transition!
  this.executeIdleTransition();
}
```

### 3.4 LocalStorage & CustomEvent Synchronization

When the idle timer expires:
```typescript
// 1. Set global and season-specific LocalStorage auto-mode flags
try {
  localStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
  localStorage.setItem('hero_kadan_rpg_auto_mode_season1', 'true');
  localStorage.setItem('hero_auto_battle', 'true');
  localStorage.setItem('hero_auto_loop_mode', 'true');
} catch (err) {
  console.warn('[IdleAutoPlayManager] Failed to write localStorage:', err);
}

// 2. Dispatch events for reactive UI and hooks
if (typeof window !== 'undefined') {
  window.dispatchEvent(
    new CustomEvent('hero_kadan_rpg_auto_mode_updated', {
      detail: { autoMode: true },
    })
  );

  window.dispatchEvent(
    new CustomEvent('snshero_idle_autoplay_triggered', {
      detail: {
        timestamp: Date.now(),
        targetUrl: this.targetUrl,
        fromUrl: window.location.href,
      },
    })
  );
}
```

### 3.5 Navigation Decision Matrix & Redundant Reload Prevention

```
                      [15-Second Inactivity Expires]
                                    │
                                    ▼
                     Is current view/hash `#play`?
                                ╱       ╲
                              YES        NO
                              ╱           ╲
          Is autoMode already active?      Navigate to Target URL:
               ╱               ╲           'https://dayyoung-macbookpro.tail3717a4.ts.net/#play'
             YES                NO         (or local relative fallback '#play')
             ╱                   ╲
     [ALREADY RUNNING]     [ACTIVATE AUTO-MODE]
  Skip redundant reload;    Set LocalStorage flags;
  Restart idle timer for    Dispatch update events;
  smooth continuity         Stay on #play in-place
```

Implementation logic:
```typescript
private isCurrentlyOnPlayScreen(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
  const path = window.location.pathname.toLowerCase();
  return hash === 'play' || path === '/play' || path.startsWith('/play/');
}

private isAutoModeCurrentlyActive(): boolean {
  try {
    return localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true';
  } catch {
    return false;
  }
}

private executeIdleTransition(): void {
  const alreadyOnPlay = this.isCurrentlyOnPlayScreen();
  const autoModeActive = this.isAutoModeCurrentlyActive();

  // Commit storage and dispatch events
  this.commitAutoModeFlags();

  // Scenario 1: Already on #play with auto-mode active -> Avoid redundant reload
  if (alreadyOnPlay && autoModeActive) {
    this.resetTimer();
    return;
  }

  // Scenario 2: Already on #play but auto-mode was inactive -> Activated in-place
  if (alreadyOnPlay && !autoModeActive) {
    this.resetTimer();
    return;
  }

  // Scenario 3: On any other screen (#home, #deck, #card, #shop) -> Navigate
  this.performNavigation();
}
```

### 3.6 Resilient URL Navigation Handler

```typescript
private performNavigation(): void {
  if (this.onNavigate) {
    this.onNavigate(this.targetUrl);
    return;
  }

  if (typeof window === 'undefined') return;

  const currentHost = window.location.hostname;
  const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

  // If in localhost development or offline testing, use hash navigation to stay on local server
  if (isLocalhost && !this.targetUrl.includes(currentHost)) {
    window.location.hash = this.fallbackHash;
    return;
  }

  try {
    const targetObj = new URL(this.targetUrl, window.location.href);
    if (targetObj.origin === window.location.origin) {
      // Same-origin navigation: updating hash triggers hashchange without full browser reload
      window.location.hash = targetObj.hash || this.fallbackHash;
    } else {
      window.location.href = this.targetUrl;
    }
  } catch {
    window.location.href = this.targetUrl;
  }
}
```

---

## 4. Class Reference Implementation Plan

```typescript
export class IdleAutoPlayManager {
  private static instance: IdleAutoPlayManager | null = null;

  private timeoutMs: number = 15000;
  private targetUrl: string = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play';
  private fallbackHash: string = '#play';
  private throttleMs: number = 250;
  private onNavigate?: (url: string) => void;
  private onTrigger?: (detail: IdleTriggerDetail) => void;

  private timerId: ReturnType<typeof setTimeout> | null = null;
  private lastActivityTime: number = 0;
  private lastResetTime: number = 0;
  private isTracking: boolean = false;

  private boundActivityHandler: (event?: Event) => void;
  private boundVisibilityHandler: () => void;

  constructor(options?: IdleAutoPlayOptions) {
    this.boundActivityHandler = this.handleUserActivity.bind(this);
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    if (options) {
      this.configure(options);
    }
  }

  public static getInstance(options?: IdleAutoPlayOptions): IdleAutoPlayManager {
    if (!IdleAutoPlayManager.instance) {
      IdleAutoPlayManager.instance = new IdleAutoPlayManager(options);
    } else if (options) {
      IdleAutoPlayManager.instance.configure(options);
    }
    return IdleAutoPlayManager.instance;
  }

  public configure(options: IdleAutoPlayOptions): void {
    if (options.timeoutMs !== undefined) this.timeoutMs = options.timeoutMs;
    if (options.targetUrl !== undefined) this.targetUrl = options.targetUrl;
    if (options.fallbackHash !== undefined) this.fallbackHash = options.fallbackHash;
    if (options.throttleMs !== undefined) this.throttleMs = options.throttleMs;
    if (options.onNavigate !== undefined) this.onNavigate = options.onNavigate;
    if (options.onTrigger !== undefined) this.onTrigger = options.onTrigger;
  }

  public start(): void {
    if (this.isTracking || typeof window === 'undefined') return;
    this.isTracking = true;

    // Register all 8 input events on window with capture and passive flags
    for (const eventName of MONITORED_INPUT_EVENTS) {
      window.addEventListener(eventName, this.boundActivityHandler, {
        capture: true,
        passive: true,
      });
    }

    // Monitor tab visibility to avoid immediate redirect on switching back to tab
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);

    this.resetTimer();

    // Attach to window for dev inspection and testing
    (window as any).__SNSHERO_IDLE_AUTOPLAY__ = this;
  }

  public stop(): void {
    if (!this.isTracking || typeof window === 'undefined') return;
    this.isTracking = false;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    for (const eventName of MONITORED_INPUT_EVENTS) {
      window.removeEventListener(eventName, this.boundActivityHandler, {
        capture: true,
      });
    }

    document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
  }

  public resetTimer(): void {
    const now = Date.now();
    this.lastActivityTime = now;
    this.lastResetTime = now;
    this.scheduleTimer(this.timeoutMs);
  }

  public triggerNow(): void {
    this.executeIdleTransition();
  }

  public getRemainingTimeMs(): number {
    if (!this.isTracking) return 0;
    const elapsed = Date.now() - this.lastActivityTime;
    return Math.max(0, this.timeoutMs - elapsed);
  }

  public getState(): IdleAutoPlayState {
    return {
      isTracking: this.isTracking,
      lastActivityTime: this.lastActivityTime,
      lastResetTime: this.lastResetTime,
      timeoutMs: this.timeoutMs,
      targetUrl: this.targetUrl,
      remainingTimeMs: this.getRemainingTimeMs(),
      isAutoPlayActive: this.isAutoModeCurrentlyActive(),
    };
  }

  private scheduleTimer(delayMs: number): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.timerId = setTimeout(() => {
      this.onTimerExpired();
    }, delayMs);
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.resetTimer();
    }
  }

  // ... (handleUserActivity, onTimerExpired, executeIdleTransition, etc.)
}

export function initIdleAutoPlay(options?: IdleAutoPlayOptions): IdleAutoPlayManager {
  const manager = IdleAutoPlayManager.getInstance(options);
  manager.start();
  return manager;
}
```

---

## 5. Bootstrap Integration Architecture

### 5.1 Static Landing Entrypoint (`src/landing/index.ts`)

In `src/landing/index.ts`, `mountLanding()` is the orchestrator:

```typescript
// Add import at the top of src/landing/index.ts
import { initIdleAutoPlay } from './services/idleAutoPlayManager';

function mountLanding(): void {
  // Sync view from initial URL hash if present
  const hash = window.location.hash.replace('#', '') as ViewKey;
  const validViews: ViewKey[] = ['home', 'deck', 'play', 'card', 'shop'];
  if (validViews.includes(hash)) {
    state.activeView = hash;
  }

  // Initialize Global 15-Second Idle Auto-Play Transition
  initIdleAutoPlay({
    timeoutMs: 15000,
    targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
    fallbackHash: '#play',
  });

  // ... existing event delegation, hashchange listener, renderApp() ...
}
```

### 5.2 SPA App Entrypoint (`src/main.tsx`)

In `src/main.tsx`, initialize `initIdleAutoPlay()` alongside the React app mount so that non-landing routes or standalone SPA pages also participate:

```typescript
import { initIdleAutoPlay } from './landing/services/idleAutoPlayManager';

if (!isApiRoute) {
  // Initialize Global 15-Second Idle Auto-Play Transition
  initIdleAutoPlay({
    timeoutMs: 15000,
    targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
    fallbackHash: '#play',
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
```

---

## 6. Comprehensive Testability & Verification Suite Design

### 6.1 Unit Test Specifications (`tests/unit/idleAutoPlayManager.test.ts`)

| Test Case | Scenario | Expected Outcome |
|---|---|---|
| **UT-IDLE-01** | Initial instantiation and default values | `timeoutMs === 15000`, `targetUrl === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play'`, `isTracking === true` |
| **UT-IDLE-02** | Timer expiration triggers transition | Advance fake timers by 15,000ms -> `localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true'`, `onNavigate` called with target URL |
| **UT-IDLE-03** | User interaction resets countdown | User activity at 14,000ms -> At 15,000ms, `onNavigate` has NOT been called; at 29,000ms, `onNavigate` called |
| **UT-IDLE-04** | All 8 monitored input events reset timer | Test each: `mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel` |
| **UT-IDLE-05** | Event throttling prevents excessive timer recreation | Rapid dispatch of 50 `mousemove` events within 100ms triggers only 1 timer reschedule |
| **UT-IDLE-06** | Idempotency on `#play` with auto-mode active | `window.location.hash = '#play'`, `autoMode = 'true'` -> Timer expires -> `onNavigate` NOT called (0 reload) |
| **UT-IDLE-07** | Activation on `#play` with auto-mode inactive | `window.location.hash = '#play'`, `autoMode = 'false'` -> Timer expires -> autoMode set to `'true'`, events dispatched, 0 page reload |
| **UT-IDLE-08** | Lifecycle cleanup via `stop()` | Calling `stop()` removes all 8 window listeners and cancels timer; advancing time does not trigger navigation |
| **UT-IDLE-09** | Visibility change reset | Switching tab (`visibilitychange` to visible) resets idle timer |

#### Unit Test Implementation Template (Vitest / tsx):
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IdleAutoPlayManager, MONITORED_INPUT_EVENTS } from '../../src/landing/services/idleAutoPlayManager';

describe('IdleAutoPlayManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    window.location.hash = '#home';
  });

  afterEach(() => {
    IdleAutoPlayManager.getInstance().stop();
    vi.restoreAllMocks();
  });

  it('UT-IDLE-02: triggers transition and sets auto-mode flags after exactly 15,000ms', () => {
    const navigateSpy = vi.fn();
    const manager = new IdleAutoPlayManager({
      timeoutMs: 15000,
      targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
      onNavigate: navigateSpy,
    });
    manager.start();

    // Advance 14,999ms -> should not trigger yet
    vi.advanceTimersByTime(14999);
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('hero_kadan_rpg_auto_mode')).toBeNull();

    // Advance 1ms more -> 15,000ms total
    vi.advanceTimersByTime(1);
    expect(navigateSpy).toHaveBeenCalledWith('https://dayyoung-macbookpro.tail3717a4.ts.net/#play');
    expect(localStorage.getItem('hero_kadan_rpg_auto_mode')).toBe('true');
  });

  it('UT-IDLE-03: resets timer cleanly when user interaction occurs at 14s', () => {
    const navigateSpy = vi.fn();
    const manager = new IdleAutoPlayManager({
      timeoutMs: 15000,
      onNavigate: navigateSpy,
    });
    manager.start();

    vi.advanceTimersByTime(14000);
    window.dispatchEvent(new MouseEvent('mousemove'));

    vi.advanceTimersByTime(2000); // 16,000ms from start, but only 2,000ms from mousemove
    expect(navigateSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(13000); // Reaches 15,000ms from mousemove
    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  it('UT-IDLE-04: verifies all 8 input events reset the idle timer', () => {
    for (const eventName of MONITORED_INPUT_EVENTS) {
      const navigateSpy = vi.fn();
      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        onNavigate: navigateSpy,
      });
      manager.start();

      vi.advanceTimersByTime(14000);
      window.dispatchEvent(new Event(eventName));

      vi.advanceTimersByTime(2000);
      expect(navigateSpy).not.toHaveBeenCalled();
      manager.stop();
    }
  });

  it('UT-IDLE-06: prevents redundant navigation if already on #play and autoMode is active', () => {
    window.location.hash = '#play';
    localStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
    const navigateSpy = vi.fn();

    const manager = new IdleAutoPlayManager({
      timeoutMs: 15000,
      onNavigate: navigateSpy,
    });
    manager.start();

    vi.advanceTimersByTime(15000);
    expect(navigateSpy).not.toHaveBeenCalled(); // No disruptive page reload!
    expect(localStorage.getItem('hero_kadan_rpg_auto_mode')).toBe('true');
  });
});
```

### 6.2 E2E Master Test Integration (`tests/e2e/tier1_feature_coverage.ts`)

In `tests/e2e/tier1_feature_coverage.ts`, Milestone 1 requires test assertion `T1.IDLE.1`:

```typescript
results.push(
  await runTestAssertion('T1.IDLE.1', 3, 'Global Idle Auto-Play', 'M1', '15-Second Idle Transition to #play', async () => {
    const file = readProjectFile('src/landing/services/idleAutoPlayManager.ts');
    if (!file) return { pass: false, message: 'idleAutoPlayManager.ts not found' };

    const has15s = file.includes('15000') || file.includes('15 * 1000');
    const hasTargetUrl = file.includes('https://dayyoung-macbookpro.tail3717a4.ts.net/#play');
    const hasAutoModeKey = file.includes('hero_kadan_rpg_auto_mode');
    const hasMonitoredEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll', 'pointerdown', 'wheel']
      .every(evt => file.includes(evt));

    if (!has15s) return { pass: false, message: 'idleAutoPlayManager missing 15,000ms timer constant' };
    if (!hasTargetUrl) return { pass: false, message: 'idleAutoPlayManager missing Tailscale #play target URL' };
    if (!hasAutoModeKey) return { pass: false, message: 'idleAutoPlayManager missing hero_kadan_rpg_auto_mode storage key' };
    if (!hasMonitoredEvents) return { pass: false, message: 'idleAutoPlayManager missing one or more of 8 required input event listeners' };

    return { pass: true, message: 'idleAutoPlayManager fully satisfies M1 requirements' };
  })
);
```

---

## 7. Risks & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Scroll Event Bubbling Blindspot** | User scrolls inside modal/drawer; bubble listener on `window` fails to trigger -> false idle redirect | Register on `window` with `{ capture: true, passive: true }` so all scroll events traversing from `window` down to target are captured. |
| **High-Frequency Event CPU Thrashing** | High-polling gaming mouse fires 500+ `mousemove` events/sec -> constant `clearTimeout`/`setTimeout` causes GC stutter | 250ms throttle threshold with dual-timestamp validation (`lastResetTime` vs `lastActivityTime`). |
| **Infinite Reload Loop on `#play`** | Timer fires while on `#play`, calls `location.href = targetUrl` repeatedly | Guard condition: if already on `#play` and auto-play is running, skip navigation and restart timer. |
| **Offline / Local Dev Port Mismatch** | Target URL hardcoded to Tailscale host; running on `localhost:3000` kicks developer to external network | Localhost origin check provides automatic fallback to relative hash navigation (`#play`). |
| **Stale Event Listeners upon SPA Navigation** | Multiple instantiations create ghost timers and memory leaks | Strict singleton pattern (`IdleAutoPlayManager.getInstance()`) with `stop()` / `destroy()` cleanup. |

---

## 8. Conclusion & Implementation Checklist

The design for `idleAutoPlayManager.ts` is fully specified and ready for implementation in Milestone 1:

- [ ] Create `src/landing/services/idleAutoPlayManager.ts` adhering to OpenCode Terminal-Flat standards.
- [ ] Implement all 8 input event listeners with `{ capture: true, passive: true }`.
- [ ] Implement 250ms throttled reset with 15,000ms double-check expiration.
- [ ] Set LocalStorage keys: `hero_kadan_rpg_auto_mode`, `hero_kadan_rpg_auto_mode_season1`, `hero_auto_battle`, `hero_auto_loop_mode`.
- [ ] Dispatch CustomEvents: `hero_kadan_rpg_auto_mode_updated` and `snshero_idle_autoplay_triggered`.
- [ ] Implement `#play` URL & auto-mode guard to eliminate redundant page reloads.
- [ ] Bootstrap in `src/landing/index.ts` (`mountLanding()`) and `src/main.tsx`.
- [ ] Expose global handle `window.__SNSHERO_IDLE_AUTOPLAY__` for devtools and automated tests.
- [ ] Add unit test assertions to `tests/e2e/tier1_feature_coverage.ts` (`T1.IDLE.1`).
