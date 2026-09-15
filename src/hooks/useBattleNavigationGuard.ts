/**
 * useBattleNavigationGuard.ts
 * 대전 진행 중 브라우저 뒤로가기 제스처(popstate) 몰수패 경고 모달 가드 훅
 * (백로그 ID 439: 대전 중 popstate 시 몰수패 경고 모달 가드)
 */

import { useEffect, useState, useCallback } from 'react';

interface BattleNavigationGuardOptions {
  isBattleActive: boolean;
  onForfeitConfirm: () => void;
}

export const useBattleNavigationGuard = ({
  isBattleActive,
  onForfeitConfirm,
}: BattleNavigationGuardOptions) => {
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  useEffect(() => {
    if (!isBattleActive) return;

    // 히스토리 상태 푸시로 브라우저 뒤로가기 트랩 설치
    window.history.pushState({ inBattle: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // 뒤로가기를 시도하면 다시 히스토리 복원하고 모달 오픈
      window.history.pushState({ inBattle: true }, '');
      setShowForfeitModal(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isBattleActive]);

  const handleCancel = useCallback(() => {
    setShowForfeitModal(false);
  }, []);

  const handleConfirmForfeit = useCallback(() => {
    setShowForfeitModal(false);
    onForfeitConfirm();
  }, [onForfeitConfirm]);

  return {
    showForfeitModal,
    handleCancel,
    handleConfirmForfeit,
  };
};
