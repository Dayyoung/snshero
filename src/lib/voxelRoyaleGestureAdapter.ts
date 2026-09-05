/**
 * voxelRoyaleGestureAdapter.ts
 * 3D 배틀로얄/FPS 미션 가상 버튼 완전 제거 ➔ 엄지 드래그 조향 & 릴리즈 사격 퓨어 제스처 어댑터
 * (구글 스프레드시트 Row 896 / ID 552 요구사항 구현)
 */

export interface RoyaleActionCallbacks {
  onSteerMove: (normDeltaX: number, normDeltaY: number) => void;
  onReleaseAutoShoot: () => void;
  onDoubleTapEvade: () => void;
  onScopeZoomToggle: (isZoomed: boolean) => void;
  onStopMove?: () => void;
}

export class VoxelRoyaleGestureAdapter {
  private element: HTMLElement;
  private callbacks: RoyaleActionCallbacks;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private lastTapTime = 0;
  private isHolding = false;
  private isZoomed = false;
  private holdTimer: NodeJS.Timeout | null = null;
  private readonly HOLD_THRESHOLD_MS = 500;
  private readonly DOUBLE_TAP_WINDOW_MS = 300;

  constructor(element: HTMLElement, callbacks: RoyaleActionCallbacks) {
    this.element = element;
    this.callbacks = callbacks;
    this.attachEvents();
  }

  private attachEvents() {
    this.element.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.element.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.element.addEventListener('pointerup', this.onPointerUp, { passive: false });
    this.element.addEventListener('pointercancel', this.onPointerCancel, { passive: false });
  }

  public destroy() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerCancel);
    if (this.holdTimer) clearTimeout(this.holdTimer);
  }

  private onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startTime = Date.now();
    this.isHolding = false;

    // Check double tap for evasion roll
    const now = Date.now();
    if (now - this.lastTapTime < this.DOUBLE_TAP_WINDOW_MS) {
      this.callbacks.onDoubleTapEvade();
      this.lastTapTime = 0;
      return;
    }
    this.lastTapTime = now;

    // Hold for scope zoom
    this.holdTimer = setTimeout(() => {
      this.isHolding = true;
      this.isZoomed = true;
      this.callbacks.onScopeZoomToggle(true);
    }, this.HOLD_THRESHOLD_MS);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.startTime) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (Math.hypot(dx, dy) > 15 && this.holdTimer && !this.isHolding) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    const rect = this.element.getBoundingClientRect();
    const normX = Math.max(-1, Math.min(1, dx / (rect.width * 0.4)));
    const normY = Math.max(-1, Math.min(1, dy / (rect.height * 0.4)));
    this.callbacks.onSteerMove(normX, normY);
  };

  private onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    if (this.isZoomed) {
      this.isZoomed = false;
      this.callbacks.onScopeZoomToggle(false);
    }

    this.callbacks.onStopMove?.();

    // Release to auto-shoot nearest enemy
    const duration = Date.now() - this.startTime;
    if (duration > 60 && !this.isHolding) {
      this.callbacks.onReleaseAutoShoot();
    }

    this.isHolding = false;
    this.startTime = 0;
  };

  private onPointerCancel = () => {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.isZoomed) {
      this.isZoomed = false;
      this.callbacks.onScopeZoomToggle(false);
    }
    this.callbacks.onStopMove?.();
    this.isHolding = false;
    this.startTime = 0;
  };
}
