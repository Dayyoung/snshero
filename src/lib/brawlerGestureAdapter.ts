/**
 * brawlerGestureAdapter.ts
 * 3D 격투/콜로세움/복싱 미션 가상 펀치·가드 버튼 제거 및 화면 탭 콤보/스와이프 카운터 전환
 * (구글 스프레드시트 Row 807 / ID 560 요구사항 구현)
 */

export interface BrawlerCallbacks {
  onTapCombo: (comboIndex: number, tapX: number, tapY: number) => void;
  onWeaveDodge: (direction: 'left' | 'right' | 'back') => void;
  onJustGuardParry: (timingAccuracy: number) => void;
  onChargeHeavyStrike: (chargeDurationMs: number) => void;
  onMove?: (normDeltaX: number, normDeltaY: number) => void;
}

export class BrawlerGestureAdapter {
  private element: HTMLElement;
  private callbacks: BrawlerCallbacks;
  private comboChain: number = 0;
  private lastTapTime: number = 0;
  private pressStartTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isHolding: boolean = false;
  private holdTimer: NodeJS.Timeout | null = null;
  private readonly COMBO_RESET_MS = 850;
  private readonly CHARGE_THRESHOLD_MS = 400;

  constructor(element: HTMLElement, callbacks: BrawlerCallbacks) {
    this.element = element;
    this.callbacks = callbacks;
    this.attachEvents();
  }

  private attachEvents() {
    this.element.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    this.element.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    this.element.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    this.element.addEventListener('pointercancel', this.handlePointerCancel, { passive: false });
  }

  public destroy() {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerCancel);
    if (this.holdTimer) clearTimeout(this.holdTimer);
  }

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.pressStartTime = Date.now();
    this.isHolding = false;

    // Start hold timer for Heavy Charge Strike
    this.holdTimer = setTimeout(() => {
      this.isHolding = true;
    }, this.CHARGE_THRESHOLD_MS);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.pressStartTime) return;
    const dx = e.clientX - this.touchStartX;
    const dy = e.clientY - this.touchStartY;

    if (Math.hypot(dx, dy) > 15 && this.holdTimer && !this.isHolding) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    if (this.callbacks.onMove) {
      const rect = this.element.getBoundingClientRect();
      const normX = (dx / (rect.width * 0.5));
      const normY = (dy / (rect.height * 0.5));
      this.callbacks.onMove(Math.max(-1, Math.min(1, normX)), Math.max(-1, Math.min(1, normY)));
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    e.preventDefault();
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    const duration = Date.now() - this.pressStartTime;
    const dx = e.clientX - this.touchStartX;
    const dy = e.clientY - this.touchStartY;
    const distance = Math.hypot(dx, dy);

    // 1. Swipe Weave / Dodge check (> 35px)
    if (distance > 35) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.callbacks.onWeaveDodge(dx > 0 ? 'right' : 'left');
      } else if (dy > 0) {
        this.callbacks.onWeaveDodge('back');
      }
      return;
    }

    // 2. Heavy Charge Strike check
    if (duration >= this.CHARGE_THRESHOLD_MS || this.isHolding) {
      this.callbacks.onChargeHeavyStrike(duration);
      this.comboChain = 0;
      return;
    }

    // 3. Quick Tap Combo or Just Guard
    const now = Date.now();
    if (now - this.lastTapTime > this.COMBO_RESET_MS) {
      this.comboChain = 1;
    } else {
      this.comboChain = (this.comboChain % 3) + 1;
    }
    this.lastTapTime = now;

    // Trigger Reactive Tap-Combo
    this.callbacks.onTapCombo(this.comboChain, e.clientX, e.clientY);
  };

  private handlePointerCancel = () => {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    this.isHolding = false;
    this.pressStartTime = 0;
  };
}
