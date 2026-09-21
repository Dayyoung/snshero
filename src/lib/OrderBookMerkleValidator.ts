/**
 * OrderBookMerkleValidator.ts - SCR-05-13
 * 오더북 머클 트리 기반 델타 해시 검증기 (불일치 틱만 1ms 내 마이크로 패치)
 */

export interface OrderBookTick {
  price: number;
  amount: number;
  orders: number;
  hash?: string;
}

export class OrderBookMerkleValidator {
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  static computeTickHash(tick: OrderBookTick): string {
    return this.simpleHash(`${tick.price}:${tick.amount}:${tick.orders}`);
  }

  static computeRootHash(ticks: OrderBookTick[]): string {
    if (ticks.length === 0) return '0';
    const hashes = ticks.map((t) => this.computeTickHash(t));
    return this.simpleHash(hashes.join('|'));
  }

  static findMismatchedIndices(localTicks: OrderBookTick[], remoteTicks: OrderBookTick[]): number[] {
    const mismatched: number[] = [];
    const maxLen = Math.max(localTicks.length, remoteTicks.length);

    for (let i = 0; i < maxLen; i++) {
      const l = localTicks[i];
      const r = remoteTicks[i];
      if (!l || !r || this.computeTickHash(l) !== this.computeTickHash(r)) {
        mismatched.push(i);
      }
    }
    return mismatched;
  }
}
