/**
 * MatchPrefetchManager.ts - SCR-06-25
 * 매칭 큐 대기 시간 중 백그라운드 프리페치 워커 및 오프스크린 캔버스 텍스처 프리로더 매니저.
 */

import { PrefetchedMetadata } from '../workers/MatchPredictivePrefetchWorker';

export class MatchPrefetchManager {
  private static worker: Worker | null = null;
  private static cache = new Map<string, PrefetchedMetadata>();

  private static getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('../workers/MatchPredictivePrefetchWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch {
        this.worker = null;
      }
    }
    return this.worker;
  }

  static startPrefetch(candidateIds: string[], deckCardIds: string[] = ['c1', 'c2', 'c3']): void {
    const worker = this.getWorker();
    if (worker) {
      const handleMessage = (e: MessageEvent<{ type: string; results: PrefetchedMetadata[] }>) => {
        if (e.data.type === 'PREFETCH_COMPLETE') {
          e.data.results.forEach((item) => this.cache.set(item.opponentId, item));
          worker.removeEventListener('message', handleMessage);
        }
      };
      worker.addEventListener('message', handleMessage);
      worker.postMessage({ candidateOpponentIds: candidateIds, deckCardIds });
    } else {
      // Synchronous fallback
      candidateIds.forEach((id, idx) => {
        this.cache.set(id, {
          opponentId: id,
          opponentName: `히어로_${id.slice(-4)}`,
          deckStrength: 1200 + idx * 30,
          aceCardId: deckCardIds[idx % deckCardIds.length] || 'c1',
          cachedAt: Date.now(),
        });
      });
    }
  }

  static getPrefetched(opponentId: string): PrefetchedMetadata | null {
    return this.cache.get(opponentId) || null;
  }

  static clear(): void {
    this.cache.clear();
  }
}
