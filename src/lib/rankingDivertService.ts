/**
 * 랭킹 자동플레이 중 새로운 카드가 마이덱에 적용되었을 때
 * /main 모드 또는 /play 모드로 이동하여 새로운 카드플레이를 진행하고,
 * 3회 연속 패배 시 다시 랭킹플레이로 자동 복귀시키는 분기 서비스.
 */

import { Language } from '../types';

export const STORAGE_KEY_DIVERTED_MODE = 'hero_ranking_diverted_mode';
export const STORAGE_KEY_CONSECUTIVE_LOSSES = 'hero_diverted_consecutive_losses';
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
 * /main 또는 /play 중 한 곳으로 50:50 무작위 이동하여 새 카드플레이 시작
 */
export function startRankingDivert(
  onNavigate: (view: string) => void,
  language: Language = 'ko',
  showCustomAlert?: (title: string, message: string) => void
): DivertedMode {
  // 50:50 무작위 선택: 'main' 또는 'play'
  const chosenMode: DivertedMode = Math.random() < 0.5 ? 'main' : 'play';

  try {
    localStorage.setItem(STORAGE_KEY_DIVERTED_MODE, chosenMode);
    localStorage.setItem(STORAGE_KEY_CONSECUTIVE_LOSSES, '0');
    // 전환 중에는 랭킹 루프 플래그 일시 해제
    localStorage.removeItem('hero_auto_loop_is_ranking');
    localStorage.removeItem('hero_auto_loop_mode');

    window.dispatchEvent(new CustomEvent('snshero_ranking_diverted', {
      detail: { mode: chosenMode, timestamp: Date.now() }
    }));
  } catch (e) {
    console.error('Failed to set ranking diverted mode in localStorage:', e);
  }

  const title = language === 'ko'
    ? '🎴 [신규 덱 장착] 새로운 모드 카드플레이 시작!'
    : '🎴 [New Deck Equipped] Starting New Card Play!';

  const message = language === 'ko'
    ? `새로운 카드가 마이덱에 적용되었습니다!\n[${chosenMode === 'main' ? '/main (카단 RPG 메인)' : '/play (미션 & 아케이드)'}] 모드로 이동하여 실전 카드 대결을 시작합니다.\n(⚠️ 3회 연속 패배 시 자동으로 랭킹플레이로 복귀합니다.)`
    : `A new card was applied to your deck!\nMoving to [${chosenMode === 'main' ? '/main (Kadan RPG)' : '/play (Mission & Arcade)'}] mode to battle with your new deck.\n(⚠️ Will return to Rank Match on 3 consecutive losses.)`;

  if (showCustomAlert) {
    showCustomAlert(title, message);
  }

  // 모드별 화면으로 이동
  onNavigate(chosenMode);
  return chosenMode;
}

/**
 * 전환 모드에서 매치 결과 발생 시 호출
 * - 승리 시: 연속 패배 카운트 리셋 (0) & 계속 진행
 * - 패배 시: 연속 패배 카운트 +1
 *   - 3회 연속 패배 시: 랭킹 플레이 복귀
 *   - 3회 미만: 해당 모드로 계속 진행
 */
export function handleDivertedMatchResult(
  result: 'win' | 'loss' | 'draw',
  onNavigate: (view: string) => void,
  language: Language = 'ko',
  showCustomAlert?: (title: string, message: string) => void
): { shouldReturnToRanking: boolean; consecutiveLosses: number } {
  if (!isRankingDiverted()) {
    return { shouldReturnToRanking: false, consecutiveLosses: 0 };
  }

  const currentMode = getDivertedMode() || 'main';
  const currentLosses = getDivertedLossCount();

  if (result === 'win') {
    // 승리 시 연속 패배 리셋
    try {
      localStorage.setItem(STORAGE_KEY_CONSECUTIVE_LOSSES, '0');
    } catch {}

    const title = language === 'ko' ? '🎉 [승리] 새로운 덱 실전 검증 성공!' : '🎉 [Victory] New Deck Verified!';
    const message = language === 'ko'
      ? `신규 카드가 적용된 덱으로 승리를 거두었습니다!\n[${currentMode === 'main' ? '/main' : '/play'}] 모드로 계속 카드플레이를 진행합니다.`
      : `Victory with the new deck!\nContinuing card play in [${currentMode === 'main' ? '/main' : '/play'}] mode.`;

    if (showCustomAlert) {
      showCustomAlert(title, message);
    }

    return { shouldReturnToRanking: false, consecutiveLosses: 0 };
  }

  if (result === 'loss') {
    const nextLosses = currentLosses + 1;
    try {
      localStorage.setItem(STORAGE_KEY_CONSECUTIVE_LOSSES, String(nextLosses));
    } catch {}

    // 3회 연속 패배 도달 시 랭킹 플레이로 복귀!
    if (nextLosses >= MAX_CONSECUTIVE_LOSSES) {
      endRankingDivert(true);

      const title = language === 'ko' ? '⚠️ [3회 연속 패배] 랭킹플레이 자동 복귀' : '⚠️ [3 Consecutive Losses] Returning to Rank';
      const message = language === 'ko'
        ? `전환 모드에서 3회 연속으로 패배하였습니다.\n전열을 재정비하기 위해 다시 [랭킹 플레이]로 자동 복귀합니다!`
        : `Suffered 3 consecutive losses in diverted mode.\nReturning to [Rank Match] to regroup and compete!`;

      if (showCustomAlert) {
        showCustomAlert(title, message);
      }

      // 랭킹 뷰로 복귀
      setTimeout(() => {
        onNavigate('ranking');
      }, 1500);

      return { shouldReturnToRanking: true, consecutiveLosses: MAX_CONSECUTIVE_LOSSES };
    } else {
      // 3회 미만 패배: 계속 진행
      const title = language === 'ko' ? `⚔️ [패배 ${nextLosses}/${MAX_CONSECUTIVE_LOSSES}] 모드 유지` : `⚔️ [Loss ${nextLosses}/${MAX_CONSECUTIVE_LOSSES}] Staying in Mode`;
      const message = language === 'ko'
        ? `패배하였습니다 (연속 ${nextLosses}회 / 3회 도달 시 랭킹 복귀).\n[${currentMode === 'main' ? '/main' : '/play'}] 모드에서 도전을 계속 진행합니다!`
        : `Defeated (${nextLosses}/3 consecutive losses).\nContinuing in [${currentMode === 'main' ? '/main' : '/play'}] mode!`;

      if (showCustomAlert) {
        showCustomAlert(title, message);
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
