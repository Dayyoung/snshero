export interface GestureNavigatorOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export class GestureNavigator {
  private options: GestureNavigatorOptions;
  private startX = 0;
  private startY = 0;

  constructor(options: GestureNavigatorOptions) {
    this.options = options;
  }

  attach(target: HTMLElement | Window = window): () => void {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 1) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches && e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - this.startX;
        const dy = e.changedTouches[0].clientY - this.startY;
        const threshold = this.options.threshold || 50;

        if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) {
            this.options.onSwipeLeft?.();
          } else {
            this.options.onSwipeRight?.();
          }
        }
      }
    };

    target.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    target.addEventListener('touchend', handleTouchEnd as any, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart as any);
      target.removeEventListener('touchend', handleTouchEnd as any);
    };
  }
}

export default GestureNavigator;
