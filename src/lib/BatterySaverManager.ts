/**
 * BatterySaverManager.ts - SCR-01-13
 * 기기 배터리 수준 및 백그라운드 전환 감지 기반 스마트 배터리 세이버 매니저
 */

export interface BatteryStatus {
  charging: boolean;
  level: number; // 0.0 ~ 1.0
  isLowPowerMode: boolean;
  targetFps: 60 | 30 | 15;
}

type BatteryCallback = (status: BatteryStatus) => void;

class BatterySaverManagerClass {
  private status: BatteryStatus = {
    charging: true,
    level: 1.0,
    isLowPowerMode: false,
    targetFps: 60,
  };

  private listeners: Set<BatteryCallback> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Load user battery saver preference
    const savedSaver = localStorage.getItem('hero_battery_saver_mode');
    if (savedSaver === 'true') {
      this.status.isLowPowerMode = true;
      this.status.targetFps = 30;
    }

    // Battery Status API (Navigator.getBattery)
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        this.updateBatteryInfo(battery);

        battery.addEventListener('chargingchange', () => this.updateBatteryInfo(battery));
        battery.addEventListener('levelchange', () => this.updateBatteryInfo(battery));
      } catch {
        // Fallback gracefully if API blocked by browser permissions
      }
    }

    // Visibility change detection (Background sleep)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.status.targetFps = 15;
      } else {
        this.status.targetFps = this.status.isLowPowerMode ? 30 : 60;
      }
      this.notify();
    });
  }

  private updateBatteryInfo(battery: any) {
    this.status.charging = battery.charging;
    this.status.level = battery.level;

    // Auto trigger low power mode if battery < 20% and not charging
    if (battery.level <= 0.2 && !battery.charging) {
      this.status.isLowPowerMode = true;
      this.status.targetFps = 30;
    } else if (!localStorage.getItem('hero_battery_saver_mode')) {
      this.status.isLowPowerMode = false;
      this.status.targetFps = 60;
    }

    this.notify();
  }

  public toggleBatterySaver(force?: boolean): boolean {
    const nextState = force !== undefined ? force : !this.status.isLowPowerMode;
    this.status.isLowPowerMode = nextState;
    this.status.targetFps = nextState ? 30 : 60;

    try {
      localStorage.setItem('hero_battery_saver_mode', nextState ? 'true' : 'false');
    } catch {}

    this.notify();
    return nextState;
  }

  public getStatus(): BatteryStatus {
    return { ...this.status };
  }

  public subscribe(cb: BatteryCallback): () => void {
    this.listeners.add(cb);
    cb({ ...this.status });
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const copy = { ...this.status };
    this.listeners.forEach((cb) => {
      try {
        cb(copy);
      } catch (err) {
        console.error('[BatterySaverManager] Callback error:', err);
      }
    });
  }
}

export const BatterySaverManager = new BatterySaverManagerClass();
