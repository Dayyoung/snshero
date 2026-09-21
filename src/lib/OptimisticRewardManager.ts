/**
 * OptimisticRewardManager.ts - SCR-11-16
 * 터치 즉시 보상 상태를 로컬 선반영하고 백그라운드에서 대사하는 60fps 무지연 보상 엔진
 */

export class OptimisticRewardManager {
  private claimedSet = new Set<string>();

  constructor() {
    try {
      const saved = localStorage.getItem('hero_optimistic_claims');
      if (saved) {
        this.claimedSet = new Set(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
  }

  public isClaimed(questId: string): boolean {
    return this.claimedSet.has(questId);
  }

  public claimOptimistically(questId: string): boolean {
    if (this.claimedSet.has(questId)) return false;
    this.claimedSet.add(questId);
    try {
      localStorage.setItem('hero_optimistic_claims', JSON.stringify([...this.claimedSet]));
    } catch {
      // ignore
    }
    return true;
  }
}
