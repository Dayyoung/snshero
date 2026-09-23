/**
 * MarketDeltaBatcher.ts - SCR-05-25
 * 마켓플레이스 실시간 호가/시세 변동을 100ms 단위 디바운스 및 requestAnimationFrame 배치로 취합하여
 * DOM 전면 리렌더링 없이 변경된 필드만 정밀 델타 패치(Delta Patching)하는 60fps 최적화 엔진.
 */

export interface MarketListingDelta {
  listingId: string;
  price?: number;
  availableCount?: number;
  lastTradedAt?: number;
  trendingDirection?: 'up' | 'down' | 'flat';
}

export type DeltaApplyCallback = (patches: Map<string, MarketListingDelta>) => void;

export class MarketDeltaBatcher {
  private pendingDeltas = new Map<string, MarketListingDelta>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;
  private subscribers = new Set<DeltaApplyCallback>();
  private readonly debounceMs: number;

  constructor(debounceMs: number = 100) {
    this.debounceMs = debounceMs;
  }

  /**
   * 실시간 변경 메시지 큐잉 (동일 listingId는 머지)
   */
  queueDelta(delta: MarketListingDelta): void {
    const existing = this.pendingDeltas.get(delta.listingId);
    if (existing) {
      this.pendingDeltas.set(delta.listingId, {
        ...existing,
        ...delta,
      });
    } else {
      this.pendingDeltas.set(delta.listingId, delta);
    }

    this.scheduleFlush();
  }

  /**
   * 디바운스 타이머 스케줄링 후 RAF로 전달
   */
  private scheduleFlush(): void {
    if (this.debounceTimer) return;

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.pendingDeltas.size === 0) return;

      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
          this.flush();
        });
      } else {
        this.flush();
      }
    }, this.debounceMs);
  }

  private flush(): void {
    if (this.pendingDeltas.size === 0) return;

    const patches = new Map(this.pendingDeltas);
    this.pendingDeltas.clear();

    for (const callback of this.subscribers) {
      try {
        callback(patches);
      } catch (err) {
        console.error('Error applying market delta patch:', err);
      }
    }
  }

  subscribe(callback: DeltaApplyCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.rafId && typeof window !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingDeltas.clear();
  }
}
