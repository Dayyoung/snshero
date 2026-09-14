/**
 * TurnOrderDeciderModal.tsx
 * 전투 진입 시 1.5초 회전 코인 토스 및 선공/후공 보정 결정 오버레이
 * (구글 스프레드시트 Row 1058 / ID 321 요구사항 구현)
 */

import React, { useEffect, useState } from 'react';
import { Shield, Zap } from 'lucide-react';
import { playBattleSfx } from '../lib/AudioSpriteService';

interface TurnOrderDeciderModalProps {
  isOpen: boolean;
  isPlayerFirst: boolean;
  onComplete: () => void;
}

export const TurnOrderDeciderModal: React.FC<TurnOrderDeciderModalProps> = ({
  isOpen,
  isPlayerFirst,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'spinning' | 'revealed'>('spinning');

  useEffect(() => {
    if (!isOpen) {
      setPhase('spinning');
      return;
    }

    playBattleSfx('coin_toss');

    // 1.2초 후 결과 공개
    const revealTimer = setTimeout(() => {
      setPhase('revealed');
      playBattleSfx(isPlayerFirst ? 'turn_start' : 'card_flip');
    }, 1200);

    // 2.2초 후 종료 콜백
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [isOpen, isPlayerFirst, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-sm flex flex-col items-center justify-center text-center">
        {/* 3D 회전 코인 토스 컨테이너 */}
        <div className="w-24 h-24 mb-6 relative perspective-500">
          <div
            className={`w-full h-full rounded-full border-4 border-amber-400 flex items-center justify-center shadow-lg transition-transform duration-700 ${
              phase === 'spinning'
                ? 'animate-spin bg-gradient-to-tr from-amber-500 to-yellow-300'
                : isPlayerFirst
                ? 'bg-blue-600 border-blue-300 scale-110'
                : 'bg-rose-600 border-rose-300 scale-110'
            }`}
          >
            {phase === 'spinning' ? (
              <span className="text-2xl font-black text-amber-950">?</span>
            ) : isPlayerFirst ? (
              <span className="text-2xl font-black text-white">1st</span>
            ) : (
              <span className="text-2xl font-black text-white">2nd</span>
            )}
          </div>
        </div>

        {/* 텍스트 배너 */}
        {phase === 'spinning' ? (
          <div className="text-amber-300 text-sm font-bold tracking-widest uppercase animate-pulse">
            [ TOSSING COIN... ]
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
            <div
              className={`px-4 py-1.5 text-base font-black tracking-wide border-2 ${
                isPlayerFirst
                  ? 'bg-blue-500/20 text-blue-400 border-blue-400'
                  : 'bg-rose-500/20 text-rose-400 border-rose-400'
              }`}
            >
              {isPlayerFirst ? 'YOU GO FIRST (선공)' : 'OPPONENT GOES FIRST (후공)'}
            </div>

            {/* 후공 보정 안내 뱃지 */}
            {!isPlayerFirst ? (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[11px] rounded-sm">
                <Shield size={13} className="text-amber-400" />
                <span>후공 보너스: 첫 턴 상대 카드 카운터 정보 개방</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/60 text-blue-300 text-[11px] rounded-sm">
                <Zap size={13} className="text-blue-400" />
                <span>선공 혜택: 보드 중앙 주도권 선점 기회</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
