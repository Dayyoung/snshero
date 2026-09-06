/**
 * staminaPacingManager.ts
 * 전 플랫폼 스태미나(AP) 페이싱 및 활동별 SNS 토큰 지급 표준화 매니저
 * (구글 스프레드시트 Row 1034 / ID 554 요구사항 구현)
 */

export interface StaminaPacingState {
  currentAp: number;
  maxAp: number;
  dailyFriendGiftsClaimed: number; // 오늘 수령한 친구 하트 AP 선물 수 (최대 3회 = 30 AP)
  lastGiftDate: string;
  totalPlayMinutes: number;
}

const STORAGE_KEY = 'hero_stamina_pacing_v1';
const MAX_AP = 100;
const AP_PER_MINUTE = 5; // 분당 5 AP 소모 표준
const FRIEND_GIFT_AP = 10; // 선물 1회당 10 AP
const MAX_DAILY_GIFTS = 3; // 1일 최대 3회 = 30 AP

export class StaminaPacingManager {
  private static instance: StaminaPacingManager;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): StaminaPacingManager {
    if (!StaminaPacingManager.instance) {
      StaminaPacingManager.instance = new StaminaPacingManager();
    }
    return StaminaPacingManager.instance;
  }

  private getTodayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private ensureInitialized(): void {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: StaminaPacingState = {
        currentAp: 100,
        maxAp: MAX_AP,
        dailyFriendGiftsClaimed: 0,
        lastGiftDate: this.getTodayStr(),
        totalPlayMinutes: 0,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }

  public getState(): StaminaPacingState {
    const today = this.getTodayStr();
    if (typeof window === 'undefined') {
      return {
        currentAp: 100,
        maxAp: MAX_AP,
        dailyFriendGiftsClaimed: 0,
        lastGiftDate: today,
        totalPlayMinutes: 0,
      };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StaminaPacingState = JSON.parse(raw);
        // 날짜 변경 시 친구 선물 카운터 리셋
        if (parsed.lastGiftDate !== today) {
          parsed.dailyFriendGiftsClaimed = 0;
          parsed.lastGiftDate = today;
          this.saveState(parsed);
        }
        return parsed;
      }
    } catch {
      // JSON parse error
    }

    return {
      currentAp: 100,
      maxAp: MAX_AP,
      dailyFriendGiftsClaimed: 0,
      lastGiftDate: today,
      totalPlayMinutes: 0,
    };
  }

  public saveState(state: StaminaPacingState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage error
    }
  }

  /**
   * 게임 플레이 시간에 비례한 AP 소모 계산 (분당 5 AP)
   * AP 부족 시에도 진입 허용 (단, 보상 50% 감쇄 모드 적용)
   */
  public consumeApForSession(durationSeconds: number): {
    consumed: number;
    hasRemainingAp: boolean;
    isDepletedMode: boolean; // AP 소진으로 50% 감쇄 보상 적용 여부
    remainingAp: number;
  } {
    const state = this.getState();
    const durationMinutes = Math.max(0.5, durationSeconds / 60);
    const requiredAp = Math.max(1, Math.round(durationMinutes * AP_PER_MINUTE));

    if (state.currentAp >= requiredAp) {
      state.currentAp -= requiredAp;
      state.totalPlayMinutes += durationMinutes;
      this.saveState(state);
      return {
        consumed: requiredAp,
        hasRemainingAp: true,
        isDepletedMode: false,
        remainingAp: state.currentAp,
      };
    } else {
      // AP가 부족한 경우: 잔여 AP 전액 소모 후 무소모 잔존 모드 (50% 감쇄) 발동
      const actualConsumed = state.currentAp;
      state.currentAp = 0;
      state.totalPlayMinutes += durationMinutes;
      this.saveState(state);
      return {
        consumed: actualConsumed,
        hasRemainingAp: false,
        isDepletedMode: true,
        remainingAp: 0,
      };
    }
  }

  /**
   * AP 소진 여부에 따른 최종 SNS 포인트 정규화 계산
   * AP 정상 보유: 100% 보상 지급
   * AP 소진(0 AP): 50% 정규화 보상 지급하여 무과금 유저 잔존율 유지
   */
  public calculateNormalizedSnsReward(baseSns: number, isDepleted: boolean): {
    finalSns: number;
    reductionNoticeKo: string;
    reductionNoticeEn: string;
  } {
    if (!isDepleted) {
      return {
        finalSns: baseSns,
        reductionNoticeKo: '정규 100% AP 보상 지급',
        reductionNoticeEn: '100% Standard AP Payout',
      };
    }

    const reduced = Math.max(1, Math.floor(baseSns * 0.5));
    return {
      finalSns: reduced,
      reductionNoticeKo: 'AP 소진 상태: 무제한 잔존 모드로 50% SNS 포인트 지급',
      reductionNoticeEn: 'AP Depleted: 50% Normalized Farming Active',
    };
  }

  /**
   * 친구 하트 교환을 통한 무료 AP 선물 수령 (하루 최대 3회 = 30 AP)
   */
  public claimFriendHeartAp(): {
    success: boolean;
    receivedAp: number;
    remainingClaimsToday: number;
    messageKo: string;
    messageEn: string;
  } {
    const state = this.getState();
    if (state.dailyFriendGiftsClaimed >= MAX_DAILY_GIFTS) {
      return {
        success: false,
        receivedAp: 0,
        remainingClaimsToday: 0,
        messageKo: '오늘의 친구 하트 AP 선물(최대 30 AP)을 모두 수령했습니다.',
        messageEn: 'Daily friend-heart AP gifts limit reached.',
      };
    }

    state.dailyFriendGiftsClaimed += 1;
    state.currentAp = Math.min(state.maxAp, state.currentAp + FRIEND_GIFT_AP);
    this.saveState(state);

    const remaining = MAX_DAILY_GIFTS - state.dailyFriendGiftsClaimed;
    return {
      success: true,
      receivedAp: FRIEND_GIFT_AP,
      remainingClaimsToday: remaining,
      messageKo: `친구 하트 선물로 +${FRIEND_GIFT_AP} AP가 충전되었습니다! (오늘 잔여: ${remaining}회)`,
      messageEn: `+${FRIEND_GIFT_AP} AP claimed from friend heart! (${remaining} left today)`,
    };
  }
}
