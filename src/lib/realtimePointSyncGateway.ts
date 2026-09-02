/**
 * realtimePointSyncGateway.ts
 * 미션 플레이 시간 및 난이도별 분당 SNS 포인트 실시간 계산기 및 지갑 동기화 엔진
 * (구글 스프레드시트 Row 786 / ID 555 요구사항 구현)
 */

export interface MissionSessionTracker {
  missionId: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'boss';
  startTime: number;
  baseRatePerMin: number; // 50P/min
}

export interface EstimatedPayout {
  elapsedSeconds: number;
  difficultyMultiplier: number;
  calculatedSns: number;
  perfectBonus: number;
  totalEstimatedSns: number;
}

const DIFFICULTY_MULTIPLIERS: Record<'easy' | 'normal' | 'hard' | 'boss', number> = {
  easy: 1.0,
  normal: 1.2,
  hard: 1.5,
  boss: 2.0,
};

export class RealtimePointSyncGateway {
  private static instance: RealtimePointSyncGateway;
  private activeSession: MissionSessionTracker | null = null;

  private constructor() {}

  public static getInstance(): RealtimePointSyncGateway {
    if (!RealtimePointSyncGateway.instance) {
      RealtimePointSyncGateway.instance = new RealtimePointSyncGateway();
    }
    return RealtimePointSyncGateway.instance;
  }

  /**
   * 미션 플레이 세션 시작
   */
  public startSession(missionId: string, difficulty: 'easy' | 'normal' | 'hard' | 'boss' = 'normal'): void {
    this.activeSession = {
      missionId,
      difficulty,
      startTime: Date.now(),
      baseRatePerMin: 50,
    };
  }

  /**
   * 진행 시간에 따른 실시간 지급 예상 SNS 포인트 계산
   */
  public getEstimatedPayout(isPerfect: boolean = false): EstimatedPayout {
    if (!this.activeSession) {
      return {
        elapsedSeconds: 0,
        difficultyMultiplier: 1.0,
        calculatedSns: 10,
        perfectBonus: 0,
        totalEstimatedSns: 10,
      };
    }

    const elapsedMs = Math.max(0, Date.now() - this.activeSession.startTime);
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const durationMinutes = Math.max(0.2, elapsedSeconds / 60);

    const mult = DIFFICULTY_MULTIPLIERS[this.activeSession.difficulty] || 1.0;
    const rawSns = Math.round(durationMinutes * this.activeSession.baseRatePerMin * mult);
    const baseSns = Math.min(200, Math.max(10, rawSns)); // 최소 10P ~ 최대 200P 보장
    const perfectBonus = isPerfect ? Math.round(baseSns * 0.2) : 0;

    return {
      elapsedSeconds,
      difficultyMultiplier: mult,
      calculatedSns: baseSns,
      perfectBonus,
      totalEstimatedSns: baseSns + perfectBonus,
    };
  }

  /**
   * 미션 클리어 시 지갑 원자적 동기화
   */
  public commitMissionClear(isPerfect: boolean = false): {
    awardedSns: number;
    newTotalSns: number;
    missionId: string;
  } {
    const payout = this.getEstimatedPayout(isPerfect);
    const missionId = this.activeSession?.missionId || 'unknown_mission';
    this.activeSession = null;

    let currentSns = 0;
    try {
      currentSns = parseInt(localStorage.getItem('hero_sns_point') || '0', 10);
      if (isNaN(currentSns)) currentSns = 0;
    } catch {
      currentSns = 0;
    }

    const newTotalSns = currentSns + payout.totalEstimatedSns;
    try {
      localStorage.setItem('hero_sns_point', newTotalSns.toString());
    } catch (e) {
      console.error('Failed to commit SNS point:', e);
    }

    return {
      awardedSns: payout.totalEstimatedSns,
      newTotalSns,
      missionId,
    };
  }
}

export const realtimePointSyncGateway = RealtimePointSyncGateway.getInstance();
