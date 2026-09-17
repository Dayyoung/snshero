import React, { useState, useEffect } from 'react';
import { X, Sparkles, Trophy, Gift, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface WeeklyMilestoneChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onClaimRewards: (snsAmount: number, shards: number) => void;
  playSfx?: (url: string) => void;
}

export const WeeklyMilestoneChestModal: React.FC<WeeklyMilestoneChestModalProps> = ({
  isOpen,
  onClose,
  language,
  onClaimRewards,
  playSfx,
}) => {
  const [chestState, setChestState] = useState<'idle' | 'opening' | 'opened'>('idle');
  const [coinsDisplay, setCoinsDisplay] = useState<number>(0);
  const [shardsDisplay, setShardsDisplay] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setChestState('idle');
      setCoinsDisplay(0);
      setShardsDisplay(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isKo = language === 'ko';

  const handleOpenChest = () => {
    if (chestState !== 'idle') return;
    setChestState('opening');

    // 햅틱 피드백 (심장박동)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 50, 120, 50, 200]);
    }

    // 팡파르 효과음
    if (playSfx) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    }

    setTimeout(() => {
      setChestState('opened');
      // 코인 & 조각 롤링 애니메이션
      let currentCoin = 0;
      let currentShard = 0;
      const targetCoin = 500;
      const targetShard = 10;

      const timer = setInterval(() => {
        currentCoin = Math.min(targetCoin, currentCoin + 25);
        currentShard = Math.min(targetShard, currentShard + 1);
        setCoinsDisplay(currentCoin);
        setShardsDisplay(currentShard);

        if (currentCoin >= targetCoin && currentShard >= targetShard) {
          clearInterval(timer);
          onClaimRewards(targetCoin, targetShard);
        }
      }, 35);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/30 rounded-none shadow-2xl p-6 text-center overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Trophy size={14} className="text-amber-500" />
            <span>{isKo ? '[주간 미션 올클리어]' : '[WEEKLY MILESTONE]'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 상자 인터랙션 영역 */}
        <div className="py-6 flex flex-col items-center justify-center min-h-[160px]">
          {chestState === 'idle' && (
            <button
              type="button"
              onClick={handleOpenChest}
              className="group cursor-pointer flex flex-col items-center gap-3 transition-transform active:scale-95"
            >
              <div className="w-24 h-24 bg-amber-100 border-2 border-amber-600 rounded-sm flex items-center justify-center text-4xl shadow-md animate-bounce">
                👑
              </div>
              <span className="text-xs font-bold bg-[#201d1d] text-[#fdfcfc] px-3 py-1 rounded-sm tracking-tight">
                {isKo ? '[ 터치하여 상자 개봉 ]' : '[ TAP TO OPEN CHEST ]'}
              </span>
            </button>
          )}

          {chestState === 'opening' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-amber-200 border-2 border-amber-600 rounded-sm flex items-center justify-center text-4xl shadow-xl animate-spin">
                ✨
              </div>
              <span className="text-xs font-bold text-amber-700 animate-pulse">
                {isKo ? '[!] 황금빛 미믹 개봉 중...' : '[!] Unlocking Gold Chest...'}
              </span>
            </div>
          )}

          {chestState === 'opened' && (
            <div className="flex flex-col items-center gap-3 w-full animate-fadeIn">
              <div className="text-4xl animate-pulse">🎉</div>
              <h3 className="text-sm font-black text-emerald-800">
                {isKo ? '주간 최종 보상 획득 완료!' : 'Weekly Reward Claimed!'}
              </h3>
              
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                <div className="bg-[#201d1d]/5 p-2.5 border border-[#201d1d]/10 rounded-sm">
                  <div className="text-[10px] text-[#201d1d]/60 font-semibold">{isKo ? 'SNS 코인' : 'SNS Coins'}</div>
                  <div className="text-base font-black text-amber-700">+{coinsDisplay}</div>
                </div>
                <div className="bg-[#201d1d]/5 p-2.5 border border-[#201d1d]/10 rounded-sm">
                  <div className="text-[10px] text-[#201d1d]/60 font-semibold">{isKo ? 'SSR 카드 조각' : 'SSR Shards'}</div>
                  <div className="text-base font-black text-purple-700">+{shardsDisplay}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 확인 / 닫기 버튼 */}
        <div className="mt-4 pt-3 border-t border-[#201d1d]/15">
          {chestState === 'opened' ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-colors"
            >
              {isKo ? '[ 확인 및 닫기 ]' : '[ Confirm & Close ]'}
            </button>
          ) : (
            <p className="text-[11px] text-[#201d1d]/50 font-mono">
              {isKo ? '주간 100% 달성자 전용 한정 특별 보급상자입니다.' : 'Exclusive reward box for 100% weekly achievement.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
