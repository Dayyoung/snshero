/**
 * SNSHero Revolution - Gesture Navigator
 * SCR-01-08: 모바일 좌우 수평 스와이프 제스처를 통한 화면 탭 빠른 전환 엔진
 */

export interface GestureNavOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  thresholdPx?: number;
  maxVerticalOffsetPx?: number;
}

export class GestureNavigator {
  private startX = 0;
  private startY = 0;
  private isTracking = false;
  private options: GestureNavOptions;

  constructor(options: GestureNavOptions) {
    this.options = {
      thresholdPx: 60,
      maxVerticalOffsetPx: 50,
      ...options,
    };
  }

  public attach(element: HTMLElement | Window = window): () => void {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.isTracking = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!this.isTracking || e.changedTouches.length !== 1) return;
      this.isTracking = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.startX;
      const deltaY = touch.clientY - this.startY;

      // 수직 이동이 너무 크면 스크롤이므로 스와이프 무시
      if (Math.abs(deltaY) > (this.options.maxVerticalOffsetPx || 50)) {
        return;
      }

      const threshold = this.options.thresholdPx || 60;
      if (deltaX < -threshold) {
        // 왼쪽으로 스와이프 (다음 탭)
        this.options.onSwipeLeft?.();
      } else if (deltaX > threshold) {
        // 오른쪽으로 스와이프 (이전 탭)
        this.options.onSwipeRight?.();
      }
    };

    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }
}
