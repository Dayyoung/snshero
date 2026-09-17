/**
 * ChartGestureEngine.ts
 * 모바일 터치 제스처(핀치 투 줌, 수평 패닝, 롱프레스 십자선) 엔진
 * 60fps 부드러운 차트 탐색 지원
 */

export interface ChartGestureState {
  scale: number; // 0.5 ~ 3.0
  offsetX: number; // horizontal pan offset
  isDragging: boolean;
  crosshair: { x: number; y: number } | null;
}

export interface ChartGestureCallbacks {
  onStateChange: (state: ChartGestureState) => void;
  onTap?: (x: number, y: number) => void;
}

export class ChartGestureEngine {
  private element: HTMLElement | null = null;
  private state: ChartGestureState = {
    scale: 1,
    offsetX: 0,
    isDragging: false,
    crosshair: null,
  };

  private callbacks: ChartGestureCallbacks;
  private initialPinchDist = 0;
  private initialScale = 1;
  private lastTouchX = 0;
  private longPressTimer: any = null;
  private isLongPress = false;
  private maxOffsetX = 0;
  private minOffsetX = -1000;

  constructor(callbacks: ChartGestureCallbacks) {
    this.callbacks = callbacks;
  }

  public attach(el: HTMLElement, contentWidth: number, viewportWidth: number) {
    this.element = el;
    this.updateBounds(contentWidth, viewportWidth);

    el.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    el.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    el.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  public detach() {
    if (!this.element) return;
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);
    this.clearLongPress();
    this.element = null;
  }

  public updateBounds(contentWidth: number, viewportWidth: number) {
    this.maxOffsetX = 0;
    this.minOffsetX = Math.min(0, viewportWidth - contentWidth * this.state.scale);
    this.clampOffset();
  }

  private clampOffset() {
    if (this.state.offsetX > this.maxOffsetX) {
      this.state.offsetX = this.maxOffsetX;
    }
    if (this.state.offsetX < this.minOffsetX) {
      this.state.offsetX = this.minOffsetX;
    }
  }

  private clearLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.element?.getBoundingClientRect();
      if (!rect) return;

      this.lastTouchX = touch.clientX;
      this.state.isDragging = true;
      this.isLongPress = false;

      const localX = touch.clientX - rect.left;
      const localY = touch.clientY - rect.top;

      // 롱프레스 타이머 (220ms 유지 시 십자선 활성화)
      this.clearLongPress();
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true;
        this.state.crosshair = { x: localX, y: localY };
        this.callbacks.onStateChange({ ...this.state });
        if (navigator.vibrate) navigator.vibrate(15);
      }, 220);
    } else if (e.touches.length === 2) {
      e.preventDefault();
      this.clearLongPress();
      this.state.crosshair = null;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      this.initialScale = this.state.scale;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    const rect = this.element?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const localX = touch.clientX - rect.left;
      const localY = touch.clientY - rect.top;

      if (this.isLongPress) {
        // 십자선 이동
        e.preventDefault();
        this.state.crosshair = { x: localX, y: localY };
        this.callbacks.onStateChange({ ...this.state });
        return;
      }

      const deltaX = touch.clientX - this.lastTouchX;
      if (Math.abs(deltaX) > 5) {
        this.clearLongPress();
      }

      this.lastTouchX = touch.clientX;
      this.state.offsetX += deltaX;
      this.clampOffset();
      this.callbacks.onStateChange({ ...this.state });
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (this.initialPinchDist > 0) {
        const factor = dist / this.initialPinchDist;
        const newScale = Math.min(3.0, Math.max(0.5, this.initialScale * factor));
        this.state.scale = newScale;
        this.clampOffset();
        this.callbacks.onStateChange({ ...this.state });
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    this.clearLongPress();
    this.state.isDragging = false;
    if (this.isLongPress && e.touches.length === 0) {
      // 롱프레스 해제 후 잠시 유지 또는 탭 시 초기화
    } else if (!this.isLongPress && this.state.crosshair) {
      this.state.crosshair = null;
    }
    this.callbacks.onStateChange({ ...this.state });
  };

  public resetCrosshair() {
    this.state.crosshair = null;
    this.callbacks.onStateChange({ ...this.state });
  }

  public setZoom(scale: number) {
    this.state.scale = Math.min(3.0, Math.max(0.5, scale));
    this.clampOffset();
    this.callbacks.onStateChange({ ...this.state });
  }
}
