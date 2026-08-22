/**
 * OneThumbMeleeGestureAdapter.ts
 * Mobile-First Pure Gesture Adapter for 3D Melee / Combat / Arena Mission Games
 * 
 * Controls:
 * - Drag: Free 360° Movement & Strafing around targets
 * - Tap: Quick Melee Slash / Attack (Chains 3-Hit Combos: Light -> Medium -> Finisher)
 * - Swipe (Horizontal/Up): Timed Parry / Guard Stance against incoming strikes
 * - Double-Tap: Evasive Roll / Flash Dodge in move direction
 * - Hold (Long Press): Heavy Charge Strike / Guard Breaker
 */

import { PureGestureController, GestureState } from './pureGestureController';

export interface MeleeCombatant {
  x: number;
  z: number;
  hp: number;
  isAlive: boolean;
  isAttacking?: boolean;
}

export interface MeleeCallbacks {
  onMove: (normX: number, normZ: number, deltaLength: number) => void;
  onComboSlash: (comboIndex: number, tapX: number, tapY: number) => void;
  onParryGuard: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onEvasiveDodge: (dodgeAngleRad: number) => void;
  onChargeStrike: (chargeDurationMs: number) => void;
  onHoldStart?: () => void;
}

export class OneThumbMeleeGestureAdapter {
  private controller: PureGestureController;
  private callbacks: MeleeCallbacks;
  private comboChain: number = 0;
  private lastAttackTime: number = 0;
  private readonly COMBO_RESET_DELAY_MS = 900;

  constructor(element: HTMLElement, callbacks: MeleeCallbacks) {
    this.callbacks = callbacks;

    this.controller = new PureGestureController(element, {
      onDrag: (state: GestureState) => {
        // Invert Y for 3D Z-plane movement
        this.callbacks.onMove(state.normDeltaX, -state.normDeltaY, state.distance);
      },
      onTap: (tapX: number, tapY: number) => {
        const now = Date.now();
        if (now - this.lastAttackTime > this.COMBO_RESET_DELAY_MS) {
          this.comboChain = 1;
        } else {
          this.comboChain = (this.comboChain % 3) + 1;
        }
        this.lastAttackTime = now;
        this.callbacks.onComboSlash(this.comboChain, tapX, tapY);
      },
      onDoubleTap: () => {
        const state = this.controller.getState();
        const dodgeAngle = state.distance > 5 ? state.angleRad : 0;
        this.callbacks.onEvasiveDodge(dodgeAngle);
      },
      onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => {
        this.callbacks.onParryGuard(direction);
      },
      onHold: (state: GestureState) => {
        this.callbacks.onHoldStart?.();
      },
      onHoldEnd: () => {
        const state = this.controller.getState();
        this.callbacks.onChargeStrike(state.holdDurationMs || 400);
      }
    });
  }

  public getComboChain(): number {
    return this.comboChain;
  }

  public resetCombo(): void {
    this.comboChain = 0;
  }

  public destroy(): void {
    this.controller.destroy();
  }
}
