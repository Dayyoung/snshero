/**
 * oneThumbShooterAdapter.ts
 * 3D 사격형/FPS 미션 가상 조이스틱/버튼 완전 제거 및 릴리즈 오토샷 퓨어 제스처 어댑터
 * (구글 스프레드시트 Row 944 / ID 548 요구사항 구현)
 */

export interface ShooterControlState {
  aimX: number;          // 화면 내 정규화 조준 좌표 (-1.0 ~ +1.0)
  aimY: number;          // 화면 내 정규화 조준 좌표 (-1.0 ~ +1.0)
  isAiming: boolean;     // 엄지 터치 조준 중
  isSnipingMode: boolean;// 0.4초 이상 홀드 시 정밀 저격 모드
  isDodging: boolean;    // 더블탭 회피 중
  lastShotTriggered: boolean;
}

export class OneThumbShooterAdapter {
  private element: HTMLElement | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private lastTouchTime = 0;
  private holdTimer: NodeJS.Timeout | null = null;
  private shotCallback: ((x: number, y: number, isSniper: boolean) => void) | null = null;

  private state: ShooterControlState = {
    aimX: 0,
    aimY: 0,
    isAiming: false,
    isSnipingMode: false,
    isDodging: false,
    lastShotTriggered: false,
  };

  private readonly DRAG_SENSITIVITY = 0.005;
  private readonly DOUBLE_TAP_MS = 260;
  private readonly HOLD_SNIPE_MS = 380;

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
    if (this.holdTimer) clearTimeout(this.holdTimer);
  }

  public onShot(callback: (x: number, y: number, isSniper: boolean) => void): void {
    this.shotCallback = callback;
  }

  public getState(): Readonly<ShooterControlState> {
    return this.state;
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const now = Date.now();

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.state.isAiming = true;
    this.state.lastShotTriggered = false;

    // 더블탭 감지 -> 회피
    if (now - this.lastTouchTime < this.DOUBLE_TAP_MS) {
      this.state.isDodging = true;
      setTimeout(() => {
        this.state.isDodging = false;
      }, 400);
      this.lastTouchTime = 0;
      return;
    }
    this.lastTouchTime = now;

    // 홀드 감지 -> 정밀 저격 모드 전환
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = setTimeout(() => {
      this.state.isSnipingMode = true;
    }, this.HOLD_SNIPE_MS);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];

    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    // 조준선 갱신 (-1.0 ~ +1.0 클램핑)
    this.state.aimX = Math.max(-1, Math.min(1, this.state.aimX + dx * this.DRAG_SENSITIVITY));
    this.state.aimY = Math.max(-1, Math.min(1, this.state.aimY + dy * this.DRAG_SENSITIVITY));

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  };

  private handleTouchEnd = (): void => {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    // 손가락을 뗄 때 릴리즈 사격(Auto-Shot) 트리거!
    if (this.state.isAiming && !this.state.isDodging) {
      this.state.lastShotTriggered = true;
      this.shotCallback?.(this.state.aimX, this.state.aimY, this.state.isSnipingMode);
    }

    this.state.isAiming = false;
    this.state.isSnipingMode = false;
  };
}
