/**
 * DeckSynergyWorkerBridge.ts - SCR-03-28
 * 덱 시너지 Web Worker 통신 브릿지 (메인 스레드 폴백 지원)
 */

import { CardMetadata, DeckSynergyInput, DeckSynergyOutput } from '../workers/DeckSynergyWorker';

export class DeckSynergyWorkerBridge {
  private static worker: Worker | null = null;

  private static getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('../workers/DeckSynergyWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch {
        this.worker = null;
      }
    }
    return this.worker;
  }

  static calculateSynergy(cards: CardMetadata[]): Promise<DeckSynergyOutput> {
    return new Promise((resolve) => {
      const worker = this.getWorker();
      if (worker) {
        const handleMsg = (e: MessageEvent<DeckSynergyOutput>) => {
          worker.removeEventListener('message', handleMsg);
          resolve(e.data);
        };
        worker.addEventListener('message', handleMsg);
        worker.postMessage({ deckCards: cards } as DeckSynergyInput);
      } else {
        // Fallback
        let totalPower = 0;
        cards.forEach((c) => (totalPower += c.power + c.defense));
        resolve({
          totalCombatPower: totalPower,
          elementCount: { fire: 0, water: 0, earth: 0, light: 0, dark: 0 },
          activeSynergies: [],
        });
      }
    });
  }
}
