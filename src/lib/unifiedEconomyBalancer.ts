/**
 * unifiedEconomyBalancer.ts
 * 활동별(PVP/PVE/미션게임/마켓) 표준 시간당 SNS 포인트 상한선 및 일일 AP 마일스톤 리베이트 모듈
 * (구글 스프레드시트 Row 914 / ID 562 요구사항 구현)
 */

export interface DailyApMilestone {
  tier: 'bronze' | 'silver' | 'gold';
  requiredAp: number;
  rewardSns: number;
  bonusItemName: string;
  isClaimed: boolean;
  canClaim: boolean;
}

export interface EconomyBalanceState {
  todaySpentAp: number;
  hourlyNormalizedSnsRate: number; // 50P/min = 3,000P/hr
  milestones: DailyApMilestone[];
  lastClaimDate: string;
}

export class UnifiedEconomyBalancer {
  private static instance: UnifiedEconomyBalancer;
  private readonly STORAGE_KEY_AP_SPENT = 'hero_stamina_spent_today';
  private readonly STORAGE_KEY_REBATE = 'hero_ap_rebate_claims';
  private readonly HOURLY_TARGET_SNS = 3000; // 분당 50P 기준 1시간 3000 SNS

  private constructor() {}

  public static getInstance(): UnifiedEconomyBalancer {
    if (!UnifiedEconomyBalancer.instance) {
      UnifiedEconomyBalancer.instance = new UnifiedEconomyBalancer();
    }
    return UnifiedEconomyBalancer.instance;
  }

  private getTodayDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * 오늘 소모한 스태미나(AP) 조회
   */
  public getTodaySpentAp(): number {
    const today = this.getTodayDateKey();
    try {
      const raw = localStorage.getItem(`${this.STORAGE_KEY_AP_SPENT}_${today}`);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * 스태미나 소모 기록 (전투/미션 시작 시 호출)
   */
  public recordApSpent(amount: number): number {
    const today = this.getTodayDateKey();
    const key = `${this.STORAGE_KEY_AP_SPENT}_${today}`;
    const current = this.getTodaySpentAp();
    const updated = current + Math.max(0, amount);
    try {
      localStorage.setItem(key, updated.toString());
    } catch {
      // ignore
    }
    return updated;
  }

  /**
   * 일일 마일스톤 현황 조회
   */
  public getEconomyBalanceState(): EconomyBalanceState {
    const today = this.getTodayDateKey();
    const spentAp = this.getTodaySpentAp();

    let claims: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(`${this.STORAGE_KEY_REBATE}_${today}`);
      if (raw) claims = JSON.parse(raw);
    } catch {
      claims = {};
    }

    const milestones: DailyApMilestone[] = [
      {
        tier: 'bronze',
        requiredAp: 30,
        rewardSns: 50,
        bonusItemName: '일반 지원팩 [1팩]',
        isClaimed: Boolean(claims['bronze']),
        canClaim: spentAp >= 30 && !claims['bronze'],
      },
      {
        tier: 'silver',
        requiredAp: 60,
        rewardSns: 120,
        bonusItemName: '매직 강화석 [3개]',
        isClaimed: Boolean(claims['silver']),
        canClaim: spentAp >= 60 && !claims['silver'],
      },
      {
        tier: 'gold',
        requiredAp: 100,
        rewardSns: 250,
        bonusItemName: '희귀 소환 티켓 [1장]',
        isClaimed: Boolean(claims['gold']),
        canClaim: spentAp >= 100 && !claims['gold'],
      },
    ];

    return {
      todaySpentAp: spentAp,
      hourlyNormalizedSnsRate: this.HOURLY_TARGET_SNS,
      milestones,
      lastClaimDate: today,
    };
  }

  /**
   * 일일 AP 소모 마일스톤 리베이트 상자 수령
   */
  public claimMilestoneRebate(tier: 'bronze' | 'silver' | 'gold'): { success: boolean; rewardSns: number; message: string } {
    const state = this.getEconomyBalanceState();
    const target = state.milestones.find((m) => m.tier === tier);

    if (!target) {
      return { success: false, rewardSns: 0, message: '존재하지 않는 마일스톤입니다.' };
    }
    if (target.isClaimed) {
      return { success: false, rewardSns: 0, message: '이미 수령한 마일스톤 보상입니다.' };
    }
    if (!target.canClaim) {
      return {
        success: false,
        rewardSns: 0,
        message: `AP가 부족합니다. (현재: ${state.todaySpentAp}/${target.requiredAp} AP)`,
      };
    }

    const today = this.getTodayDateKey();
    try {
      // 1. 클레임 상태 기록
      const raw = localStorage.getItem(`${this.STORAGE_KEY_REBATE}_${today}`);
      const claims = raw ? JSON.parse(raw) : {};
      claims[tier] = true;
      localStorage.setItem(`${this.STORAGE_KEY_REBATE}_${today}`, JSON.stringify(claims));

      // 2. SNS 포인트 즉시 입금
      const currentSns = parseInt(localStorage.getItem('hero_sns_point') || '0', 10) || 0;
      const newSns = currentSns + target.rewardSns;
      localStorage.setItem('hero_sns_point', newSns.toString());

      // 3. 거래 내역 추가
      const historyRaw = localStorage.getItem('hero_sns_history');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift({
        id: `rebate_${tier}_${Date.now()}`,
        type: 'ap_rebate_bonus',
        amount: target.rewardSns,
        description: `[AP 마일스톤 리베이트] ${tier.toUpperCase()} 상자 (${target.bonusItemName})`,
        timestamp: Date.now(),
        previousBalance: currentSns,
        newBalance: newSns,
      });
      localStorage.setItem('hero_sns_history', JSON.stringify(history.slice(0, 100)));

      // 4. UI 갱신 이벤트
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hero_sns_point_changed', {
            detail: { newBalance: newSns, diff: target.rewardSns, reason: 'ap_rebate' },
          })
        );
      }

      return {
        success: true,
        rewardSns: target.rewardSns,
        message: `${target.rewardSns} SNS 및 [${target.bonusItemName}] 수령 완료!`,
      };
    } catch (e) {
      return { success: false, rewardSns: 0, message: `수령 처리 중 오류 발생: ${String(e)}` };
    }
  }
}
