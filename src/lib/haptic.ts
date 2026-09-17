// ─── Haptic Feedback Service ──────────────────────────────────────────────

const HAPTIC_STORAGE_KEY = 'hero_haptic_enabled';

export function isHapticEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(HAPTIC_STORAGE_KEY);
  return saved === null ? true : saved === 'true'; // Default enabled
}

export function setHapticEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HAPTIC_STORAGE_KEY, enabled ? 'true' : 'false');
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'victory' | 'defeat' | 'flip' | 'success' | 'selection' | 'warning' | 'tap' | 'badge_pop' | 'special' | 'battle_start'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  if (!isHapticEnabled()) return;

  try {
    switch (type) {
      case 'light':
      case 'selection':
      case 'tap':
      case 'badge_pop':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
      case 'special':
      case 'battle_start':
        navigator.vibrate([50, 30, 50]);
        break;
      case 'warning':
        navigator.vibrate([30, 40, 30]);
        break;
      case 'flip':
        navigator.vibrate([20, 20, 30]);
        break;
      case 'victory':
      case 'success':
        navigator.vibrate([40, 40, 80, 40, 120]);
        break;
      case 'defeat':
        navigator.vibrate([100, 50, 100]);
        break;
      default:
        navigator.vibrate(20);
        break;
    }
  } catch {
    // Ignore unsupported devices or silent failures
  }
}
