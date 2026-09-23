// ─── Surprise Combat Mission Service (돌발 크러시 미션 시스템) ─────────────
import { triggerHaptic } from '../lib/haptic';

export interface CombatSurpriseMission {
  id: string;
  title: string;
  description: string;
  goalType: 'crush' | 'weakness' | 'damage' | 'quick_kill';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardClaimed: boolean;
  reward: {
    sns: number;
    diamond?: number;
    itemTitle: string;
  };
  specialOffer?: {
    packageId: string;
    title: string;
    priceKrw: number;
    discountPercent: number;
  };
}

const STORAGE_KEY = 'hero_combat_surprise_missions_season1';

export class SurpriseCombatMissionService {
  private activeMission: CombatSurpriseMission | null = null;
  private onMissionUpdatedCallbacks: ((mission: CombatSurpriseMission | null) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public subscribe(cb: (mission: CombatSurpriseMission | null) => void): () => void {
    this.onMissionUpdatedCallbacks.push(cb);
    cb(this.activeMission);
    return () => {
      this.onMissionUpdatedCallbacks = this.onMissionUpdatedCallbacks.filter(fn => fn !== cb);
    };
  }

  private notify(): void {
    this.saveToStorage();
    for (const cb of this.onMissionUpdatedCallbacks) {
      cb(this.activeMission);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.activeMission = JSON.parse(data);
      }
    } catch {
      this.activeMission = null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      if (this.activeMission) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activeMission));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }

  /**
   * Start a new surprise mission for current combat encounter
   */
  public generateBattleMission(force: boolean = false): CombatSurpriseMission | null {
    // If mission already ongoing and not finished, keep it
    if (this.activeMission && !this.activeMission.completed && !force) {
      return this.activeMission;
    }

    const templates: Omit<CombatSurpriseMission, 'id' | 'currentCount' | 'completed' | 'rewardClaimed'>[] = [
      {
        title: '⚡ [돌발] 익스트림 크러시 발동!',
        description: '약점 속성 치명타로 화면을 산산조각 내십시오.',
        goalType: 'crush',
        targetCount: 1,
        reward: { sns: 150, diamond: 10, itemTitle: '익스트림 크러시 승리 룬' },
        specialOffer: {
          packageId: 'rune_deal_2200',
          title: '보스 특효 속성 룬 패키지',
          priceKrw: 2200,
          discountPercent: 75
        }
      },
      {
        title: '🎯 [돌발] 약점 속성 2회 적중!',
        description: '적 카드의 약점 속성을 노려 2회 이상 타격하십시오.',
        goalType: 'weakness',
        targetCount: 2,
        reward: { sns: 120, diamond: 5, itemTitle: '속성 정밀 조준경' },
        specialOffer: {
          packageId: 'element_deal_1100',
          title: '초정밀 속성 마스터 번들',
          priceKrw: 1100,
          discountPercent: 80
        }
      },
      {
        title: '💥 [돌발] 300+ 헤비 데미지!',
        description: '단일 일격으로 300 이상의 폭발적인 피해를 입히십시오.',
        goalType: 'damage',
        targetCount: 1,
        reward: { sns: 200, diamond: 15, itemTitle: '헤비 임팩트 뱃지' },
        specialOffer: {
          packageId: 'power_booster_770',
          title: '승리 골든 부스터 티켓',
          priceKrw: 770,
          discountPercent: 70
        }
      }
    ];

    const pick = templates[Math.floor(Math.random() * templates.length)];
    this.activeMission = {
      ...pick,
      id: `mission_${Date.now()}`,
      currentCount: 0,
      completed: false,
      rewardClaimed: false
    };

    triggerHaptic('special');
    this.notify();
    return this.activeMission;
  }

  /**
   * Track combat events
   */
  public reportEvent(
    event: 'crush' | 'weakness' | 'damage' | 'quick_kill',
    value: number = 1
  ): boolean {
    if (!this.activeMission || this.activeMission.completed) return false;

    if (this.activeMission.goalType === event) {
      if (event === 'damage') {
        if (value >= 300) {
          this.activeMission.currentCount = 1;
        }
      } else {
        this.activeMission.currentCount += value;
      }

      if (this.activeMission.currentCount >= this.activeMission.targetCount) {
        this.activeMission.completed = true;
        triggerHaptic('victory');
        this.notify();
        return true;
      }
      this.notify();
    }
    return false;
  }

  /**
   * Claim reward for completed surprise mission
   */
  public claimReward(): { sns: number; diamond: number; itemTitle: string; specialOffer?: any } | null {
    if (!this.activeMission || !this.activeMission.completed || this.activeMission.rewardClaimed) {
      return null;
    }

    this.activeMission.rewardClaimed = true;
    const result = {
      sns: this.activeMission.reward.sns,
      diamond: this.activeMission.reward.diamond || 0,
      itemTitle: this.activeMission.reward.itemTitle,
      specialOffer: this.activeMission.specialOffer
    };

    triggerHaptic('success');
    this.notify();
    return result;
  }

  public getActiveMission(): CombatSurpriseMission | null {
    return this.activeMission;
  }

  public clear(): void {
    this.activeMission = null;
    this.notify();
  }
}

export const surpriseCombatMissionService = new SurpriseCombatMissionService();
