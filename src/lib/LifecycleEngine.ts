// ─── LifecycleEngine: Zero Background Overhead Engine (SCR-01-06) ───
// Detects document.visibilityState & window focus/blur to halt intervals,
// release render overhead in inactive tabs, and compute precise background elapsed time.

export type LifecycleCallback = (isVisible: boolean, hiddenDurationMs: number) => void;

class LifecycleEngineService {
  private static instance: LifecycleEngineService;
  private isVisibleState: boolean = true;
  private hiddenTimestamp: number = 0;
  private listeners: Set<LifecycleCallback> = new Set();
  private initialized: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.isVisibleState = document.visibilityState === 'visible';
      this.init();
    }
  }

  public static getInstance(): LifecycleEngineService {
    if (!LifecycleEngineService.instance) {
      LifecycleEngineService.instance = new LifecycleEngineService();
    }
    return LifecycleEngineService.instance;
  }

  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const handleVisibilityChange = () => {
      const currentlyVisible = document.visibilityState === 'visible';
      if (currentlyVisible === this.isVisibleState) return;

      const now = Date.now();
      let hiddenDuration = 0;

      if (!currentlyVisible) {
        // Tab just transitioned to background
        this.hiddenTimestamp = now;
        this.isVisibleState = false;
      } else {
        // Tab just resumed to foreground
        if (this.hiddenTimestamp > 0) {
          hiddenDuration = now - this.hiddenTimestamp;
        }
        this.hiddenTimestamp = 0;
        this.isVisibleState = true;
      }

      // Notify all subscribers
      this.listeners.forEach((callback) => {
        try {
          callback(this.isVisibleState, hiddenDuration);
        } catch (err) {
          console.error('[LifecycleEngine] callback error:', err);
        }
      });

      // Dispatch global DOM event
      window.dispatchEvent(
        new CustomEvent('hero_lifecycle_state_changed', {
          detail: { isVisible: this.isVisibleState, hiddenDurationMs: hiddenDuration }
        })
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', () => {
      this.isVisibleState = false;
      this.hiddenTimestamp = Date.now();
    });
    window.addEventListener('pageshow', () => {
      this.isVisibleState = true;
      this.hiddenTimestamp = 0;
    });
  }

  public isVisible(): boolean {
    return this.isVisibleState;
  }

  public subscribe(callback: LifecycleCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const LifecycleEngine = LifecycleEngineService.getInstance();
