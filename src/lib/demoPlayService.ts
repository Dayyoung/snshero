/**
 * SNSHero 데모플레이 모드 서비스 (Demo Play Loop Service)
 * 
 * 홈화면에서 30초 비조작 시 데모플레이 모드가 자동 실행되며,
 * [랭킹대전] -> [승리 시 상점 카드뽑기] -> [신규카드 시 마이덱] -> [마이덱 변경 시 미션게임]
 * -> [미션게임 3패 시 스토리모드] -> [스토리모드 3패 시 랭킹대전] 순으로 무한 순환합니다.
 * 언제든지 유저가 화면을 조작하거나 중지 버튼을 누르면 즉시 데모플레이가 종료됩니다.
 */

export const STORAGE_KEY_DEMO_PLAY_ACTIVE = 'hero_demo_play_active';
export const STORAGE_KEY_DEMO_PLAY_STEP = 'hero_demo_play_step';

export type DemoPlayStep = 'ranking' | 'shop' | 'mydeck' | 'mission' | 'story';

export const DEMO_PLAY_STEPS: { id: DemoPlayStep; labelKo: string; labelEn: string; icon: string }[] = [
  { id: 'ranking', labelKo: '1.랭킹대전', labelEn: '1.Rank Match', icon: '⚔️' },
  { id: 'shop', labelKo: '2.상점소환', labelEn: '2.Card Summon', icon: '🎁' },
  { id: 'mydeck', labelKo: '3.마이덱', labelEn: '3.My Deck', icon: '🎴' },
  { id: 'mission', labelKo: '4.미션게임(3패시)', labelEn: '4.Mission Game', icon: '🎮' },
  { id: 'story', labelKo: '5.스토리모드(3패시)', labelEn: '5.Story Mode', icon: '📖' },
];

/** 현재 데모플레이 모드가 활성 상태인지 확인 */
export function isDemoPlayActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_DEMO_PLAY_ACTIVE) === 'true';
  } catch {
    return false;
  }
}

/** 현재 데모플레이 진행 단계 가져오기 */
export function getDemoPlayStep(): DemoPlayStep {
  if (typeof window === 'undefined') return 'ranking';
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMO_PLAY_STEP);
    if (raw === 'ranking' || raw === 'shop' || raw === 'mydeck' || raw === 'mission' || raw === 'story') {
      return raw;
    }
    return 'ranking';
  } catch {
    return 'ranking';
  }
}

/** 데모플레이 진행 단계 설정 */
export function setDemoPlayStep(step: DemoPlayStep): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEMO_PLAY_STEP, step);
    window.dispatchEvent(new CustomEvent('snshero_demo_play_step_changed', {
      detail: { step, timestamp: Date.now() }
    }));
  } catch (e) {
    console.error('Failed to set demo play step:', e);
  }
}

/** 데모플레이 모드 시작 (1단계: 랭킹대전부터 출발) */
export function startDemoPlay(onNavigate: (view: string) => void): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEMO_PLAY_ACTIVE, 'true');
    localStorage.setItem(STORAGE_KEY_DEMO_PLAY_STEP, 'ranking');
    localStorage.setItem('hero_auto_loop_is_ranking', 'true');
    localStorage.setItem('hero_auto_start_pvp', 'true');
    localStorage.setItem('hero_auto_battle', 'true');
    // 기존 불필요 잔여 플래그 정리
    localStorage.removeItem('hero_auto_loop_mode');

    window.dispatchEvent(new CustomEvent('snshero_demo_play_changed', {
      detail: { active: true, step: 'ranking', timestamp: Date.now() }
    }));
  } catch (e) {
    console.error('Failed to start demo play:', e);
  }

  // 랭킹대전으로 이동
  onNavigate('ranking');
}

/** 데모플레이 모드 중단 및 초기화 */
export function stopDemoPlay(onNavigate?: (view: string) => void): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DEMO_PLAY_ACTIVE);
    localStorage.removeItem(STORAGE_KEY_DEMO_PLAY_STEP);
    localStorage.removeItem('hero_auto_loop_mode');
    localStorage.removeItem('hero_auto_loop_is_ranking');
    localStorage.removeItem('hero_auto_start_pvp');
    localStorage.removeItem('hero_ranking_diverted_mode');
    localStorage.removeItem('hero_diverted_consecutive_losses');
    localStorage.removeItem('hero_diverted_verified');

    window.dispatchEvent(new CustomEvent('snshero_demo_play_changed', {
      detail: { active: false, timestamp: Date.now() }
    }));
  } catch (e) {
    console.error('Failed to stop demo play:', e);
  }

  if (onNavigate) {
    onNavigate('home');
  }
}
