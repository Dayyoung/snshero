import React, { useState, useEffect } from 'react';
import { X, Trophy, Award, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface DeckPowerMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  deckPower: number;
  onBuyJumpingPack?: () => void;
  playSfx?: (url: string) => void;
}

export const DeckPowerMilestoneModal: React.FC<DeckPowerMilestoneModalProps> = ({
  isOpen,
  onClose,
  language,
  deckPower,
  onBuyJumpingPack,
  playSfx,
}) => {
  const [timeLeftSec, setTimeLeftSec] = useState<number>(7200); // 2시간 한정 타임딜

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeftSec(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isKo = language === 'ko';
  const hours = Math.floor(timeLeftSec / 3600);
  const minutes = Math.floor((timeLeftSec % 3600) / 60);
  const seconds = timeLeftSec % 60;

  // 상위 % 계산 (단순 모의 계산)
  const topPercent = deckPower >= 10000 ? 5 : deckPower >= 5000 ? 15 : 35;

  const handleBuy = () => {
    triggerHaptic('victory');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    onBuyJumpingPack?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/30 rounded-none shadow-2xl p-5 text-left overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Trophy size={14} className="text-amber-500" />
            <span>{isKo ? '[ 덱 파워 돌파 기념 훈장 ]' : '[ DECK POWER MILESTONE ]'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* 훈장 & 랭킹 상위 % 축하 */}
        <div className="text-center py-2 space-y-2">
          <div className="text-3xl">🎖️</div>
          <div className="text-sm font-black text-[#201d1d]">
            {isKo ? `덱 총전투력 ${deckPower} CP 돌파!` : `Deck Power ${deckPower} CP Achieved!`}
          </div>
          <div className="inline-block px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold rounded-xs">
            {isKo ? `전 서버 상위 ${topPercent}% 골드 훈장 수여` : `Top ${topPercent}% Server Gold Medal`}
          </div>
        </div>

        {/* 2시간 한정 점핑팩 타임딜 */}
        <div className="mt-3 p-3.5 bg-purple-50/70 border border-purple-300 rounded-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-black text-purple-950">
              <Sparkles size={13} className="text-purple-600" />
              <span>{isKo ? '덱 각성 스페셜 점핑팩' : 'Deck Awakening Jumping Pack'}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-rose-600 font-bold bg-white px-1.5 py-0.5 border border-rose-200">
              <Clock size={10} />
              <span>{hours}:{minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
            </div>
          </div>

          <div className="text-[11px] text-[#201d1d]/80 space-y-1">
            <div>• {isKo ? '5성 각성석 x5 즉시 지급' : '5-Star Awakening Stone x5'}</div>
            <div>• {isKo ? '전설 룬 보물상자 x3' : 'Legendary Rune Chest x3'}</div>
            <div>• {isKo ? '전용 골드 프로필 테두리 영구 해금' : 'Gold Profile Border Unlocked'}</div>
          </div>

          <button
            type="button"
            onClick={handleBuy}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            <span>{isKo ? '1,500원 즉시 구매 (150 SNS)' : 'Buy Now ($1.29 / 150 SNS)'}</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-[#201d1d]/50 hover:text-[#201d1d] underline cursor-pointer"
          >
            {isKo ? '다음에 하기' : 'Maybe Later'}
          </button>
        </div>
      </div>
    </div>
  );
};
