/**
/**
 * tests/adversarial_m1_challenger2.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER 2 TEST HARNESS for Milestone 1 (M1)
 * Focus Areas:
 * 1. High-frequency input event storm (500 events/sec) & 250ms throttle concurrency
 * 2. Exact millisecond boundary testing (14,999ms vs 15,000ms)
 * 3. User activity at 14,900ms (last-second cancel and 15s extension)
 * 4. Throttled activity tail-window rescheduling accuracy
 * 5. LocalStorage persistence (4 flags) & CustomEvent dispatching under healthy and error conditions
 * 6. Viewport / screen state routing (already on #play, auto-mode active/inactive, localhost fallback)
 * 7. Visibility change (tab blur/focus) reset behavior
 * 8. Re-entrancy, idempotency & cleanup (start/stop listener leak verification)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Deterministic Virtual DOM & Time Harness
// ============================================================================

class VirtualClock {
  private currentTime: number;
  private nextTimerId: number = 1;
  private timers: Map<number, { callback: () => void; dueTime: number }> = new Map();

  constructor(initialTime: number = 1000000) {
    this.currentTime = initialTime;
  }

  now(): number {
    return this.currentTime;
  }

  setTimeout(callback: () => void, delayMs: number): any {
    const id = this.nextTimerId++;
    const dueTime = this.currentTime + Math.max(0, delayMs);
    this.timers.set(id, { callback, dueTime });
    return id as any;
  }

  clearTimeout(timerId: any): void {
    if (timerId) {
      this.timers.delete(Number(timerId));
    }
  }

  advanceTime(deltaMs: number): void {
    const targetTime = this.currentTime + deltaMs;

    while (this.currentTime < targetTime) {
      // Find the earliest due timer
      let earliestId: number | null = null;
      let earliestDue = Infinity;

      for (const [id, item] of this.timers.entries()) {
        if (item.dueTime <= targetTime && item.dueTime < earliestDue) {
          earliestDue = item.dueTime;
          earliestId = id;
        }
      }

      if (earliestId === null) {
        // No more timers due within the target window
        this.currentTime = targetTime;
        break;
      }

      // Advance clock to this timer's due time
      this.currentTime = earliestDue;
      const timer = this.timers.get(earliestId);
      this.timers.delete(earliestId);
      if (timer) {
        timer.callback();
      }
    }
    this.currentTime = targetTime;
  }

  getPendingTimerCount(): number {
    return this.timers.size;
  }

  getTimersSnapshot(): Array<{ id: number; dueTime: number; inMs: number }> {
    return Array.from(this.timers.entries()).map(([id, t]) => ({
      id,
      dueTime: t.dueTime,
      inMs: t.dueTime - this.currentTime,
    }));
  }
}

class VirtualDOMEnvironment {
  public clock: VirtualClock;
  public eventListeners: Map<string, Set<(e: any) => void>> = new Map();
  public docEventListeners: Map<string, Set<(e: any) => void>> = new Map();
  public dispatchedEvents: Array<{ type: string; detail?: any }> = [];
  public storageStore: Map<string, string> = new Map();
  public storageShouldThrow: boolean = false;
  public location: {
    href: string;
    hash: string;
    pathname: string;
    hostname: string;
    origin: string;
  };
  public visibilityState: 'visible' | 'hidden' = 'visible';

  private origDateNow: () => number;
  private origSetTimeout: typeof setTimeout;
  private origClearTimeout: typeof clearTimeout;

  constructor() {
    this.clock = new VirtualClock(1700000000000);
    this.origDateNow = Date.now;
    this.origSetTimeout = globalThis.setTimeout;
    this.origClearTimeout = globalThis.clearTimeout;

    this.location = {
      href: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#home',
      hash: '#home',
      pathname: '/',
      hostname: 'dayyoung-macbookpro.tail3717a4.ts.net',
      origin: 'https://dayyoung-macbookpro.tail3717a4.ts.net',
    };
  }

  setupGlobal(): void {
    const env = this;

    // Time mocking
    Date.now = () => env.clock.now();
    (globalThis as any).setTimeout = (cb: () => void, ms: number) => env.clock.setTimeout(cb, ms);
    (globalThis as any).clearTimeout = (id: any) => env.clock.clearTimeout(id);

    // Storage mocking
    (globalThis as any).localStorage = {
      getItem: (key: string) => {
        if (env.storageShouldThrow) throw new Error('QuotaExceededError');
        return env.storageStore.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (env.storageShouldThrow) throw new Error('QuotaExceededError');
        env.storageStore.set(key, String(value));
      },
      removeItem: (key: string) => {
        env.storageStore.delete(key);
      },
      clear: () => {
        env.storageStore.clear();
      },
      get length() {
        return env.storageStore.size;
      },
    };

    // CustomEvent & Event mocking
    (globalThis as any).Event = class {
      public type: string;
      constructor(type: string) {
        this.type = type;
      }
    };

    (globalThis as any).CustomEvent = class {
      public type: string;
      public detail: any;
      constructor(type: string, init?: { detail?: any }) {
        this.type = type;
        this.detail = init?.detail;
      }
    };

    // Document mocking
    (globalThis as any).document = {
      get visibilityState() {
        return env.visibilityState;
      },
      addEventListener: (type: string, listener: (e: any) => void) => {
        if (!env.docEventListeners.has(type)) {
          env.docEventListeners.set(type, new Set());
        }
        env.docEventListeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: (e: any) => void) => {
        env.docEventListeners.get(type)?.delete(listener);
      },
      dispatchEvent: (event: any) => {
        env.dispatchedEvents.push({ type: event.type, detail: event.detail });
        const listeners = env.docEventListeners.get(event.type);
        if (listeners) {
          for (const l of listeners) l(event);
        }
        return true;
      },
    };

    // Window mocking
    (globalThis as any).window = {
      location: env.location,
      addEventListener: (type: string, listener: (e: any) => void, _opts?: any) => {
        if (!env.eventListeners.has(type)) {
          env.eventListeners.set(type, new Set());
        }
        env.eventListeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: (e: any) => void, _opts?: any) => {
        env.eventListeners.get(type)?.delete(listener);
      },
      dispatchEvent: (event: any) => {
        env.dispatchedEvents.push({ type: event.type, detail: event.detail });
        const listeners = env.eventListeners.get(event.type);
        if (listeners) {
          for (const l of listeners) l(event);
        }
        return true;
      },
    };
  }

  tearDown(): void {
    Date.now = this.origDateNow;
    globalThis.setTimeout = this.origSetTimeout;
    globalThis.clearTimeout = this.origClearTimeout;
  }

  dispatchWindowEvent(type: string): void {
    if ((globalThis as any).window) {
      (globalThis as any).window.dispatchEvent(new (globalThis as any).Event(type));
    }
  }

  dispatchVisibilityChange(state: 'visible' | 'hidden'): void {
    this.visibilityState = state;
    if ((globalThis as any).document) {
      (globalThis as any).document.dispatchEvent(new (globalThis as any).Event('visibilitychange'));
    }
  }
}

// ============================================================================
// Test Suite Statistics & Assertions
// ============================================================================

interface AssertionResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  message?: string;
  details?: Record<string, any>;
}

const testResults: AssertionResult[] = [];

function recordTest(id: string, category: string, name: string, passed: boolean, message?: string, details?: Record<string, any>) {
  testResults.push({ id, category, name, passed, message, details });
  const statusMark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${id}] ${statusMark}: ${name}`);
  if (!passed && message) {
    console.error(`       Error: ${message}`);
  }
  if (details) {
    console.log(`       Details:`, JSON.stringify(details));
  }
}

// ============================================================================
// Adversarial Test Runner
// ============================================================================

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('  CHALLENGER 2: ADVERSARIAL STRESS HARNESS — MILESTONE 1 (M1)  ');
  console.log('================================================================\n');

  const env = new VirtualDOMEnvironment();
  env.setupGlobal();

  // Dynamically import the real implementation
  const { IdleAutoPlayManager, MONITORED_INPUT_EVENTS } = await import(
    '../src/landing/services/idleAutoPlayManager.js'
  );

  try {
    // ------------------------------------------------------------------------
    // CHALLENGE 1: High-Frequency Input Event Storm (500 events/sec) & Throttle
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 1: High-Frequency Input Storm & 250ms Throttle ---');
    {
      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        throttleMs: 250,
      });

      let scheduleTimerCalls = 0;
      const originalSchedule = (manager as any).scheduleTimer.bind(manager);
      (manager as any).scheduleTimer = function (ms: number) {
        scheduleTimerCalls++;
        return originalSchedule(ms);
      };

      manager.start();
      scheduleTimerCalls = 0; // reset initial start call

      // Simulate 500 events/sec for 2,000ms (1,000 events total, 1 event every 2ms)
      const stormDurationMs = 2000;
      const eventIntervalMs = 2; // 500 events/sec
      const totalEvents = stormDurationMs / eventIntervalMs; // 1,000 events

      for (let i = 0; i < totalEvents; i++) {
        env.clock.advanceTime(eventIntervalMs);
        const eventType = MONITORED_INPUT_EVENTS[i % MONITORED_INPUT_EVENTS.length];
        env.dispatchWindowEvent(eventType);
      }

      // Expected scheduleTimer calls: over 2,000ms with a 250ms throttle,
      // scheduleTimer should be called at most ~8-9 times (2000 / 250 = 8), NOT 1,000 times!
      const throttleRatio = scheduleTimerCalls / totalEvents;
      const throttleEffective = scheduleTimerCalls <= 12 && scheduleTimerCalls >= 7;

      recordTest(
        'CH2-STORM-1',
        'Throttle Concurrency',
        '250ms throttle restricts timer rescheduling during 500 events/sec storm',
        throttleEffective,
        `Expected 7..12 scheduleTimer calls for 1000 events over 2000ms, got ${scheduleTimerCalls} (ratio: ${(throttleRatio * 100).toFixed(2)}%)`,
        { totalEvents, scheduleTimerCalls, throttleEffective }
      );

      // Verify that after the storm stops at t=2000ms, the timer does NOT trigger prematurely!
      // Inactivity countdown should now run for 15,000ms from t=2000ms -> t=17,000ms.
      // Advance by 14,999ms from t=2000ms -> t=16,999ms.
      env.clock.advanceTime(14999);
      const isAutoActivePre = env.storageStore.get('hero_kadan_rpg_auto_mode') === 'true';

      recordTest(
        'CH2-STORM-2',
        'Post-Storm Idle Count',
        'Auto-play does NOT trigger at 14,999ms post-storm',
        !isAutoActivePre,
        `Auto-play triggered prematurely after storm: isAutoActive=${isAutoActivePre}`,
        { clockNow: env.clock.now(), isAutoActivePre }
      );

      // Advance 1ms more to reach exact 15,000ms -> t=17,000ms
      env.clock.advanceTime(1);
      const isAutoActivePost = env.storageStore.get('hero_kadan_rpg_auto_mode') === 'true';

      recordTest(
        'CH2-STORM-3',
        'Post-Storm Exact Expiration',
        'Auto-play triggers at exact 15,000ms post-storm',
        isAutoActivePost,
        `Auto-play failed to trigger at exactly 15,000ms post-storm`,
        { clockNow: env.clock.now(), isAutoActivePost }
      );

      manager.stop();
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 2: Exact Millisecond Boundary (14,999ms vs 15,000ms)
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 2: Exact Millisecond Boundary Testing ---');
    {
      env.storageStore.clear();
      env.dispatchedEvents = [];
      env.location.hash = '#home';
      env.location.pathname = '/';

      let triggerCount = 0;
      let navigatedTarget: string | null = null;

      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        throttleMs: 250,
        targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
        onTrigger: () => {
          triggerCount++;
        },
        onNavigate: (url) => {
          navigatedTarget = url;
        },
      });

      manager.start();

      // At t=0
      const initialRemaining = manager.getRemainingTimeMs();
      recordTest(
        'CH2-BOUND-1',
        'Boundary Precision',
        'Initial remaining time is 15,000ms',
        initialRemaining === 15000,
        `Initial remaining time expected 15,000, got ${initialRemaining}`
      );

      // Advance by 14,999ms
      env.clock.advanceTime(14999);

      const remainingAt14999 = manager.getRemainingTimeMs();
      const triggeredAt14999 = triggerCount > 0;
      const storageFlagAt14999 = env.storageStore.get('hero_kadan_rpg_auto_mode') === 'true';

      recordTest(
        'CH2-BOUND-2',
        'Boundary Precision',
        '14,999ms boundary: MUST NOT trigger auto-play',
        !triggeredAt14999 && !storageFlagAt14999 && remainingAt14999 === 1,
        `Triggered prematurely at 14,999ms: triggerCount=${triggerCount}, storage=${storageFlagAt14999}, remaining=${remainingAt14999}`,
        { triggerCount, storageFlagAt14999, remainingAt14999 }
      );

      // Advance by 1ms (hits exactly 15,000ms)
      env.clock.advanceTime(1);

      const triggeredAt15000 = triggerCount === 1;
      const storageFlagAt15000 = env.storageStore.get('hero_kadan_rpg_auto_mode') === 'true';
      const targetMatches = navigatedTarget === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play';

      recordTest(
        'CH2-BOUND-3',
        'Boundary Precision',
        '15,000ms boundary: MUST trigger auto-play and navigate',
        triggeredAt15000 && storageFlagAt15000 && targetMatches,
        `Failed to trigger at 15,000ms: triggerCount=${triggerCount}, storage=${storageFlagAt15000}, navigatedTarget=${navigatedTarget}`,
        { triggerCount, storageFlagAt15000, navigatedTarget }
      );

      manager.stop();
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 3: User Activity at 14,900ms (Last-Second Cancellation & 15s Extension)
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 3: User Activity at 14,900ms ---');
    {
      env.storageStore.clear();
      env.dispatchedEvents = [];

      let triggerCount = 0;
      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        throttleMs: 250,
        onTrigger: () => {
          triggerCount++;
        },
      });

      manager.start();

      // Advance to 14,900ms (100ms before timeout)
      env.clock.advanceTime(14900);
      recordTest(
        'CH2-RESET-1',
        'Last-Second Interaction',
        'At 14,900ms, timer is active and has not triggered',
        triggerCount === 0 && manager.getRemainingTimeMs() === 100
      );

      // User interacts: fires keydown
      env.dispatchWindowEvent('keydown');

      // Remaining time should immediately reset to 15,000ms
      const postInteractionRemaining = manager.getRemainingTimeMs();
      recordTest(
        'CH2-RESET-2',
        'Last-Second Interaction',
        'User interaction at 14,900ms resets remaining time to 15,000ms',
        postInteractionRemaining === 15000,
        `Expected remaining 15,000ms, got ${postInteractionRemaining}`
      );

      // Advance by 100ms to what would have been the original 15,000ms mark (total elapsed 15,000ms)
      env.clock.advanceTime(100);
      recordTest(
        'CH2-RESET-3',
        'Last-Second Interaction',
        'At 15,000ms (original deadline), auto-play is CANCELLED and does NOT trigger',
        triggerCount === 0,
        `Trigger count expected 0, got ${triggerCount}`
      );

      // Advance by another 14,899ms (total 29,899ms; 14,999ms from interaction)
      env.clock.advanceTime(14899);
      recordTest(
        'CH2-RESET-4',
        'Last-Second Interaction',
        'At 29,899ms (14,999ms post-reset), auto-play has NOT triggered',
        triggerCount === 0 && manager.getRemainingTimeMs() === 1,
        `Remaining time: ${manager.getRemainingTimeMs()}, triggerCount: ${triggerCount}`
      );

      // Advance 1ms more to 29,900ms (exactly 15,000ms after the interaction)
      env.clock.advanceTime(1);
      recordTest(
        'CH2-RESET-5',
        'Last-Second Interaction',
        'At 29,900ms (exactly 15,000ms post-reset), auto-play MUST trigger',
        triggerCount === 1,
        `Trigger count expected 1, got ${triggerCount}`
      );

      manager.stop();
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 4: Throttled Activity Tail-Window Rescheduling Accuracy
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 4: Throttled Activity Tail-Window Rescheduling ---');
    {
      // Scenario: User interacts at t=0.
      // User interacts again at t=100ms (inside the 250ms throttle window!).
      // The 100ms event is throttled, but updates lastActivityTime.
      // Does onTimerExpired accurately detect that elapsedSinceActivity < 15000 and reschedule?
      env.storageStore.clear();

      let triggerCount = 0;
      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        throttleMs: 250,
        onTrigger: () => {
          triggerCount++;
        },
      });

      manager.start();

      // Advance 100ms
      env.clock.advanceTime(100);
      // Dispatch interaction at 100ms (this is within 250ms of t=0 start)
      env.dispatchWindowEvent('mousemove');

      // The original timer was scheduled for t=15,000ms.
      // At t=15,000ms, only 14,900ms have elapsed since the 100ms interaction!
      env.clock.advanceTime(14900); // clock is now at 15,000ms
      // At 15,000ms, onTimerExpired should have checked (15000 - 100 = 14900 < 15000),
      // and rescheduled for the remaining 100ms (to 15,100ms)!
      recordTest(
        'CH2-THROTTLE-TAIL-1',
        'Throttle Tail Accuracy',
        'At 15,000ms, throttled tail event prevented early trigger and rescheduled',
        triggerCount === 0,
        `Expected triggerCount 0, got ${triggerCount}`
      );

      // Advance 99ms to 15,099ms
      env.clock.advanceTime(99);
      recordTest(
        'CH2-THROTTLE-TAIL-2',
        'Throttle Tail Accuracy',
        'At 15,099ms (14,999ms since last throttled activity), NOT triggered',
        triggerCount === 0
      );

      // Advance 1ms to 15,100ms (exactly 15,000ms since throttled activity at 100ms)
      env.clock.advanceTime(1);
      recordTest(
        'CH2-THROTTLE-TAIL-3',
        'Throttle Tail Accuracy',
        'At 15,100ms (15,000ms since throttled activity), MUST trigger',
        triggerCount === 1,
        `Expected triggerCount 1, got ${triggerCount}`
      );

      manager.stop();
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 5: LocalStorage Flags (4 Flags) & Custom Event Dispatching
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 5: LocalStorage Persistence & CustomEvent Dispatching ---');
    {
      env.storageStore.clear();
      env.dispatchedEvents = [];

      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
      });

      manager.start();
      env.clock.advanceTime(15000);

      // Check all 4 localStorage keys
      const flag1 = env.storageStore.get('hero_kadan_rpg_auto_mode');
      const flag2 = env.storageStore.get('hero_kadan_rpg_auto_mode_season1');
      const flag3 = env.storageStore.get('hero_auto_battle');
      const flag4 = env.storageStore.get('hero_auto_loop_mode');

      const allFlagsSet = flag1 === 'true' && flag2 === 'true' && flag3 === 'true' && flag4 === 'true';

      recordTest(
        'CH2-STORAGE-1',
        'Storage Persistence',
        'All 4 auto-play persistence flags are written to localStorage',
        allFlagsSet,
        `Flags mismatch: hero_kadan_rpg_auto_mode=${flag1}, season1=${flag2}, auto_battle=${flag3}, auto_loop=${flag4}`,
        { flag1, flag2, flag3, flag4 }
      );

      // Check custom events
      const autoModeEvent = env.dispatchedEvents.find(e => e.type === 'hero_kadan_rpg_auto_mode_updated');
      const idleTriggerEvent = env.dispatchedEvents.find(e => e.type === 'snshero_idle_autoplay_triggered');

      recordTest(
        'CH2-EVENT-1',
        'CustomEvent Dispatch',
        'hero_kadan_rpg_auto_mode_updated custom event dispatched with { autoMode: true }',
        autoModeEvent !== undefined && autoModeEvent.detail?.autoMode === true,
        `hero_kadan_rpg_auto_mode_updated event: ${JSON.stringify(autoModeEvent)}`
      );

      recordTest(
        'CH2-EVENT-2',
        'CustomEvent Dispatch',
        'snshero_idle_autoplay_triggered custom event dispatched with targetUrl and timestamp',
        idleTriggerEvent !== undefined &&
          idleTriggerEvent.detail?.targetUrl === 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play' &&
          typeof idleTriggerEvent.detail?.timestamp === 'number',
        `snshero_idle_autoplay_triggered event: ${JSON.stringify(idleTriggerEvent)}`
      );

      manager.stop();

      // Sub-challenge: Storage QuotaExceededError Resilience
      env.storageShouldThrow = true;
      let didCrash = false;
      try {
        manager.triggerNow();
      } catch {
        didCrash = true;
      }
      env.storageShouldThrow = false;

      recordTest(
        'CH2-STORAGE-2',
        'Storage Resilience',
        'Storage QuotaExceededError does NOT crash or unhandle exception',
        !didCrash,
        `triggerNow() threw uncaught exception on storage error`
      );
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 6: Screen Disambiguation & Re-entrance Protection
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 6: Screen Disambiguation & Re-entrance Protection ---');
    {
      // Case 6A: User is ALREADY on #play and autoMode was ALREADY active
      env.location.hash = '#play';
      env.storageStore.set('hero_kadan_rpg_auto_mode', 'true');

      let navigated = false;
      let triggerDetail: any = null;

      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        onNavigate: () => {
          navigated = true;
        },
        onTrigger: (d) => {
          triggerDetail = d;
        },
      });

      manager.triggerNow();

      recordTest(
        'CH2-ROUTE-1',
        'Redundant Reload Guard',
        'If already on #play with auto-mode active, avoid redundant reload/navigation',
        !navigated && triggerDetail?.alreadyOnPlay === true && triggerDetail?.autoModeWasActive === true,
        `Unexpected navigation or triggerDetail: navigated=${navigated}, detail=${JSON.stringify(triggerDetail)}`
      );

      // Case 6B: User is ALREADY on #play but autoMode was NOT active
      env.location.hash = '#play';
      env.storageStore.set('hero_kadan_rpg_auto_mode', 'false');
      navigated = false;
      triggerDetail = null;

      manager.triggerNow();

      recordTest(
        'CH2-ROUTE-2',
        'In-Place Activation',
        'If already on #play without auto-mode, activate in-place without page reload',
        !navigated && triggerDetail?.alreadyOnPlay === true && triggerDetail?.autoModeWasActive === false,
        `Unexpected navigation: navigated=${navigated}, detail=${JSON.stringify(triggerDetail)}`
      );

      // Case 6C: Localhost development fallback
      env.location.hash = '#home';
      env.location.hostname = 'localhost';
      env.storageStore.set('hero_kadan_rpg_auto_mode', 'false');

      const localManager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        targetUrl: 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play',
        fallbackHash: '#play',
      });

      localManager.triggerNow();

      recordTest(
        'CH2-ROUTE-3',
        'Localhost Fallback',
        'On localhost, fallback to relative hash #play to prevent breaking local dev server',
        env.location.hash === '#play',
        `Expected hash #play on localhost, got ${env.location.hash}`
      );

      // Restore location
      env.location.hostname = 'dayyoung-macbookpro.tail3717a4.ts.net';
      env.location.hash = '#home';
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 7: Tab Visibility Resynchronization
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 7: Tab Visibility Resynchronization ---');
    {
      env.storageStore.clear();
      let triggerCount = 0;

      const manager = new IdleAutoPlayManager({
        timeoutMs: 15000,
        onTrigger: () => {
          triggerCount++;
        },
      });

      manager.start();

      // Advance 10,000ms
      env.clock.advanceTime(10000);
      recordTest(
        'CH2-VIS-1',
        'Visibility Sync',
        'Idle time accumulates normally (10,000ms)',
        manager.getRemainingTimeMs() === 5000 && triggerCount === 0
      );

      // User switches back to tab -> document fires 'visibilitychange' (visible)
      env.dispatchVisibilityChange('visible');

      recordTest(
        'CH2-VIS-2',
        'Visibility Sync',
        'Switching back to visible tab resets timer to 15,000ms preventing immediate redirect',
        manager.getRemainingTimeMs() === 15000 && triggerCount === 0,
        `Remaining time after visibility visible: ${manager.getRemainingTimeMs()}`
      );

      // Advance 14,999ms from visibility change
      env.clock.advanceTime(14999);
      recordTest(
        'CH2-VIS-3',
        'Visibility Sync',
        'Auto-play does NOT trigger at 14,999ms post-visibility reset',
        triggerCount === 0
      );

      // Advance 1ms
      env.clock.advanceTime(1);
      recordTest(
        'CH2-VIS-4',
        'Visibility Sync',
        'Auto-play triggers at 15,000ms post-visibility reset',
        triggerCount === 1
      );

      manager.stop();
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 8: Re-entrance, Idempotency & Cleanup (No Listener Leaks)
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 8: Idempotency & Listener Cleanup ---');
    {
      const manager = new IdleAutoPlayManager();

      // Initial listener count
      const initialWindowListeners = Array.from(env.eventListeners.values()).reduce((acc, s) => acc + s.size, 0);

      // Call start() 5 times consecutively
      manager.start();
      manager.start();
      manager.start();
      manager.start();
      manager.start();

      const runningWindowListeners = Array.from(env.eventListeners.values()).reduce((acc, s) => acc + s.size, 0);
      const expectedListenerCount = MONITORED_INPUT_EVENTS.length; // 8

      recordTest(
        'CH2-IDEMP-1',
        'Idempotent Start',
        'Calling start() multiple times attaches each event listener exactly once (0 duplicates)',
        runningWindowListeners - initialWindowListeners === expectedListenerCount,
        `Expected ${expectedListenerCount} added listeners, got ${runningWindowListeners - initialWindowListeners}`
      );

      // Call stop()
      manager.stop();

      const postStopWindowListeners = Array.from(env.eventListeners.values()).reduce((acc, s) => acc + s.size, 0);
      const docVisibilityListeners = env.docEventListeners.get('visibilitychange')?.size ?? 0;

      recordTest(
        'CH2-IDEMP-2',
        'Clean Stop Cleanup',
        'Calling stop() removes all 8 window event listeners and document visibility listener',
        postStopWindowListeners === initialWindowListeners && docVisibilityListeners === 0,
        `Listeners remaining: window=${postStopWindowListeners - initialWindowListeners}, docVisibility=${docVisibilityListeners}`
      );
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 9: Exhaustive Verification of All 8 Input Event Types Individually
    // ------------------------------------------------------------------------
    console.log('\n--- Challenge 9: Exhaustive Verification of All 8 Input Event Types ---');
    {
      for (const eventName of MONITORED_INPUT_EVENTS) {
        env.storageStore.clear();
        let triggerCount = 0;

        const manager = new IdleAutoPlayManager({
          timeoutMs: 15000,
          throttleMs: 250,
          onTrigger: () => {
            triggerCount++;
          },
        });

        manager.start();

        // Advance 14,000ms
        env.clock.advanceTime(14000);
        // Dispatch this specific event
        env.dispatchWindowEvent(eventName);

        // Advance 2,000ms (clock at 16,000ms; would be past original 15,000ms deadline)
        env.clock.advanceTime(2000);

        const resetEffective = triggerCount === 0 && manager.getRemainingTimeMs() === 13000;

        recordTest(
          `CH2-EVENT-TYPE-${eventName}`,
          'Event Type Coverage',
          `Input event '${eventName}' cleanly resets 15s idle timer`,
          resetEffective,
          `Event '${eventName}' failed to reset: triggerCount=${triggerCount}, remaining=${manager.getRemainingTimeMs()}`
        );

        manager.stop();
      }
    }
  } finally {
    env.tearDown();
  }

  // --------------------------------------------------------------------------
  // CHALLENGE 10: Real Wall-Clock Asynchronous Event Loop Concurrency
  // --------------------------------------------------------------------------
  console.log('\n--- Challenge 10: Real Wall-Clock Asynchronous Event Loop Concurrency ---');
  {
    // Restored to genuine Node.js runtime timers (real Date.now & real setTimeout)
    let triggeredReal = false;
    let navigatedReal = false;

    const realManager = new IdleAutoPlayManager({
      timeoutMs: 60, // 60ms real time
      throttleMs: 15,
      onTrigger: () => {
        triggeredReal = true;
      },
      onNavigate: () => {
        navigatedReal = true;
      },
    });

    realManager.start();

    // Wait 30ms (before timeout)
    await new Promise(r => setTimeout(r, 30));
    const preTriggerState = triggeredReal;

    // Simulate user interaction at 30ms (resets timer by another 60ms -> expires at ~90ms)
    realManager.resetTimer();

    // Wait another 40ms (total 70ms elapsed from start; 40ms from reset)
    await new Promise(r => setTimeout(r, 40));
    const midTriggerState = triggeredReal;

    // Wait another 35ms (total 105ms elapsed; 75ms from reset -> must have fired)
    await new Promise(r => setTimeout(r, 35));
    const postTriggerState = triggeredReal;

    recordTest(
      'CH2-REAL-CLOCK-1',
      'Real Wall-Clock Concurrency',
      'Real wall-clock: timer does not trigger prematurely at 30ms',
      !preTriggerState,
      `Triggered prematurely at 30ms`
    );

    recordTest(
      'CH2-REAL-CLOCK-2',
      'Real Wall-Clock Concurrency',
      'Real wall-clock: user interaction at 30ms cancels trigger at original 60ms mark',
      !midTriggerState,
      `Failed to cancel: triggered at 70ms wall-clock mark`
    );

    recordTest(
      'CH2-REAL-CLOCK-3',
      'Real Wall-Clock Concurrency',
      'Real wall-clock: triggers reliably after reset expiration (75ms post-reset)',
      postTriggerState,
      `Failed to trigger after real wall-clock reset expiration`
    );

    realManager.stop();
  }

  // ==========================================================================
  // Summary & Verdict
  // ==========================================================================
  console.log('\n================================================================');
  console.log('  EMPIRICAL ADVERSARIAL CHALLENGER 2 RESULTS SUMMARY           ');
  console.log('================================================================');

  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;

  console.log(`Total Assertions Executed: ${total}`);
  console.log(`Passed:                   ${passed}`);
  console.log(`Failed:                   ${failed}`);
  console.log(`Pass Rate:                ${((passed / total) * 100).toFixed(1)}%`);

  const verdict = failed === 0 ? 'APPROVE' : 'REQUEST_CHANGES';
  console.log(`\nEXPLICIT VERDICT: ${verdict}`);
  console.log('================================================================\n');

  // Write machine-readable JSON results
  const resultsPayload = {
    timestamp: new Date().toISOString(),
    milestone: 'M1',
    challenger: 'challenger_m1_9_2',
    verdict,
    summary: { total, passed, failed, passRate: `${((passed / total) * 100).toFixed(1)}%` },
    tests: testResults,
  };

  fs.writeFileSync(
    path.resolve(__dirname, '../.agents/teamwork/challenger_m1_9_2/results.json'),
    JSON.stringify(resultsPayload, null, 2)
  );

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialSuite().catch(err => {
  console.error('Fatal error in adversarial test runner:', err);
  process.exit(1);
});
