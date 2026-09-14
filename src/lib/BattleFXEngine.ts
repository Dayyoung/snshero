/**
 * Row 1053 / ID 316: Screen Shake & Hit-Stop Impact FX Engine
 * Triggers 80ms camera micro-shake (3px) and 60ms hit-stop pause upon card capture.
 */

export class BattleFXEngine {
  private static isShaking = false;

  /**
   * Trigger card capture impact effect
   * @param boardElement DOM element to apply shake to (defaults to root or main battle board)
   */
  public static async triggerCardCaptureImpact(boardElement?: HTMLElement | null): Promise<void> {
    // 1. Mobile Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 30, 15]);
      } catch {
        // Ignore haptic errors on unsupported devices
      }
    }

    // 2. Micro Screen Shake (80ms, 3px)
    const targetEl = boardElement || document.querySelector('.battle-board-root') || document.body;
    if (targetEl && !this.isShaking) {
      this.isShaking = true;
      targetEl.classList.add('animate-micro-shake');
      setTimeout(() => {
        targetEl.classList.remove('animate-micro-shake');
        this.isShaking = false;
      }, 80);
    }

    // 3. Hit-Stop Pause (60ms micro-pause before proceeding)
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
}
