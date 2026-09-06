/**
 * brawlerGestureController.ts
 * 3D 격투/대난투 미션 가상 버튼 완전 제거 및 '엄지 스와이프 위빙 & 탭 타격/스매시' 100% 퓨어 제스처 컨트롤러
 * (구글 스프레드시트 Row 996 / ID 576 요구사항 구현)
 */

export type BrawlerActionType =
  | 'idle'
  | 'footwork'      // 엄지 드래그 (이동)
  | 'combo_strike'  // 단일 탭 (연타 콤보)
  | 'weave_dodge'   // 빠른 스와이프 (위빙 회피)
  | 'charged_smash' // 롱프레스 (차지 강타)
  | 'dash';         // 더블탭 (순간 돌진)

export interface BrawlerGestureState {
  currentAction: BrawlerActionType;
  moveX: number; // -1.0 ~ +1.0
  moveY: number; // -1.0 ~ +1.0
  comboCount: number;
  isWeaving: boolean;
  weaveDirection: 'left' | 'right' | 'back' | null;
  chargeRatio: number; // 0.0 ~ 1.0
  isCharging: boolean;
  lastActionTimestamp: number;
}

export class BrawlerGestureController {
  private element: HTMLElement | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTapTime = 0;
  private holdTimer: NodeJS.Timeout | null = null;
  private chargeInterval: NodeJS.Timeout | null = null;

  private onActionCallback: ((action: BrawlerActionType, state: BrawlerGestureState) => void) | null = null;

  private state: BrawlerGestureState = {
    currentAction: 'idle',
    moveX: 0,
    moveY: 0,
    comboCount: 0,
    isWeaving: false,
    weaveDirection: null,
    chargeRatio: 0,
    isCharging: false,
    lastActionTimestamp: Date.now(),
  };

  private readonly SWIPE_THRESHOLD_PX = 45;
  private readonly DOUBLE_TAP_WINDOW_MS = 250;
  private readonly HOLD_CHARGE_MS = 320;

  constructor(targetElement?: HTMLElement) {
    if (targetElement) {
      this.attach(targetElement);
    }
  }

  public attach(targetElement: HTMLElement): void {
    this.detach();
    this.element = targetElement;

    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  public detach(): void {
    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchmove', this.handleTouchMove);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
      this.element.removeEventListener('touchcancel', this.handleTouchEnd);
      this.element = null;
    }
    this.clearTimers();
  }

  public onAction(callback: (action: BrawlerActionType, state: BrawlerGestureState) => void): void {
    this.onActionCallback = callback;
  }

  public getState(): Readonly<BrawlerGestureState> {
    return this.state;
  }

  private clearTimers(): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.chargeInterval) {
      clearInterval(this.chargeInterval);
      this.chargeInterval = null;
    }
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const now = Date.now();

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = now;
    this.state.chargeRatio = 0;
    this.state.isCharging = false;

    // 더블탭 감지 -> 순간 전방 대시 (Dash)
    if (now - this.lastTapTime < this.DOUBLE_TAP_WINDOW_MS) {
      this.triggerAction('dash');
      this.lastTapTime = 0;
      this.clearTimers();
      return;
    }
    this.lastTapTime = now;

    // 롱프레스 감지 -> 차지 스매시 준비
    this.clearTimers();
    this.holdTimer = setTimeout(() => {
      this.state.isCharging = true;
      this.chargeInterval = setInterval(() => {
        this.state.chargeRatio = Math.min(1.0, this.state.chargeRatio + 0.1);
        if (this.state.chargeRatio >= 1.0 && this.chargeInterval) {
          clearInterval(this.chargeInterval);
          this.chargeInterval = null;
        }
      }, 50);
    }, this.HOLD_CHARGE_MS);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];

    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 드래그 발생 시 차징 취소 및 풋워크(이동) 전환
    if (dist > 15) {
      this.clearTimers();
      this.state.isCharging = false;
      this.state.currentAction = 'footwork';
      this.state.moveX = Math.max(-1, Math.min(1, dx / 80));
      this.state.moveY = Math.max(-1, Math.min(1, dy / 80));
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    const elapsed = Date.now() - this.touchStartTime;
    const touch = e.changedTouches[0];
    const dx = touch ? touch.clientX - this.touchStartX : 0;
    const dy = touch ? touch.clientY - this.touchStartY : 0;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // 1. 차지 스매시 릴리즈
    if (this.state.isCharging && this.state.chargeRatio >= 0.5) {
      this.triggerAction('charged_smash');
    }
    // 2. 빠른 스와이프 위빙 회피 (Weave / Dodge)
    else if (elapsed < 300 && (absX > this.SWIPE_THRESHOLD_PX || absY > this.SWIPE_THRESHOLD_PX)) {
      if (absX > absY) {
        this.state.weaveDirection = dx < 0 ? 'left' : 'right';
      } else {
        this.state.weaveDirection = 'back';
      }
      this.state.isWeaving = true;
      this.triggerAction('weave_dodge');

      setTimeout(() => {
        this.state.isWeaving = false;
        this.state.weaveDirection = null;
      }, 400);
    }
    // 3. 짧은 탭 -> 기본 콤보 타격 (Combo Strike)
    else if (elapsed < 300 && absX < 15 && absY < 15) {
      this.state.comboCount = (this.state.comboCount % 3) + 1;
      this.triggerAction('combo_strike');
    }

    this.clearTimers();
    this.state.moveX = 0;
    this.state.moveY = 0;
    this.state.isCharging = false;
    this.state.chargeRatio = 0;
  };

  private triggerAction(action: BrawlerActionType): void {
    this.state.currentAction = action;
    this.state.lastActionTimestamp = Date.now();
    this.onActionCallback?.(action, this.state);
  }
}
