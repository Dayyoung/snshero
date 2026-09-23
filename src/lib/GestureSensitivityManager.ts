/**
 * GestureSensitivityManager.ts - SCR-12-14
 * 모바일 사용자 기기 맞춤 스와이프 민감도, 롱프레스 인식 시간, 햅틱 강도 설정 매니저
 */

export interface TouchSensitivitySettings {
  swipeThresholdPx: number; // default 40
  longPressDelayMs: number; // default 300
  hapticIntensity: 'off' | 'light' | 'medium' | 'heavy';
}

const STORAGE_KEY = 'hero_touch_sensitivity';

export class GestureSensitivityManager {
  private settings: TouchSensitivitySettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  public getSettings(): TouchSensitivitySettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<TouchSensitivitySettings>) {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // LocalStorage fallback
    }
  }

  private loadSettings(): TouchSensitivitySettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      swipeThresholdPx: 40,
      longPressDelayMs: 300,
      hapticIntensity: 'medium',
    };
  }
}
