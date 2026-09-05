/**
 * flightGestureAdapter.ts
 * 3D 비행/도그파이트 미션 가상 요크·버튼 완전 제거 및 '스와이프 피치/롤 퓨어 제스처 컨트롤러'
 * (구글 스프레드시트 Row 956 / ID 552 요구사항 구현)
 */

export interface FlightControlState {
  pitch: number;      // -1.0 (Down) ~ +1.0 (Up)
  yaw: number;        // -1.0 (Left) ~ +1.0 (Right)
  roll: number;       // -1.0 (Bank Left) ~ +1.0 (Bank Right)
  isBoosting: boolean; // 애프터버너 부스터 (홀드 제스처)
  isBarrelRolling: boolean; // 360도 배럴 롤 회피 (더블탭)
  barrelRollDirection: 'left' | 'right' | null;
  isAutoLeveling: boolean;  // 릴리즈 시 자동 수평 복원
}

export class FlightGestureAdapter {
  private element: HTMLElement | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private lastTouchTime = 0;
  private holdTimer: NodeJS.Timeout | null = null;
  private rollTimer: NodeJS.Timeout | null = null;

  private state: FlightControlState = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    isBoosting: false,
    isBarrelRolling: false,
    barrelRollDirection: null,
    isAutoLeveling: true,
  };

  private readonly DRAG_DEADZONE = 5;
  private readonly MAX_DRAG_PX = 80;
  private readonly DOUBLE_TAP_WINDOW_MS = 280;
  private readonly HOLD_BOOST_MS = 250;

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
    if (this.rollTimer) clearTimeout(this.rollTimer);
  }

  public getState(): Readonly<FlightControlState> {
    return this.state;
  }

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const now = Date.now();

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.state.isAutoLeveling = false;

    // 더블탭 감지 -> 360도 배럴 롤 회피 발동
    if (now - this.lastTouchTime < this.DOUBLE_TAP_WINDOW_MS) {
      const screenMid = window.innerWidth / 2;
      const rollDir = touch.clientX < screenMid ? 'left' : 'right';
      this.triggerBarrelRoll(rollDir);
      this.lastTouchTime = 0;
      return;
    }
    this.lastTouchTime = now;

    // 홀드 감지 -> 애프터버너 부스터 발동
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = setTimeout(() => {
      this.state.isBoosting = true;
    }, this.HOLD_BOOST_MS);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];

    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    // 데드존 체크
    if (Math.abs(dx) < this.DRAG_DEADZONE && Math.abs(dy) < this.DRAG_DEADZONE) {
      return;
    }

    // 드래그 방향에 따른 요(Yaw) 및 피치(Pitch) 계산 (-1.0 ~ +1.0)
    const clampedX = Math.max(-this.MAX_DRAG_PX, Math.min(this.MAX_DRAG_PX, dx));
    const clampedY = Math.max(-this.MAX_DRAG_PX, Math.min(this.MAX_DRAG_PX, dy));

    this.state.yaw = Number((clampedX / this.MAX_DRAG_PX).toFixed(2));
    this.state.pitch = Number((-clampedY / this.MAX_DRAG_PX).toFixed(2)); // 위로 밀면 상승
    this.state.roll = Number((this.state.yaw * 0.6).toFixed(2)); // 조향 시 자연스러운 뱅크 롤
  };

  private handleTouchEnd = (): void => {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    // 릴리즈 시 조향 리셋 및 자동 수평 복원
    this.state.yaw = 0;
    this.state.pitch = 0;
    this.state.roll = 0;
    this.state.isBoosting = false;
    this.state.isAutoLeveling = true;
  };

  private triggerBarrelRoll(direction: 'left' | 'right'): void {
    this.state.isBarrelRolling = true;
    this.state.barrelRollDirection = direction;
    this.state.roll = direction === 'left' ? -1.0 : 1.0;

    if (this.rollTimer) clearTimeout(this.rollTimer);
    this.rollTimer = setTimeout(() => {
      this.state.isBarrelRolling = false;
      this.state.barrelRollDirection = null;
      this.state.roll = 0;
      this.state.isAutoLeveling = true;
    }, 600); // 0.6초 배럴롤 무적 시간
  }
}
