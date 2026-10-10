/**
 * pwaRewardService.ts
 * PWA 설치 및 웹푸시 알림 등록 이벤트 보상 관리 서비스
 * 
 * 1. PWA 설치(+100 SNS) 및 웹푸시 알림 등록(+100 SNS) 보상 상태 관리
 * 2. 100% 로컬스토리지 기반 중복 수령 방지 및 영구 보존
 * 3. 메인화면 이벤트 팝업 노출 여부(오늘 하루 보지 않기) 관리
 */

export const HERO_PWA_INSTALL_REWARD_KEY = 'hero_pwa_install_reward_claimed';
export const HERO_PUSH_REWARD_KEY = 'hero_push_notification_reward_claimed';
export const HERO_PWA_EVENT_DISMISSED_AT_KEY = 'hero_pwa_event_modal_dismissed_at';

export const PWA_INSTALL_REWARD_AMOUNT = 100;
export const PUSH_NOTIFICATION_REWARD_AMOUNT = 100;

export class PwaRewardService {
  /**
   * PWA 설치 보상 수령 여부 확인
   */
  static isPwaRewardClaimed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(HERO_PWA_INSTALL_REWARD_KEY) === 'true';
  }

  /**
   * 웹푸시 알림 등록 보상 수령 여부 확인
   */
  static isPushRewardClaimed(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(HERO_PUSH_REWARD_KEY) === 'true';
  }

  /**
   * 모든 보상을 이미 수령했는지 확인
   */
  static areAllRewardsClaimed(): boolean {
    return this.isPwaRewardClaimed() && this.isPushRewardClaimed();
  }

  /**
   * PWA 설치 보상 수령 처리 (+100 SNS)
   */
  static claimPwaReward(addSns: (amount: number, reason?: string, type?: string) => void): boolean {
    if (this.isPwaRewardClaimed()) return false;
    
    localStorage.setItem(HERO_PWA_INSTALL_REWARD_KEY, 'true');
    addSns(PWA_INSTALL_REWARD_AMOUNT, 'pwa_install_event_reward', 'earned');
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hero_pwa_rewards_updated'));
    }
    return true;
  }

  /**
   * 웹푸시 알림 등록 보상 수령 처리 (+100 SNS)
   */
  static claimPushReward(addSns: (amount: number, reason?: string, type?: string) => void): boolean {
    if (this.isPushRewardClaimed()) return false;
    
    localStorage.setItem(HERO_PUSH_REWARD_KEY, 'true');
    addSns(PUSH_NOTIFICATION_REWARD_AMOUNT, 'web_push_event_reward', 'earned');
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hero_pwa_rewards_updated'));
    }
    return true;
  }

  /**
   * 오늘 하루 팝업 닫기 여부 확인 (24시간 기준)
   */
  static isEventDismissedToday(): boolean {
    if (typeof window === 'undefined') return false;
    const dismissedAt = localStorage.getItem(HERO_PWA_EVENT_DISMISSED_AT_KEY);
    if (!dismissedAt) return false;

    const timePassed = Date.now() - parseInt(dismissedAt, 10);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    return timePassed < TWENTY_FOUR_HOURS;
  }

  /**
   * 오늘 하루 팝업 닫기 설정
   */
  static setEventDismissedToday(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(HERO_PWA_EVENT_DISMISSED_AT_KEY, Date.now().toString());
  }
}
