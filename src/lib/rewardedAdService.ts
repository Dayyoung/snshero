/**
 * rewardedAdService.ts
 * Google AdSense H5 Games Rewarded Ads 및 Fallback 광고 연동 서비스
 * 
 * 기능:
 * 1. Google AdSense H5 Games AdBreak API (adBreak({ type: 'reward', ... })) 연동
 * 2. 광고 제거 소유자(isAdRemoved): 0초 대기 없이 즉시 보상 지급 (VIP 1-Click Skip)
 * 3. 3대 핵심 보상 루프(승리 보상 2배, 일일 무료 가챠, 패배 시 부활) 횟수 및 쿨다운 관리
 */

export type RewardedAdType = 'victory_2x' | 'free_gacha' | 'battle_revive' | 'continue_mission';

export interface RewardedAdLimits {
  victory_2x: number;
  free_gacha: number;
  battle_revive: number;
  continue_mission: number;
}

export const DAILY_REWARDED_LIMITS: RewardedAdLimits = {
  victory_2x: 10,       // 일일 배틀 승리 2배 최대 10회
  free_gacha: 3,        // 일일 무료 가챠 보너스 최대 3회
  battle_revive: 2,     // 일일 패배 시 부활 최대 2회
  continue_mission: 5,  // 일일 미션 이어하기 최대 5회
};

const STORAGE_KEY_PREFIX = 'hero_rewarded_counts_';

function getTodayKey(): string {
  const d = new Date();
  return `${STORAGE_KEY_PREFIX}${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

/**
 * 오늘 특정 타입의 보상형 광고 시청 횟수 조회
 */
export function getDailyRewardedCount(type: RewardedAdType): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(getTodayKey());
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return typeof parsed[type] === 'number' ? parsed[type] : 0;
  } catch {
    return 0;
  }
}

/**
 * 특정 타입의 보상형 광고 잔여 가능 횟수 조회
 */
export function getRemainingRewardedCount(type: RewardedAdType, isAdRemoved = false): number {
  if (isAdRemoved) return 999; // VIP 회원은 무제한 스킵 가능
  const used = getDailyRewardedCount(type);
  const max = DAILY_REWARDED_LIMITS[type] || 5;
  return Math.max(0, max - used);
}

/**
 * 보상형 광고 시청 완료 기록
 */
export function recordRewardedAdView(type: RewardedAdType): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getTodayKey();
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[type] = (parsed[type] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(parsed));
    
    // 글로벌 이벤트 디스패치
    window.dispatchEvent(new CustomEvent('hero_rewarded_ad_watched', { detail: { type } }));
  } catch (err) {
    console.error('Failed to record rewarded ad view:', err);
  }
}

/**
 * 광고 제거 VIP 패스 활성화 여부 확인
 */
export function checkIsAdRemoved(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('hero_ad_removed') === 'true';
}

/**
 * 보상형 광고 요청 및 시청 (또는 VIP 1클릭 즉시 수령)
 * 
 * @param type 보상형 광고 타입 ('victory_2x' | 'free_gacha' | 'battle_revive' 등)
 * @param onProgress 진행률 콜백 (fallback UI용)
 * @returns boolean 보상 지급 성공 여부
 */
export async function requestRewardedAd(
  type: RewardedAdType,
  onProgress?: (secondsLeft: number) => void
): Promise<{ success: boolean; isVipSkip: boolean; error?: string }> {
  const isVip = checkIsAdRemoved();

  // 1. VIP 광고 제거 회원은 0.05초 내에 즉시 승인!
  if (isVip) {
    recordRewardedAdView(type);
    return { success: true, isVipSkip: true };
  }

  // 2. 일일 한도 체크
  const remaining = getRemainingRewardedCount(type, false);
  if (remaining <= 0) {
    return { 
      success: false, 
      isVipSkip: false, 
      error: '오늘의 무료 보상형 광고 시청 한도를 모두 소진하였습니다.' 
    };
  }

  // 3. Google AdSense H5 Game adBreak API 시도
  if (typeof window !== 'undefined' && (window as any).adBreak) {
    try {
      const rewardedResult = await new Promise<boolean>((resolve) => {
        let rewarded = false;
        (window as any).adBreak({
          type: 'reward',
          name: `rewarded_${type}`,
          beforeReward: (showAdFn: () => void) => {
            showAdFn();
          },
          adViewed: () => {
            rewarded = true;
            resolve(true);
          },
          adDismissed: () => {
            resolve(rewarded);
          },
          adError: () => {
            // 광고 로드 실패 시 유저 경험을 해치지 않기 위해 fallback 성공 처리
            resolve(true);
          }
        });
      });

      if (rewardedResult) {
        recordRewardedAdView(type);
        return { success: true, isVipSkip: false };
      }
    } catch {
      // Fallback fallback modal flow
    }
  }

  // 4. Fallback: 시각적 3초 보상형 스폰서십 광고 타이머
  // (실제 광고 스크립트가 아직 로드되지 않았거나 차단된 환경에서도 100% 안정적 동작 보장)
  const waitDuration = 3;
  for (let s = waitDuration; s > 0; s--) {
    if (onProgress) onProgress(s);
    await new Promise((r) => setTimeout(r, 1000));
  }

  recordRewardedAdView(type);
  return { success: true, isVipSkip: false };
}
