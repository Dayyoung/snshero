/**
 * VoxelAutoActionAdapter.ts
 * Mobile-First Pure Gesture & Proximity Auto-Action Adapter for 3D Voxel Survival, Defense & Mining Games
 * 
 * Features:
 * - Completely eliminates virtual D-Pads and manual harvest/attack buttons
 * - Proximity Auto-Action: Automatically chops trees, mines ores, repairs walls, or attacks enemies when within interaction range
 * - Touch Drag: Smooth 360° character movement and orientation
 * - Double-Tap: Immediate evasive dash / speed sprint
 * - Long-Press: Wide AoE Whirlwind / Power Harvest Stance
 * - Safe-zone & thumb-friendly 1-hand mobile operation
 */

import { PureGestureController, GestureState } from './pureGestureController';

export interface VoxelInteractableTarget {
  id: string;
  type: 'TREE' | 'ORE' | 'WALL' | 'ENEMY' | 'CHEST' | 'STRUCTURE';
  x: number;
  z: number;
  hp?: number;
  maxHp?: number;
  isInteractable: boolean;
}

export interface VoxelAutoActionCallbacks {
  onMove: (normX: number, normZ: number, deltaLength: number) => void;
  onAutoAction: (target: VoxelInteractableTarget, actionType: 'CHOP' | 'MINE' | 'REPAIR' | 'ATTACK' | 'COLLECT') => void;
  onDash: (dashAngleRad: number) => void;
  onAoESpin: () => void;
  onIdle?: () => void;
}

export class VoxelAutoActionAdapter {
  private controller: PureGestureController;
  private callbacks: VoxelAutoActionCallbacks;
  private getPlayerPos: () => { x: number; z: number };
  private getTargets: () => VoxelInteractableTarget[];
  private interactionRadius: number;
  private autoActionIntervalMs: number;
  private autoActionTimer: number | null = null;
  private isDestroyed = false;

  constructor(
    element: HTMLElement,
    callbacks: VoxelAutoActionCallbacks,
    getPlayerPos: () => { x: number; z: number },
    getTargets: () => VoxelInteractableTarget[],
    interactionRadius: number = 3.2,
    autoActionIntervalMs: number = 400
  ) {
    this.callbacks = callbacks;
    this.getPlayerPos = getPlayerPos;
    this.getTargets = getTargets;
    this.interactionRadius = interactionRadius;
    this.autoActionIntervalMs = autoActionIntervalMs;

    this.controller = new PureGestureController(element, {
      onDrag: (state: GestureState) => {
        // Invert Y for 3D Z-plane movement
        this.callbacks.onMove(state.normDeltaX, -state.normDeltaY, state.distance);
      },
      onDragEnd: () => {
        this.callbacks.onIdle?.();
      },
      onDoubleTap: () => {
        const state = this.controller.getState();
        const dashAngle = state.distance > 5 ? state.angleRad : 0;
        this.callbacks.onDash(dashAngle);
      },
      onHold: () => {
        this.callbacks.onAoESpin();
      }
    });

    this.startProximityPolling();
  }

  private startProximityPolling() {
    const poll = () => {
      if (this.isDestroyed) return;
      this.checkProximityTargets();
      this.autoActionTimer = window.setTimeout(poll, this.autoActionIntervalMs);
    };
    poll();
  }

  private checkProximityTargets() {
    const player = this.getPlayerPos();
    const targets = this.getTargets().filter(t => t.isInteractable && (t.hp === undefined || t.hp > 0));

    let nearest: VoxelInteractableTarget | null = null;
    let minDist = this.interactionRadius;

    for (const target of targets) {
      const dist = Math.hypot(target.x - player.x, target.z - player.z);
      if (dist < minDist) {
        minDist = dist;
        nearest = target;
      }
    }

    if (nearest) {
      let actionType: 'CHOP' | 'MINE' | 'REPAIR' | 'ATTACK' | 'COLLECT' = 'COLLECT';
      switch (nearest.type) {
        case 'TREE':
          actionType = 'CHOP';
          break;
        case 'ORE':
          actionType = 'MINE';
          break;
        case 'WALL':
          actionType = 'REPAIR';
          break;
        case 'ENEMY':
          actionType = 'ATTACK';
          break;
        case 'CHEST':
        case 'STRUCTURE':
        default:
          actionType = 'COLLECT';
          break;
      }
      this.callbacks.onAutoAction(nearest, actionType);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.autoActionTimer !== null) {
      clearTimeout(this.autoActionTimer);
      this.autoActionTimer = null;
    }
    this.controller.destroy();
  }
}
