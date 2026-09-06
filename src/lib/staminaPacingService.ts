/**
 * staminaPacingService.ts
 * 일일 퀘스트 마일스톤(20/40/60/80/100) 및 스태미나(AP) 페이싱 & 50회 가챠 천장 매니저
 * (구글 스프레드시트 Row 1006 / ID 554 요구사항 구현)
 */

export interface DailyActivityMilestone {
  pointsRequired: number;
  rewardSns: number;
  rewardAp: number;
  isClaimed: boolean;
  canClaim: boolean;
}

export interface EconomyHubState {
  currentActivityPoints: number; // 0 ~ 100
  milestones: DailyActivityMilestone[];
  gachaPityCount: number;        // 0 ~ 50 천장 카운터
  isNoonApClaimed: boolean;      // 낮 12시 무료 AP 수령 여부
  isEveningApClaimed: boolean;   // 저녁 6시 무료 AP 수령 여부
  todayDate: string;
}

export class StaminaPacingService {
  private static instance: StaminaPacingService;
  private readonly STORAGE_KEY = 'hero_daily_economy_hub_v1';
  private readonly GACHA_PITY_KEY = 'hero_gacha_pity_counter';
  private readonly MAX_PITY = 50;

  private constructor() {}

  public static getInstance(): StaminaPacingService {
    if (!StaminaPacingService.instance) {
      StaminaPacingService.instance = new StaminaPacingService();
    }
    return StaminaPacingService.instance;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public getState(): EconomyHubState {
    const today = this.getTodayKey();
    let currentPts = 30;
    let claimedPoints: number[] = [];
    let isNoon = false;
    let isEvening = false;

    try {
      const raw = localStorage.getItem(`${this.STORAGE_KEY}_${today}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        currentPts = parsed.points || 0;
        claimedPoints = parsed.claimedPoints || [];
        isNoon = Boolean(parsed.isNoon);
        isEvening = Boolean(parsed.isEvening);
      }
    } catch {
      // fallback
    }

    let pity = 0;
    try {
      pity = parseInt(localStorage.getItem(this.GACHA_PITY_KEY) || '12', 10) || 0;
    } catch {
      pity = 12;
    }

    const TIERS = [20, 40, 60, 80, 100];
    const REWARDS: Record<number, { sns: number; ap: number }> = {
      20: { sns: 30, ap: 10 },
      40: { sns: 50, ap: 15 },
      60: { sns: 80, ap: 20 },
      80: { sns: 120, ap: 25 },
      100: { sns: 300, ap: 40 },
    };

    const milestones: DailyActivityMilestone[] = TIERS.map((pts) => ({
      pointsRequired: pts,
      rewardSns: REWARDS[pts].sns,
      rewardAp: REWARDS[pts].ap,
      isClaimed: claimedPoints.includes(pts),
      canClaim: currentPts >= pts && !claimedPoints.includes(pts),
    }));

    return {
      currentActivityPoints: currentPts,
      milestones,
      gachaPityCount: pity,
      isNoonApClaimed: isNoon,
      isEveningApClaimed: isEvening,
      todayDate: today,
    };
  }

  /**
   * 활동 점수 추가 (미션 클리어, 덱 편집, 마켓 거래 등)
   */
  public addActivityPoints(points: number): EconomyHubState {
    const state = this.getState();
    const newPts = Math.min(100, state.currentActivityPoints + points);
    this.persistState(newPts, state.milestones.filter((m) => m.isClaimed).map((m) => m.pointsRequired), state.isNoonApClaimed, state.isEveningApClaimed);
    return this.getState();
  }

  /**
   * 마일스톤 보상 수령
   */
  public claimMilestone(tier: number): { success: boolean; rewardSns: number; rewardAp: number } {
    const state = this.getState();
    const target = state.milestones.find((m) => m.pointsRequired === tier);

    if (!target || !target.canClaim) {
      return { success: false, rewardSns: 0, rewardAp: 0 };
    }

    const claimed = state.milestones.filter((m) => m.isClaimed).map((m) => m.pointsRequired);
    claimed.push(tier);

    this.persistState(state.currentActivityPoints, claimed, state.isNoonApClaimed, state.isEveningApClaimed);

    // SNS 포인트 & AP 입금
    try {
      const currentSns = parseInt(localStorage.getItem('hero_sns_point') || '0', 10) || 0;
      localStorage.setItem('hero_sns_point', (currentSns + target.rewardSns).toString());

      const apRaw = localStorage.getItem('hero_stamina_ap');
      const apState = apRaw ? JSON.parse(apRaw) : { currentAp: 100, maxAp: 120, lastRegenTimestamp: Date.now() };
      apState.currentAp = Math.min(apState.maxAp, (apState.currentAp || 0) + target.rewardAp);
      localStorage.setItem('hero_stamina_ap', JSON.stringify(apState));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hero_sns_point_changed', {
            detail: { newBalance: currentSns + target.rewardSns, diff: target.rewardSns, reason: 'milestone' },
          })
        );
      }
    } catch {
      // ignore
    }

    return { success: true, rewardSns: target.rewardSns, rewardAp: target.rewardAp };
  }

  /**
   * 가챠 1회 시 천장 카운트 증가 (50회 도달 시 전설 확정 리셋)
   */
  public recordGachaPull(pullCount = 1): { currentPity: number; isGuaranteedTriggered: boolean } {
    let pity = 0;
    try {
      pity = parseInt(localStorage.getItem(this.GACHA_PITY_KEY) || '0', 10) || 0;
    } catch {
      pity = 0;
    }

    pity += pullCount;
    let isGuaranteed = false;

    if (pity >= this.MAX_PITY) {
      isGuaranteed = true;
      pity = 0; // 천장 달성 리셋
    }

    try {
      localStorage.setItem(this.GACHA_PITY_KEY, pity.toString());
    } catch {
      // ignore
    }

    return { currentPity: pity, isGuaranteedTriggered: isGuaranteed };
  }

  private persistState(points: number, claimedPoints: number[], isNoon: boolean, isEvening: boolean): void {
    const today = this.getTodayKey();
    try {
      localStorage.setItem(
        `${this.STORAGE_KEY}_${today}`,
        JSON.stringify({ points, claimedPoints, isNoon, isEvening })
      );
    } catch {
      // ignore
    }
  }
}
