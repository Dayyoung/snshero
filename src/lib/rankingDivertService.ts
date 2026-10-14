/**
 * 랭킹 자동플레이 중 새로운 카드가 마이덱에 적용되었을 때
 * /main 모드 또는 /play 모드로 이동하여 새로운 카드플레이를 진행하고,
 * 3회 연속 패배 시 다시 랭킹플레이로 자동 복귀시키는 분기 서비스.
 */

import { Language } from '../types';
import { isDemoPlayActive, setDemoPlayStep } from './demoPlayService';

export const STORAGE_KEY_DIVERTED_MODE = 'hero_ranking_diverted_mode';
export const STORAGE_KEY_CONSECUTIVE_LOSSES = 'hero_diverted_consecutive_losses';
export const STORAGE_KEY_DIVERTED_MATCH_COUNT = 'hero_diverted_match_count';
export const STORAGE_KEY_DIVERT_VERIFIED = 'hero_diverted_verified';
export const MAX_CONSECUTIVE_LOSSES = 3;
export const MAX_DIVERTED_MATCHES = 3;

export type DivertedMode = 'main' | 'play';

/** 현재 랭킹에서 다른 모드(/main 또는 /play)로 전환되어 플레이 중인지 확인 */
export function isRankingDiverted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const mode = localStorage.getItem(STORAGE_KEY_DIVERTED_MODE);
    return mode === 'main' || mode === 'play';
  } catch {
    return false;
  }
}

/** 신규 덱 실전 검증 승리를 이미 1회 이상 달성했는지 여부 확인 */
export function isDivertVerified(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_DIVERT_VERIFIED) === 'true';
  } catch {
    return false;
  }
}

/** 현재 전환된 모드 가져오기 */
export function getDivertedMode(): DivertedMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const mode = localStorage.getItem(STORAGE_KEY_DIVERTED_MODE);
    if (mode === 'main' || mode === 'play') return mode;
    return null;
  } catch {
    return null;
  }
}

/** 현재 전환 모드에서의 연속 패배 횟수 가져오기 */
export function getDivertedLossCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONSECUTIVE_LOSSES);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/** 현재 전환 모드에서의 누적 진행 대전(경기) 수 가져오기 */
export function getDivertedMatchCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIVERTED_MATCH_COUNT);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * 랭킹 자동플레이 중 신규 카드가 마이덱에 적용되었을 때
 * /main 또는 /play로 이동하여 새로운 카드플레이를 시작하고,
 * [미션게임 3패 시 스토리모드] -> [스토리모드 3패 시 랭킹대전]으로 순환합니다.
 */
export function startRankingDivert(
  onNavigate: (view: string) => void,
  language: Language = 'ko',
  showCustomAlert?: (title: string, message: string, autoCloseSeconds?: number) => void,
  targetMode?: DivertedMode
): DivertedMode {
  // targetMode가 지정되어 있으면 우선 적용, 데모플레이 모드에서는 미션게임('play') 우선, 없으면 50:50 무작위 선택
  const chosenMode: DivertedMode = targetMode 
    ? targetMode 
    : (isDemoPlayActive() ? 'play' : (Math.random() < 0.5 ? 'main' : 'play'));

  try {
    localStorage.setItem(STORAGE_KEY_DIVERTED_MODE, chosenMode);
    localStorage.setItem(STORAGE_KEY_CONSECUTIVE_LOSSES, '0');
    localStorage.setItem(STORAGE_KEY_DIVERTED_MATCH_COUNT, '0');
    localStorage.removeItem(STORAGE_KEY_DIVERT_VERIFIED);
    // 전환 중에는 랭킹 루프 플래그 일시 해제
    localStorage.removeItem('hero_auto_loop_is_ranking');
    localStorage.removeItem('hero_auto_loop_mode');

    // 데모플레이 단계 업데이트
    if (isDemoPlayActive()) {
      setDemoPlayStep(chosenMode === 'play' ? 'mission' : 'story');
    }

    window.dispatchEvent(new CustomEvent('snshero_ranking_diverted', {
      detail: { mode: chosenMode, timestamp: Date.now() }
    }));
  } catch (e) {
    console.error('Failed to set ranking diverted mode in localStorage:', e);
  }

  const title = language === 'ko'
    ? (chosenMode === 'play' ? '🎮 [신규 덱 장착] 미션게임 실전 검증 시작!' : '📖 [신규 덱 장착] 스토리모드 실전 검증 시작!')
    : `🎴 [New Deck Equipped] Starting ${chosenMode === 'play' ? 'Mission Game' : 'Story Mode'}!`;

  const message = language === 'ko'
    ? `새로운 카드가 마이덱에 적용되었습니다!\n[${chosenMode === 'main' ? '/main (카단 RPG 메인)' : '/play (미션 & 아케이드)'}] 모드로 이동하여 3연속 대전을 진행합니다.\n(⚡ 3경기 완료 시 다음 순환 모드로 자동 이동합니다.)`
    : `A new card was applied to your deck!\nMoving to [${chosenMode === 'main' ? '/main (Kadan RPG)' : '/play (Mission & Arcade)'}] mode for 3 matches.\n(⚡ Will transition to next mode after 3 matches.)`;

  let isAuto = false;
  try {
    isAuto = localStorage.getItem('hero_auto_battle') === 'true';
  } catch {}

  // 자동 카드 플레이 중이 아닐 때만 전환 안내 모달을 띄움
  if (!isAuto && showCustomAlert) {
    showCustomAlert(title, message, 3);
  }

  // 모드별 화면으로 이동
  onNavigate(chosenMode);
  return chosenMode;
}

