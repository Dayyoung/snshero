interface GestureNavigatorOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export class GestureNavigator {
  private options: GestureNavigatorOptions;
  private startX: number = 0;
  private startY: number = 0;
  private threshold: number;

  constructor(options: GestureNavigatorOptions) {
    this.options = options;
    this.threshold = options.threshold ?? 50;
  }

  attach(target: EventTarget = window): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (touchEvent.touches && touchEvent.touches.length === 1) {
        this.startX = touchEvent.touches[0].clientX;
        this.startY = touchEvent.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (!touchEvent.changedTouches || touchEvent.changedTouches.length === 0) return;
      
      const endX = touchEvent.changedTouches[0].clientX;
      const endY = touchEvent.changedTouches[0].clientY;
      const deltaX = endX - this.startX;
      const deltaY = endY - this.startY;

      // Only trigger if horizontal movement is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > this.threshold) {
        if (deltaX < 0 && this.options.onSwipeLeft) {
          this.options.onSwipeLeft();
        } else if (deltaX > 0 && this.options.onSwipeRight) {
          this.options.onSwipeRight();
        }
      }
    };

    target.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    target.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart as EventListener);
      target.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }
}

export default GestureNavigator;
