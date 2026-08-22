/**
 * PureGestureController.ts
 * 100% Pure Gesture Touch Controls for Mobile-First Mission Games
 * Removes on-screen virtual joysticks/D-pads in favor of natural thumb gestures:
 * - Drag: Move / Aim
 * - Tap: Primary Action / Attack / Jump
 * - Double-Tap: Dash / Evade / Nitro / Special
 * - Hold (Long Press): Charge / Brake / Boost
 * - Swipe: Directional Skill / Dodge / Ultimate
 */

export interface GestureState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  normDeltaX: number; // -1.0 to 1.0
  normDeltaY: number; // -1.0 to 1.0
  distance: number;
  angleRad: number;
  velocity: number;
  isHolding: boolean;
  holdDurationMs: number;
}

export interface GestureCallbacks {
  onDragStart?: (state: GestureState) => void;
  onDrag?: (state: GestureState) => void;
  onDragEnd?: (state: GestureState) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onHold?: (state: GestureState) => void;
  onHoldEnd?: () => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', velocity: number) => void;
  onReleaseAutoAction?: (state: GestureState) => void;
}

export class PureGestureController {
  private element: HTMLElement;
  private callbacks: GestureCallbacks;
  private state: GestureState;
  private lastTapTime = 0;
  private holdTimer: number | null = null;
  private startTime = 0;
  private lastMoveTime = 0;
  private isDestroyed = false;

  private readonly DOUBLE_TAP_THRESHOLD_MS = 280;
  private readonly HOLD_THRESHOLD_MS = 350;
  private readonly SWIPE_MIN_DISTANCE = 35;
  private readonly SWIPE_MAX_DURATION_MS = 280;

  constructor(element: HTMLElement, callbacks: GestureCallbacks = {}) {
    this.element = element;
    this.callbacks = callbacks;
    this.state = {
      isActive: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      normDeltaX: 0,
      normDeltaY: 0,
      distance: 0,
      angleRad: 0,
      velocity: 0,
      isHolding: false,
      holdDurationMs: 0
    };

    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    // Mouse fallback for desktop testing
    this.element.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    this.startGesture(touch.clientX, touch.clientY);
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.state.isActive || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.moveGesture(touch.clientX, touch.clientY);
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.state.isActive) return;
    this.endGesture();
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    this.startGesture(e.clientX, e.clientY);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.state.isActive) return;
    this.moveGesture(e.clientX, e.clientY);
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (!this.state.isActive) return;
    this.endGesture();
  };

  private startGesture(clientX: number, clientY: number) {
    const rect = this.element.getBoundingClientRect();
    const now = Date.now();

    this.startTime = now;
    this.lastMoveTime = now;

    this.state = {
      isActive: true,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      deltaX: 0,
      deltaY: 0,
      normDeltaX: 0,
      normDeltaY: 0,
      distance: 0,
      angleRad: 0,
      velocity: 0,
      isHolding: false,
      holdDurationMs: 0
    };

    // Check double tap
    const timeSinceLastTap = now - this.lastTapTime;
    if (timeSinceLastTap < this.DOUBLE_TAP_THRESHOLD_MS) {
      this.callbacks.onDoubleTap?.(clientX, clientY);
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
    }

    // Set hold timer
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = window.setTimeout(() => {
      if (this.state.isActive && this.state.distance < 15) {
        this.state.isHolding = true;
        this.state.holdDurationMs = Date.now() - this.startTime;
        this.callbacks.onHold?.(this.state);
      }
    }, this.HOLD_THRESHOLD_MS);

    this.callbacks.onDragStart?.(this.state);
  }

  private moveGesture(clientX: number, clientY: number) {
    const now = Date.now();
    const dt = Math.max(1, now - this.lastMoveTime);
    this.lastMoveTime = now;

    const deltaX = clientX - this.state.startX;
    const deltaY = clientY - this.state.startY;
    const distance = Math.hypot(deltaX, deltaY);

    const stepDx = clientX - this.state.currentX;
    const stepDy = clientY - this.state.currentY;
    const stepDist = Math.hypot(stepDx, stepDy);
    const velocity = stepDist / dt;

    const rect = this.element.getBoundingClientRect();
    const maxRadius = Math.min(rect.width, rect.height) * 0.4 || 120;

    const normDeltaX = Math.max(-1, Math.min(1, deltaX / maxRadius));
    const normDeltaY = Math.max(-1, Math.min(1, deltaY / maxRadius));
    const angleRad = Math.atan2(deltaY, deltaX);

    this.state.currentX = clientX;
    this.state.currentY = clientY;
    this.state.deltaX = deltaX;
    this.state.deltaY = deltaY;
    this.state.normDeltaX = normDeltaX;
    this.state.normDeltaY = normDeltaY;
    this.state.distance = distance;
    this.state.angleRad = angleRad;
    this.state.velocity = velocity;

    if (distance > 15 && this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    this.callbacks.onDrag?.(this.state);
  }

  private endGesture() {
    const now = Date.now();
    const duration = now - this.startTime;

    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    if (this.state.isHolding) {
      this.callbacks.onHoldEnd?.();
    }

    // Check tap
    if (this.state.distance < 12 && duration < 300) {
      this.callbacks.onTap?.(this.state.startX, this.state.startY);
    }

    // Check swipe
    if (this.state.distance >= this.SWIPE_MIN_DISTANCE && duration <= this.SWIPE_MAX_DURATION_MS) {
      const absX = Math.abs(this.state.deltaX);
      const absY = Math.abs(this.state.deltaY);
      let dir: 'up' | 'down' | 'left' | 'right' = 'up';

      if (absX > absY) {
        dir = this.state.deltaX > 0 ? 'right' : 'left';
      } else {
        dir = this.state.deltaY > 0 ? 'down' : 'up';
      }

      this.callbacks.onSwipe?.(dir, this.state.velocity);
    }

    // Release auto action (e.g. release to auto-shoot nearest enemy)
    this.callbacks.onReleaseAutoAction?.(this.state);
    this.callbacks.onDragEnd?.(this.state);

    this.state.isActive = false;
  }

  public getState(): Readonly<GestureState> {
    return this.state;
  }

  public destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.holdTimer) clearTimeout(this.holdTimer);

    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);

    this.element.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }
}