/**
 * 전환 모드에서 매치 결과 발생 시 호출
 * - 승패 상관없이 3연속 대전(3 matches)을 진행하면 다음 과정으로 무조건 전환!
 *   - 미션게임('play') 3전 완료 시: 스토리모드('main')로 전환!
 *   - 스토리모드('main') 3전 완료 시: 랭킹대전('ranking')으로 순환 복귀!
 *   - 3전 미만: 해당 모드로 계속 진행
 */
export function handleDivertedMatchResult(
  result: 'win' | 'loss' | 'draw',
  onNavigate: (view: string) => void,
  language: Language = 'ko',
  showCustomAlert?: (title: string, message: string, autoCloseSeconds?: number) => void,
  isAutoBattleMode?: boolean
): { shouldReturnToRanking: boolean; consecutiveLosses: number } {
  if (!isRankingDiverted()) {
    return { shouldReturnToRanking: false, consecutiveLosses: 0 };
  }

  const currentMode = getDivertedMode() || 'main';
  const currentMatches = getDivertedMatchCount();
  const nextMatches = currentMatches + 1;
  const alreadyVerified = isDivertVerified();

  // 대전 수 누적 저장
  try {
    localStorage.setItem(STORAGE_KEY_DIVERTED_MATCH_COUNT, String(nextMatches));
  } catch {}

  // 자동 카드 플레이 여부 확인
  let isAuto = isAutoBattleMode;
  if (typeof isAuto !== 'boolean') {
    try {
      isAuto = localStorage.getItem('hero_auto_battle') === 'true' ||
               localStorage.getItem('hero_auto_loop_mode') !== null ||
               localStorage.getItem('hero_auto_start_pvp') === 'true';
    } catch {
      isAuto = false;
    }
  }

  if (result === 'win' && !alreadyVerified) {
    // 최초 1회 실전 검증 성공 영구 마킹
    try {
      localStorage.setItem(STORAGE_KEY_DIVERT_VERIFIED, 'true');
      window.dispatchEvent(new CustomEvent('snshero_divert_verified', {
        detail: { mode: currentMode, timestamp: Date.now() }
      }));
    } catch {}
  }

  // 🌟 핵심: 승패 상관없이 3연속 대전 도달 시 무조건 다음 순환 과정으로 직행!
  if (nextMatches >= MAX_DIVERTED_MATCHES) {
    // 1) 미션게임('play')에서 3전 완료 -> 스토리모드('main')로 전환!
    if (currentMode === 'play') {
      const title = language === 'ko' ? '📖 [미션게임 3전 완료] 스토리모드로 전환' : '📖 [3 Matches Complete] Moving to Story Mode';
      const message = language === 'ko'
        ? '미션게임 3연속 대전을 완료하였습니다. 이제 [스토리모드]로 전환하여 새로운 대결을 시작합니다!'
        : 'Completed 3 mission matches. Moving to [Story Mode]!';

      if (!isAuto && showCustomAlert) {
        showCustomAlert(title, message, 3);
      }

      setTimeout(() => {
        startRankingDivert(onNavigate, language, showCustomAlert, 'main');
      }, 1200);

      return { shouldReturnToRanking: false, consecutiveLosses: 0 };
    }

    // 2) 스토리모드('main')에서 3전 완료 -> 랭킹대전('ranking')으로 순환 복귀!
    endRankingDivert(true);
    if (isDemoPlayActive()) {
      setDemoPlayStep('ranking');
    }

    const title = language === 'ko' ? '⚔️ [스토리모드 3전 완료] 랭킹대전 순환 복귀' : '⚔️ [3 Matches Complete] Returning to Rank Match';
    const message = language === 'ko'
      ? '스토리모드 3연속 대전을 완료하였습니다. 다시 [랭킹대전]으로 순환 복귀합니다!'
      : 'Completed 3 story matches. Returning to [Rank Match]!';

    if (!isAuto && showCustomAlert) {
      showCustomAlert(title, message, 3);
    }

    // 랭킹 뷰로 복귀
    setTimeout(() => {
      onNavigate('ranking');
    }, 1200);

    return { shouldReturnToRanking: true, consecutiveLosses: MAX_DIVERTED_MATCHES };
  }

  // 3전 미만인 경우: 다음 대전 계속 진행
  return { shouldReturnToRanking: false, consecutiveLosses: nextMatches };
}

/** 전환 모드 종료 및 초기화 */
export function endRankingDivert(returnToRanking: boolean = false): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DIVERTED_MODE);
    localStorage.removeItem(STORAGE_KEY_CONSECUTIVE_LOSSES);
    localStorage.removeItem(STORAGE_KEY_DIVERTED_MATCH_COUNT);
    localStorage.removeItem(STORAGE_KEY_DIVERT_VERIFIED);
    if (returnToRanking) {
      localStorage.setItem('hero_auto_loop_is_ranking', 'true');
      localStorage.setItem('hero_auto_start_pvp', 'true');
      window.dispatchEvent(new Event('hero_first_win_updated'));
    }
    window.dispatchEvent(new Event('snshero_ranking_divert_ended'));
  } catch (e) {
    console.error('Failed to clear ranking diverted mode:', e);
  }
}
