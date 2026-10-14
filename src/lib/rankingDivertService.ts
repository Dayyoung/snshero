/**
 * 랭킹 자동플레이 중 새로운 카드가 마이덱에 적용되었을 때
 * /main 모드 또는 /play 모드로 이동하여 새로운 카드플레이를 진행하고,
 * 3회 연속 패배 시 다시 랭킹플레이로 자동 복귀시키는 분기 서비스.
 */

import { Language } from '../types';
import { isDemoPlayActive, setDemoPlayStep } from './demoPlayService';

export const STORAGE_KEY_DIVERTED_MODE = 'hero_ranking_diverted_mode';
export const STORAGE_KEY_CONSECUTIVE_LOSSES = 'hero_diverted_consecutive_losses';
export const STORAGE_KEY_DIVERT_VERIFIED = 'hero_diverted_verified';
export const MAX_CONSECUTIVE_LOSSES = 3;

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
    ? `새로운 카드가 마이덱에 적용되었습니다!\n[${chosenMode === 'main' ? '/main (카단 RPG 메인)' : '/play (미션 & 아케이드)'}] 모드로 이동하여 실전 카드 대결을 시작합니다.\n(⚠️ 3회 연속 패배 시 다음 순환 모드로 자동 전환됩니다.)`
    : `A new card was applied to your deck!\nMoving to [${chosenMode === 'main' ? '/main (Kadan RPG)' : '/play (Mission & Arcade)'}] mode to battle with your new deck.\n(⚠️ Will transition on 3 consecutive losses.)`;

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
 * - 승리 시: 연속 패배 카운트 리셋 (0) & 실전 검증 완료(최초 1회만 기록) & 계속 진행
 * - 패배 시: 연속 패배 카운트 +1
 *   - 미션게임('play') 3회 연속 패배 시: 스토리모드('main')로 전환!
 *   - 스토리모드('main') 3회 연속 패배 시: 랭킹대전('ranking')으로 순환 복귀!
 *   - 3회 미만: 해당 모드로 계속 진행
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
  const currentLosses = getDivertedLossCount();
  const alreadyVerified = isDivertVerified();

  // 자동 카드 플레이 여부 확인 (파라미터 우선, 없으면 로컬스토리지 확인)
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

  if (result === 'win') {
    // 승리 시 연속 패배 리셋
    try {
      localStorage.setItem(STORAGE_KEY_CONSECUTIVE_LOSSES, '0');
    } catch {}

    // 이미 이번 전환에서 검증 승리를 달성했다면 더 이상 중복 팝업/알림을 띄우지 않고 조용히 리턴
    if (alreadyVerified) {
      return { shouldReturnToRanking: false, consecutiveLosses: 0 };
    }

    // 최초 1회 실전 검증 성공 영구 마킹
    try {
      localStorage.setItem(STORAGE_KEY_DIVERT_VERIFIED, 'true');
      window.dispatchEvent(new CustomEvent('snshero_divert_verified', {
        detail: { mode: currentMode, timestamp: Date.now() }
      }));
    } catch {}

    const title = language === 'ko' ? '🎉 [승리] 새로운 덱 실전 검증 성공!' : '🎉 [Victory] New Deck Verified!';
    const message = language === 'ko'
      ? `신규 카드가 적용된 덱으로 승리를 거두었습니다!\n[${currentMode === 'main' ? '/main' : '/play'}] 모드로 계속 카드플레이를 진행합니다.`
      : `Victory with the new deck!\nContinuing card play in [${currentMode === 'main' ? '/main' : '/play'}] mode.`;

    // 자동 카드 플레이 중일 때는 게임 흐름을 막는 모달 팝업(showCustomAlert)을 절대 띄우지 않음!
    if (!isAuto && showCustomAlert) {
      showCustomAlert(title, message, 3);
    }

    return { shouldReturnToRanking: false, consecutiveLosses: 0 };
  }

  if (result === 'loss') {
    const nextLosses = currentLosses + 1;
    try {
      localStorage.setItem(STORAGE_KEY_CONSECUTIVE_LOSSES, String(nextLosses));
    } catch {}

    // 3회 연속 패배 도달 시 순환 분기 처리!
    if (nextLosses >= MAX_CONSECUTIVE_LOSSES) {
      // 1) 미션게임('play')에서 3패 시 -> 스토리모드('main')로 전환!
      if (currentMode === 'play') {
        const title = language === 'ko' ? '📖 [미션게임 3패] 스토리모드로 전환' : '📖 [3 Losses] Moving to Story Mode';
        const message = language === 'ko'
          ? '미션게임에서 3회 패배하여 전열을 가다듬기 위해 [스토리모드]로 전환합니다!'
          : '3 losses in Mission Game. Moving to [Story Mode]!';

        if (!isAuto && showCustomAlert) {
          showCustomAlert(title, message, 3);
        }

        setTimeout(() => {
          startRankingDivert(onNavigate, language, showCustomAlert, 'main');
        }, 1200);

        return { shouldReturnToRanking: false, consecutiveLosses: 0 };
      }

      // 2) 스토리모드('main')에서 3패 시 -> 랭킹대전('ranking')으로 순환 복귀!
      endRankingDivert(true);
      if (isDemoPlayActive()) {
        setDemoPlayStep('ranking');
      }

      const title = language === 'ko' ? '⚔️ [스토리모드 3패] 랭킹대전 자동 복귀' : '⚔️ [3 Losses] Returning to Rank Match';
      const message = language === 'ko'
        ? '스토리모드에서 3회 패배하였습니다. [랭킹대전]으로 순환 복귀하여 새로운 라이벌에 도전합니다!'
        : '3 losses in Story Mode. Returning to [Rank Match] to challenge new rivals!';

      if (!isAuto && showCustomAlert) {
        showCustomAlert(title, message, 3);
      }

      // 랭킹 뷰로 복귀
      setTimeout(() => {
        onNavigate('ranking');
      }, 1200);

      return { shouldReturnToRanking: true, consecutiveLosses: MAX_CONSECUTIVE_LOSSES };
    } else {
      // 3회 미만 패배: 계속 진행 (자동 카드 플레이 중이면 중간 패배 팝업도 띄우지 않음)
      const title = language === 'ko' ? `⚔️ [패배 ${nextLosses}/${MAX_CONSECUTIVE_LOSSES}] 모드 유지` : `⚔️ [Loss ${nextLosses}/${MAX_CONSECUTIVE_LOSSES}] Staying in Mode`;
      const message = language === 'ko'
        ? `패배하였습니다 (연속 ${nextLosses}회 / 3회 도달 시 모드 전환).\n[${currentMode === 'main' ? '/main (스토리)' : '/play (미션)'}] 모드에서 도전을 계속 진행합니다!`
        : `Defeated (${nextLosses}/3 consecutive losses).\nContinuing in [${currentMode === 'main' ? '/main' : '/play'}] mode!`;

      if (!isAuto && showCustomAlert) {
        showCustomAlert(title, message, 3);
      }

      return { shouldReturnToRanking: false, consecutiveLosses: nextLosses };
    }
  }

  // 무승부인 경우 카운트 유지
  return { shouldReturnToRanking: false, consecutiveLosses: currentLosses };
}

/** 전환 모드 종료 및 초기화 */
export function endRankingDivert(returnToRanking: boolean = false): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DIVERTED_MODE);
    localStorage.removeItem(STORAGE_KEY_CONSECUTIVE_LOSSES);
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
