/**
 * combatGestureController.ts
 * 3D 격투/투기장 미션 가상 액션패드 100% 제거 ➔ 엄지 스와이프 콤보 & 탭 패링 퓨어 제스처 컨트롤러
 * (구글 스프레드시트 Row 723 / ID 564 요구사항 구현)
 */

import React from 'react';

export type CombatActionType = 'jab' | 'uppercut' | 'weave_left' | 'weave_right' | 'charged_strike' | 'parry_block' | 'idle';

export interface CombatActionPayload {
  action: CombatActionType;
  comboCount: number;
  powerMultiplier: number;
  timestamp: number;
}

export class CombatGestureController {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isPointerDown = false;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private comboCount = 0;
  private lastActionTime = 0;
  private onActionTriggered?: (payload: CombatActionPayload) => void;

  constructor(onActionTriggered?: (payload: CombatActionPayload) => void) {
    this.onActionTriggered = onActionTriggered;
  }

  public handlePointerDown(e: React.PointerEvent | PointerEvent, containerRect: DOMRect) {
    this.isPointerDown = true;
    this.startX = e.clientX - containerRect.left;
    this.startY = e.clientY - containerRect.top;
    this.startTime = Date.now();

    // 롱프레스 감지 (350ms 이상 홀드 시 차지 스트레이트 / 파워 블록)
    this.longPressTimer = setTimeout(() => {
      if (this.isPointerDown) {
        this.emitAction('charged_strike', 1.8);
      }
    }, 350);
  }

  public handlePointerUp(e: React.PointerEvent | PointerEvent, containerRect: DOMRect) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const curX = e.clientX - containerRect.left;
    const curY = e.clientY - containerRect.top;
    const dx = curX - this.startX;
    const dy = curY - this.startY;
    const duration = Date.now() - this.startTime;

    if (duration > 350) {
      // 이미 롱프레스 처리됨
      return;
    }

    const moveDist = Math.hypot(dx, dy);

    if (moveDist < 15) {
      // 1. 단일 탭 = 잽 / 기본 타격 (Quick Jab Combo)
      this.emitAction('jab', 1.0);
    } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      // 2. 좌우 스와이프 = 위빙 회피 (Dodge / Weave)
      if (dx < 0) {
        this.emitAction('weave_left', 1.2);
      } else {
        this.emitAction('weave_right', 1.2);
      }
    } else if (dy < -30) {
      // 3. 상향 스와이프 = 카운터 어퍼컷 (Uppercut)
      this.emitAction('uppercut', 1.5);
    } else if (dy > 30) {
      // 4. 하향 스와이프 = 패링 / 가드 (Parry)
      this.emitAction('parry_block', 1.1);
    }
  }

  private emitAction(action: CombatActionType, powerMultiplier: number) {
    const now = Date.now();
    if (now - this.lastActionTime < 600) {
      this.comboCount = Math.min(10, this.comboCount + 1);
    } else {
      this.comboCount = 1;
    }
    this.lastActionTime = now;

    if (this.onActionTriggered) {
      this.onActionTriggered({
        action,
        comboCount: this.comboCount,
        powerMultiplier: powerMultiplier + (this.comboCount * 0.05),
        timestamp: now
      });
    }
  }
}
