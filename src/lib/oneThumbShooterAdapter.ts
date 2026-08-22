/**
 * OneThumbShooterAdapter.ts
 * Mobile-First Pure Gesture Adapter for 3D Shooter Mission Games
 * 
 * Controls:
 * - Drag: Move & Aim smoothly in 360 degrees
 * - Release: Automatically locks on and shoots the nearest visible enemy
 * - Double-Tap: Immediate evasive dash in movement direction
 * - Swipe-Up: Casts Ultimate / Special area skill
 */

import { PureGestureController, GestureState } from './pureGestureController';

export interface ShooterTarget {
  x: number;
  z: number;
  hp: number;
  isAlive: boolean;
}

export interface ShooterCallbacks {
  onMove: (normX: number, normZ: number, deltaLength: number) => void;
  onAutoShoot: (target: ShooterTarget | null, aimAngleRad: number) => void;
  onDash: (dashAngleRad: number) => void;
  onUltimate: () => void;
}

export class OneThumbShooterAdapter {
  private controller: PureGestureController;
  private callbacks: ShooterCallbacks;
  private getPlayerPos: () => { x: number; z: number };
  private getEnemies: () => ShooterTarget[];
  private maxShootRange: number;

  constructor(
    element: HTMLElement,
    callbacks: ShooterCallbacks,
    getPlayerPos: () => { x: number; z: number },
    getEnemies: () => ShooterTarget[],
    maxShootRange: number = 35
  ) {
    this.callbacks = callbacks;
    this.getPlayerPos = getPlayerPos;
    this.getEnemies = getEnemies;
    this.maxShootRange = maxShootRange;

    this.controller = new PureGestureController(element, {
      onDrag: (state: GestureState) => {
        // Invert Y for 3D coordinate system (dragging up moves character forward in -Z)
        this.callbacks.onMove(state.normDeltaX, -state.normDeltaY, state.distance);
      },
      onReleaseAutoAction: (state: GestureState) => {
        const playerPos = this.getPlayerPos();
        const enemies = this.getEnemies().filter(e => e.isAlive && e.hp > 0);

        let nearestEnemy: ShooterTarget | null = null;
        let minDistance = this.maxShootRange;

        for (const enemy of enemies) {
          const dist = Math.hypot(enemy.x - playerPos.x, enemy.z - playerPos.z);
          if (dist < minDistance) {
            minDistance = dist;
            nearestEnemy = enemy;
          }
        }

        let aimAngle = state.angleRad;
        if (nearestEnemy) {
          aimAngle = Math.atan2(nearestEnemy.z - playerPos.z, nearestEnemy.x - playerPos.x);
        }

        this.callbacks.onAutoShoot(nearestEnemy, aimAngle);
      },
      onDoubleTap: () => {
        const state = this.controller.getState();
        const dashAngle = state.distance > 5 ? state.angleRad : 0;
        this.callbacks.onDash(dashAngle);
      },
      onSwipe: (dir) => {
        if (dir === 'up') {
          this.callbacks.onUltimate();
        }
      }
    });
  }

  public destroy() {
    this.controller.destroy();
  }
}
