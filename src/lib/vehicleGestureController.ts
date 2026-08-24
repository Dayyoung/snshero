/**
 * VehicleGestureController.ts
 * 3D 레이싱/카트 미션 가상 핸들·페달 버튼 완전 제거 ➔ 썸존 슬라이드 조향 & 릴리즈 드리프트 퓨어 제스처 컨트롤러
 * (구글 스프레드시트 Row 587, 591 요구사항 구현)
 */
import React from 'react';

export interface VehicleControlState {
  steer: number;      // -1.0 (좌) ~ +1.0 (우)
  throttle: number;   // 0.0 ~ 1.0 (자동 크루즈 기본 주행 + 가속)
  isBraking: boolean; // 하단 홀드 시 브레이크/후진
  isDrifting: boolean;// 코너링 중 드리프트 상태
  nitroBoost: boolean;// 릴리즈 튕기기 미니 터보 부스터 발동
  useItem: boolean;   // 더블탭 아이템 발동
}

export class VehicleGestureController {
  private state: VehicleControlState = {
    steer: 0,
    throttle: 0.6, // 기본 오토 크루즈
    isBraking: false,
    isDrifting: false,
    nitroBoost: false,
    useItem: false
  };

  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isPointerDown = false;
  private lastTapTime = 0;
  private driftCharging = 0;
  private onStateChange?: (state: VehicleControlState) => void;

  constructor(onStateChange?: (state: VehicleControlState) => void) {
    this.onStateChange = onStateChange;
  }

  public handlePointerDown(e: React.PointerEvent | PointerEvent, containerRect: DOMRect) {
    this.isPointerDown = true;
    this.startX = e.clientX - containerRect.left;
    this.startY = e.clientY - containerRect.top;
    this.startTime = Date.now();
    this.driftCharging = 0;
    this.state.nitroBoost = false;
    this.state.useItem = false;

    // Double Tap detection (Item trigger)
    const now = Date.now();
    if (now - this.lastTapTime < 280) {
      this.state.useItem = true;
      this.notify();
      setTimeout(() => {
        this.state.useItem = false;
        this.notify();
      }, 100);
    }
    this.lastTapTime = now;
  }

  public handlePointerMove(e: React.PointerEvent | PointerEvent, containerRect: DOMRect) {
    if (!this.isPointerDown) return;
    const curX = e.clientX - containerRect.left;
    const curY = e.clientY - containerRect.top;
    const dx = curX - this.startX;
    const dy = curY - this.startY;

    // 1. Thumb-slide Steering (-1.0 to 1.0)
    const maxSteerDist = Math.min(120, containerRect.width * 0.35);
    this.state.steer = Math.max(-1, Math.min(1, dx / maxSteerDist));

    // 2. Cornering Drift Detection
    if (Math.abs(this.state.steer) > 0.45) {
      this.state.isDrifting = true;
      this.driftCharging += 1;
    } else {
      this.state.isDrifting = false;
    }

    // 3. Downward Hold = Braking / Reverse
    if (dy > 40) {
      this.state.isBraking = true;
      this.state.throttle = 0;
    } else {
      this.state.isBraking = false;
      this.state.throttle = dy < -20 ? 1.0 : 0.7; // 위로 슬라이드 시 추가 가속
    }

    this.notify();
  }

  public handlePointerUp(_e?: React.PointerEvent | PointerEvent, _containerRect?: DOMRect) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const duration = Date.now() - this.startTime;

    // Flick Release -> Mini Turbo Drift Boost Trigger!
    if (this.state.isDrifting && this.driftCharging > 8 && duration < 2500) {
      this.state.nitroBoost = true;
      setTimeout(() => {
        this.state.nitroBoost = false;
        this.notify();
      }, 400);
    }

    // Reset controls to neutral auto-cruise
    this.state.steer = 0;
    this.state.throttle = 0.6;
    this.state.isBraking = false;
    this.state.isDrifting = false;
    this.driftCharging = 0;
    this.notify();
  }

  public getState(): Readonly<VehicleControlState> {
    return this.state;
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }
}
