import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptic';


interface CoinTossModalProps {
  isOpen: boolean;
  onComplete: (isPlayerFirst: boolean) => void;
}

/**
 * ID 349: 배틀 선공/후공 결정 3D 코인 토스 모달
 */
export const CoinTossModal: React.FC<CoinTossModalProps> = ({ isOpen, onComplete }) => {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'FIRST' | 'SECOND' | null>(null);
  const [choice, setChoice] = useState<'HEAD' | 'TAIL' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFlipping(false);
      setResult(null);
      setChoice(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToss = (userChoice: 'HEAD' | 'TAIL') => {
    if (flipping || result) return;
    setChoice(userChoice);
    setFlipping(true);
    triggerHaptic('medium');

    // 1.2초 회전 후 결정
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? 'HEAD' : 'TAIL';
      const isFirst = outcome === userChoice;
      const res = isFirst ? 'FIRST' : 'SECOND';
      setResult(res);
      setFlipping(false);
      triggerHaptic(isFirst ? 'victory' : 'defeat');

      // 1.5초 후 배틀 진입
      setTimeout(() => {
        onComplete(isFirst);
      }, 1500);
    }, 1200);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#1a1717] border border-[#201d1d]/20 dark:border-white/20 p-6 max-w-sm w-full shadow-2xl rounded-none text-center">
        <div className="text-xs uppercase tracking-widest text-[#201d1d]/60 dark:text-white/60 mb-2">
          [DECIDE TURN ORDER]
        </div>
        <h3 className="text-base font-black text-[#201d1d] dark:text-white mb-6">
          선공 / 후공 결정 코인 토스
        </h3>

        {/* 3D Coin Graphic */}
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center perspective-[600px]">
          <div
            className={`w-24 h-24 rounded-full border-4 border-amber-500 bg-amber-400 dark:bg-amber-600 flex items-center justify-center shadow-lg transition-transform duration-1000 ${
              flipping ? 'animate-spin' : ''
            }`}
          >
            <span className="text-2xl font-black text-amber-950">
              {result ? (result === 'FIRST' ? '선공' : '후공') : choice ? choice : '⛁'}
            </span>
          </div>
        </div>

        {!flipping && !result && (
          <div>
            <p className="text-xs text-[#201d1d]/70 dark:text-white/70 mb-4">
              앞면(HEAD) 또는 뒷면(TAIL)을 선택하세요. 적중 시 <strong>선공</strong>권을 획득합니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleToss('HEAD')}
                className="py-3 px-4 bg-[#201d1d] text-white dark:bg-white dark:text-[#201d1d] font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 active:scale-95 transition-all"
              >
                [ 앞면 HEAD ]
              </button>
              <button
                onClick={() => handleToss('TAIL')}
                className="py-3 px-4 border border-[#201d1d] dark:border-white text-[#201d1d] dark:text-white font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-black/5 active:scale-95 transition-all"
              >
                [ 뒷면 TAIL ]
              </button>
            </div>
          </div>
        )}

        {flipping && (
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
            코인이 회전 중입니다...
          </div>
        )}

        {result && (
          <div className="animate-in zoom-in-95 duration-200">
            <div
              className={`text-lg font-black mb-1 ${
                result === 'FIRST' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {result === 'FIRST' ? '★ 선공 (FIRST TURN) 확정!' : '후공 (SECOND TURN) 확정'}
            </div>
            <p className="text-xs text-[#201d1d]/60 dark:text-white/60">
              {result === 'FIRST'
                ? '첫 턴에 먼저 카드를 배치할 수 있습니다.'
                : '상대방의 첫 착수를 확인하고 전략을 세우세요.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
