/**
 * GachaWorkerBridge.ts - SCR-04-25
 * Web Worker 브릿지: 가챠 결과 전처리를 0ms 비차단 처리하며 워커 미지원 환경 자동 폴백 지원.
 */

import { GachaRawResult, GachaProcessedResult } from '../workers/GachaPreprocessorWorker';

export class GachaWorkerBridge {
  private static worker: Worker | null = null;

  private static getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('../workers/GachaPreprocessorWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch {
        this.worker = null;
      }
    }
    return this.worker;
  }

  static processGachaResults(
    rawCards: GachaRawResult[],
    currentMileage: number = 0
  ): Promise<GachaProcessedResult> {
    return new Promise((resolve) => {
      const worker = this.getWorker();

      if (worker) {
        const handleMessage = (e: MessageEvent<GachaProcessedResult>) => {
          worker.removeEventListener('message', handleMessage);
          resolve(e.data);
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage({ rawCards, currentMileage });
      } else {
        // Main thread sync fallback
        let totalMileage = 0;
        let ssrCount = 0;

        const cards = rawCards.map((card) => {
          let mileage = 5;
          let score = 10;
          let sparkle = false;

          if (card.grade === 'UR') {
            mileage = 50;
            score = 100;
            sparkle = true;
            ssrCount++;
          } else if (card.grade === 'SSR') {
            mileage = 30;
            score = 80;
            sparkle = true;
            ssrCount++;
          } else if (card.grade === 'SR') {
            mileage = 15;
            score = 40;
          } else if (card.grade === 'R') {
            mileage = 8;
            score = 20;
          }

          totalMileage += mileage;
          return {
            ...card,
            pityBonusMileage: mileage,
            rarityScore: score,
            sparkleEffect: sparkle,
          };
        });

        resolve({
          cards,
          totalMileageEarned: totalMileage,
          ssrCount,
          hasJackpot: ssrCount >= 2,
        });
      }
    });
  }
}
