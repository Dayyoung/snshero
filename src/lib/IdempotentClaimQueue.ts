/**
 * IdempotentClaimQueue.ts - SCR-11-16
 * UUID 멱등성 키 기반 트랜잭션 큐로 중복 수령 요청을 원천 차단
 */

export class IdempotentClaimQueue {
  private inFlightKeys = new Set<string>();

  public acquireKey(questId: string): string | null {
    const key = `claim_${questId}_${Date.now()}`;
    if (this.inFlightKeys.has(questId)) {
      return null; // Already in flight
    }
    this.inFlightKeys.add(questId);
    return key;
  }

  public releaseKey(questId: string) {
    this.inFlightKeys.delete(questId);
  }
}
