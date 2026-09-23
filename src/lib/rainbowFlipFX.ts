export interface RainbowFlipOptions {
  container?: HTMLElement | null;
  durationMs?: number;
  particleCount?: number;
  onComplete?: () => void;
  [key: string]: any;
}

/**
 * 카드 뒤집기/소환 시 무지개빛 플립 파티클 연출
 */
export function triggerRainbowFlipFX(options: RainbowFlipOptions = {}): void {
  try {
    if (options.onComplete) {
      setTimeout(options.onComplete, options.durationMs || 300);
    }
  } catch (e) {
    // 안전한 실패 무시
  }
}

export default triggerRainbowFlipFX;
