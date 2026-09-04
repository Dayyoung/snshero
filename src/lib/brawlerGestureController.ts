/**
 * brawlerGestureController.ts
 * 3D 격투/대난투 미션 가상 버튼 완전 제거 ➔ 엄지 스와이프 위빙 & 탭 카운터 100% 퓨어 터치 컨트롤러
 * (구글 스프레드시트 Row 860 / ID 552 요구사항 구현)
 */

export interface BrawlerCombatActionHandlers {
  onJabTap: (x: number, y: number) => void;
  onWeaveDodge: (direction: 'left' | 'right' | 'back') => void;
  onCounterUppercut: () => void;
  onHeavyChargeSmash: (durationMs: number) => void;
}

export class BrawlerGestureController {
  private element: HTMLElement;
  private handlers: BrawlerCombatActionHandlers;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isHolding = false;
  private holdTimer: NodeJS.Timeout | null = null;
  private readonly HOLD_THRESHOLD_MS = 450;
  private readonly SWIPE_THRESHOLD_PX = 35;

  constructor(element: HTMLElement, handlers: BrawlerCombatActionHandlers) {
    this.element = element;
    this.handlers = handlers;
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

    this.holdTimer = setTimeout(() => {
      this.isHolding = true;
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
  };

  private onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    const duration = Date.now() - this.startTime;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const distance = Math.hypot(dx, dy);

    // 1. Gesture Swipes
    if (distance > this.SWIPE_THRESHOLD_PX) {
      // Upward Flick ➔ Counter Uppercut
      if (dy < -this.SWIPE_THRESHOLD_PX && Math.abs(dy) > Math.abs(dx)) {
        this.handlers.onCounterUppercut();
        return;
      }
      // Horizontal Swipes ➔ Weave Left/Right Dodge
      if (Math.abs(dx) > Math.abs(dy)) {
        this.handlers.onWeaveDodge(dx > 0 ? 'right' : 'left');
        return;
      }
      // Downward Swipe ➔ Back Step Dodge
      if (dy > this.SWIPE_THRESHOLD_PX) {
        this.handlers.onWeaveDodge('back');
        return;
      }
    }

    // 2. Heavy Charge Smash (Hold)
    if (this.isHolding || duration >= this.HOLD_THRESHOLD_MS) {
      this.handlers.onHeavyChargeSmash(duration);
      return;
    }

    // 3. Quick Tap ➔ Basic Jab / Combo
    this.handlers.onJabTap(e.clientX, e.clientY);
  };

  private onPointerCancel = () => {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    this.isHolding = false;
    this.startTime = 0;
  };
}
