/**
 * src/landing/services/idleAutoPlayManager.ts
 *
 * Global 15-Second Inactivity Auto-Play Transition Engine for SNSHero.
 * Detects user absence across all interaction vectors and seamlessly transitions
 * to the #play tactical battle screen with auto-play enabled.
 * Adheres strictly to OpenCode Terminal-Flat architecture and project invariants.
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
    try {
      (window as any).__SNSHERO_IDLE_AUTOPLAY__ = this;
    } catch {
      // Ignored in strict/isolated contexts
    }
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

  private handleUserActivity(_event?: Event): void {
    const now = Date.now();
    this.lastActivityTime = now;

    // Throttle high-frequency events (e.g. 120Hz/240Hz mousemove or touchmove)
    if (now - this.lastResetTime < this.throttleMs) {
      return;
    }

    this.lastResetTime = now;
    this.scheduleTimer(this.timeoutMs);
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
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this.resetTimer();
    }
  }

  private onTimerExpired(): void {
    const now = Date.now();
    const elapsedSinceActivity = now - this.lastActivityTime;

    // Double-check verification: if user interacted during the throttle window, reschedule
    if (elapsedSinceActivity < this.timeoutMs) {
      const remaining = this.timeoutMs - elapsedSinceActivity;
      this.scheduleTimer(remaining);
      return;
    }

    // Exact 15,000ms idle threshold reached: execute transition!
    this.executeIdleTransition();
  }

  private isCurrentlyOnPlayScreen(): boolean {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
    const path = (window.location.pathname || '').replace(/\/$/, '').toLowerCase();
    return hash === 'play' || hash === 'main' || path === '/play' || path.startsWith('/play/') || path === '/main';
  }

  private isAutoModeCurrentlyActive(): boolean {
    try {
      return localStorage.getItem('hero_kadan_rpg_auto_mode') === 'true';
    } catch {
      return false;
    }
  }

  private commitAutoModeFlags(): void {
    try {
      localStorage.setItem('hero_kadan_rpg_auto_mode', 'true');
      localStorage.setItem('hero_kadan_rpg_auto_mode_season1', 'true');
      localStorage.setItem('hero_auto_battle', 'true');
      localStorage.setItem('hero_auto_loop_mode', 'true');
    } catch (err) {
      console.warn('[IdleAutoPlayManager] Failed to write localStorage auto-mode flags:', err);
    }

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
  }

  private executeIdleTransition(): void {
    const alreadyOnPlay = this.isCurrentlyOnPlayScreen();
    const autoModeActive = this.isAutoModeCurrentlyActive();

    // Commit storage and dispatch events
    this.commitAutoModeFlags();

    if (this.onTrigger) {
      this.onTrigger({
        timestamp: Date.now(),
        fromUrl: typeof window !== 'undefined' ? window.location.href : '',
        targetUrl: this.targetUrl,
        alreadyOnPlay,
        autoModeWasActive: autoModeActive,
      });
    }

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

  private performNavigation(): void {
    if (this.onNavigate) {
      this.onNavigate(this.targetUrl);
      this.resetTimer();
      return;
    }

    if (typeof window === 'undefined') return;

    const currentHost = window.location.hostname;
    const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

    // In localhost development or offline testing, stay on current server via relative hash navigation
    if (isLocalhost && !this.targetUrl.includes(currentHost)) {
      window.location.hash = this.fallbackHash;
      this.resetTimer();
      return;
    }

    try {
      const targetObj = new URL(this.targetUrl, window.location.href);
      if (targetObj.origin === window.location.origin) {
        window.location.hash = targetObj.hash || this.fallbackHash;
      } else {
        window.location.href = this.targetUrl;
      }
    } catch {
      window.location.href = this.targetUrl;
    }

    this.resetTimer();
  }
}

export const idleAutoPlayManager = IdleAutoPlayManager.getInstance();

export function initIdleAutoPlay(options?: IdleAutoPlayOptions): IdleAutoPlayManager {
  const manager = IdleAutoPlayManager.getInstance(options);
  manager.start();
  return manager;
}
