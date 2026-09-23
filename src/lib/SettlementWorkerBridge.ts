/**
 * SettlementWorkerBridge.ts - SCR-08-25
 * 전투 결과 정산 워커 브릿지 (비동기 처리 및 메인 스레드 폴백 지원)
 */

import { SettlementInput, SettlementOutput } from '../workers/BattleSettlementWorker';

export class SettlementWorkerBridge {
  private static worker: Worker | null = null;

  private static getWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
    if (!this.worker) {
      try {
        this.worker = new Worker(
          new URL('../workers/BattleSettlementWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch {
        this.worker = null;
      }
    }
    return this.worker;
  }

  static calculateSettlement(input: SettlementInput): Promise<SettlementOutput> {
    return new Promise((resolve) => {
      const worker = this.getWorker();
      if (worker) {
        const handleMessage = (e: MessageEvent<SettlementOutput>) => {
          worker.removeEventListener('message', handleMessage);
          resolve(e.data);
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage(input);
      } else {
        // Fallback
        const streakMultiplier = input.isVictory ? Math.min(2.0, 1 + input.winStreak * 0.1) : 1.0;
        const streakBonusGold = Math.floor(input.baseGold * (streakMultiplier - 1.0));
        const turnBonusExp = Math.max(0, Math.floor((10 - input.turnCount) * 5));
        const totalGold = Math.floor(input.baseGold * streakMultiplier);
        const totalExp = input.baseExp + turnBonusExp;

        resolve({
          totalGold,
          totalExp,
          streakBonusGold,
          turnBonusExp,
          mvpCardId: input.playerDeckIds[0] || 'c1',
          droppedItems: input.isVictory
            ? [{ name: '빛나는 마나석', icon: '💎', count: 3, rarity: 'rare' }]
            : [{ name: '위로의 붕대', icon: '🩹', count: 2, rarity: 'common' }],
          isLevelUp: totalExp >= 100,
        });
      }
    });
  }
}
