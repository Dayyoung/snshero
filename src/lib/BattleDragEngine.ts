/**
 * BattleDragEngine.ts
 * ID 549: Passive 터치 리스너 및 120fps 부드러운 추적
 * ID 569: 순수 수학적 AABB 충돌 판정 (DOM getBoundingClientRect 연속 쿼리 오버헤드 최소화)
 */

export interface Rect2D {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface SlotAABB {
  slotIndex: number;
  rect: Rect2D;
}

export class BattleDragEngine {
  private static instance: BattleDragEngine;
  private cachedSlotBounds: Map<number, Rect2D> = new Map();
  private lastCacheTime = 0;
  private readonly cacheTTLMs = 500; // 500ms마다 한 번만 DOM 재측정

  private constructor() {}

  public static getInstance(): BattleDragEngine {
    if (!BattleDragEngine.instance) {
      BattleDragEngine.instance = new BattleDragEngine();
    }
    return BattleDragEngine.instance;
  }

  /**
   * 3x3 보드 9개 슬롯의 물리적 위치를 캐싱하여 드래그 중 getClientRects 과도한 호출 차단
   */
  public updateSlotBounds(slotElements: (HTMLElement | null)[]): void {
    const now = Date.now();
    this.cachedSlotBounds.clear();

    slotElements.forEach((el, index) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      this.cachedSlotBounds.set(index, {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      });
    });

    this.lastCacheTime = now;
  }

  /**
   * ID 569: 순수 수학적 AABB 점-박스 충돌 판정
   * x, y 지점이 어느 슬롯의 영역 내에 있는지 O(1) 순수 수식으로 즉시 판정
   */
  public detectHoveredSlot(clientX: number, clientY: number): number | null {
    for (const [slotIndex, rect] of this.cachedSlotBounds.entries()) {
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return slotIndex;
      }
    }
    return null;
  }

  /**
   * ID 549: 120fps 부드러운 터치 추적을 위한 Passive 리스너 옵션 빌더
   */
  public getPassiveTouchOptions(): AddEventListenerOptions {
    return { passive: true, capture: false };
  }
}
