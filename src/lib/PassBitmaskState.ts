/**
 * PassBitmaskState.ts - SCR-10-25
 * 50단계 배틀패스 무료/프리미엄 보상 청구 상태를 BigInt 비트마스크로 압축 관리하여
 * O(1) 초고속 상태 판별 및 로컬스토리지 초경량 직렬화 저장 지원.
 */

export class PassBitmaskState {
  private freeClaimedMask: bigint;
  private premiumClaimedMask: bigint;

  constructor(freeMaskStr = '0', premiumMaskStr = '0') {
    try {
      this.freeClaimedMask = BigInt(freeMaskStr);
      this.premiumClaimedMask = BigInt(premiumMaskStr);
    } catch {
      this.freeClaimedMask = 0n;
      this.premiumClaimedMask = 0n;
    }
  }

  isFreeClaimed(level: number): boolean {
    if (level < 1 || level > 100) return false;
    return (this.freeClaimedMask & (1n << BigInt(level - 1))) !== 0n;
  }

  isPremiumClaimed(level: number): boolean {
    if (level < 1 || level > 100) return false;
    return (this.premiumClaimedMask & (1n << BigInt(level - 1))) !== 0n;
  }

  claimFree(level: number): void {
    if (level < 1 || level > 100) return;
    this.freeClaimedMask |= 1n << BigInt(level - 1);
  }

  claimPremium(level: number): void {
    if (level < 1 || level > 100) return;
    this.premiumClaimedMask |= 1n << BigInt(level - 1);
  }

  claimAllEligibleFree(currentLevel: number): number[] {
    const claimedLevels: number[] = [];
    for (let l = 1; l <= currentLevel; l++) {
      if (!this.isFreeClaimed(l)) {
        this.claimFree(l);
        claimedLevels.push(l);
      }
    }
    return claimedLevels;
  }

  claimAllEligiblePremium(currentLevel: number): number[] {
    const claimedLevels: number[] = [];
    for (let l = 1; l <= currentLevel; l++) {
      if (!this.isPremiumClaimed(l)) {
        this.claimPremium(l);
        claimedLevels.push(l);
      }
    }
    return claimedLevels;
  }

  serialize(): { freeMask: string; premiumMask: string } {
    return {
      freeMask: this.freeClaimedMask.toString(),
      premiumMask: this.premiumClaimedMask.toString(),
    };
  }

  static loadFromStorage(storageKeyPrefix = 'hero_pass_bitmask'): PassBitmaskState {
    const free = localStorage.getItem(`${storageKeyPrefix}_free`) || '0';
    const prem = localStorage.getItem(`${storageKeyPrefix}_prem`) || '0';
    return new PassBitmaskState(free, prem);
  }

  saveToStorage(storageKeyPrefix = 'hero_pass_bitmask'): void {
    const data = this.serialize();
    localStorage.setItem(`${storageKeyPrefix}_free`, data.freeMask);
    localStorage.setItem(`${storageKeyPrefix}_prem`, data.premiumMask);
  }
}
