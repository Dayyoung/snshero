/**
 * MarketSearchBridge.ts - SCR-05-28
 * 마켓 검색 Web Worker 통신 브릿지 및 디바운스 매니저
 */

import { MarketItemIndex } from '../workers/MarketFuzzySearchWorker';

export class MarketSearchBridge {
  private static worker: Worker | null = null;
  private static debounceTimer: any = null;

  private static getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('../workers/MarketFuzzySearchWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch {
        this.worker = null;
      }
    }
    return this.worker;
  }

  static indexItems(items: MarketItemIndex[]): void {
    const worker = this.getWorker();
    if (worker) {
      worker.postMessage({ type: 'INDEX_ITEMS', payload: items });
    }
  }

  static search(query: string, gradeFilter?: string): Promise<MarketItemIndex[]> {
    return new Promise((resolve) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const worker = this.getWorker();
        if (worker) {
          const handleMsg = (e: MessageEvent) => {
            if (e.data.type === 'SEARCH_RESULTS') {
              worker.removeEventListener('message', handleMsg);
              resolve(e.data.results);
            }
          };
          worker.addEventListener('message', handleMsg);
          worker.postMessage({ type: 'SEARCH', payload: { query, gradeFilter } });
        } else {
          resolve([]);
        }
      }, 100); // 100ms debounce
    });
  }
}
