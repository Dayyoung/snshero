/**
 * BadgeVirtualCulling.ts - SCR-11-19
 * 2D 프러스텀 가상 컬링 매니저: 가시 영역(Viewport) 내 뱃지만 선별하여 60fps로 렌더링
 */

export interface BadgeBounds {
  id: string;
  y: number;
  height: number;
}

export class BadgeVirtualCulling {
  public static getVisibleBadges<T extends BadgeBounds>(
    items: T[],
    scrollTop: number,
    viewportHeight: number,
    buffer = 100
  ): T[] {
    const minY = scrollTop - buffer;
    const maxY = scrollTop + viewportHeight + buffer;

    return items.filter((item) => {
      const itemTop = item.y;
      const itemBottom = item.y + item.height;
      return itemBottom >= minY && itemTop <= maxY;
    });
  }
}
