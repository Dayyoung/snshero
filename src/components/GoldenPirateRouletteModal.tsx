import React, { useState } from 'react';
import { Sparkles, Trophy, Skull, Swords, X } from 'lucide-react';
import { Language } from '../types';

interface GoldenPirateRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  playSfx: (url: string) => void;
  onReward: (amount: number, reason: string) => void;
}

export const GoldenPirateRouletteModal: React.FC<GoldenPirateRouletteModalProps> = ({
  isOpen,
  onClose,
  language,
  playSfx,
  onReward,
}) => {
  const [slots, setSlots] = useState<('empty' | 'stabbed' | 'bomb')[]>(() => {
    // 16 slots, 1 hidden bomb
    const bombIndex = Math.floor(Math.random() * 16);
    return Array(16).fill('empty').map((_, i) => (i === bombIndex ? 'bomb' : 'empty'));
  });
  const [stabbedCount, setStabbedCount] = useState<number>(0);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [totalPot, setTotalPot] = useState<number>(50);

  if (!isOpen) return null;

  const handleStab = (index: number) => {
    if (slots[index] === 'stabbed' || isExploded || isFinished) return;

    if (slots[index] === 'bomb') {
      setIsExploded(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3'); // Explosion
      setTimeout(() => {
        setIsFinished(true);
      }, 1200);
    } else {
      const nextSlots = [...slots];
      nextSlots[index] = 'stabbed';
      setSlots(nextSlots);
      const nextCount = stabbedCount + 1;
      setStabbedCount(nextCount);
      const potGain = 35 + nextCount * 15;
      const nextPot = totalPot + potGain;
      setTotalPot(nextPot);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Sword stab

      // Perfect clear check (15 non-bomb slots stabbed)
      if (nextCount >= 15) {
        setIsFinished(true);
        onReward(nextPot + 200, '황금 해적 룰렛 퍼펙트 잭팟');
      }
    }
  };

  const handleCashout = () => {
    if (isExploded || isFinished || stabbedCount === 0) return;
    setIsFinished(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    onReward(totalPot, '황금 해적 룰렛 안전 탈출');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] shadow-none rounded-none p-4 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-black/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-amber-600" />
            <span className="font-black text-sm tracking-wider">
              {language === 'ko' ? '[황금 해적 통나무 룰렛]' : '[GOLDEN PIRATE ROULETTE]'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-black/5 text-[#201d1d] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barrel & Jackpot Status */}
        <div className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-sm mb-3 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] text-amber-800 font-bold uppercase">
              {language === 'ko' ? '현재 누적 상금' : 'CURRENT JACKPOT'}
            </div>
            <div className="text-base font-black text-amber-900">+{totalPot} SNS</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-amber-800 font-bold uppercase">
              {language === 'ko' ? '성공한 칼 자루' : 'SWORDS STABBED'}
            </div>
            <div className="text-sm font-black text-slate-800">{stabbedCount} / 15</div>
          </div>
        </div>

        {/* Pirate Barrel Visual Animation */}
        <div className="relative w-44 h-44 bg-amber-900 border-4 border-amber-950 rounded-full flex items-center justify-center my-2 shadow-inner overflow-hidden">
          {/* Metal Rings */}
          <div className="absolute inset-2 border-2 border-yellow-600/60 rounded-full pointer-events-none" />
          <div className="absolute inset-8 border-2 border-yellow-600/40 rounded-full pointer-events-none" />

          {/* Center Pirate Icon */}
          <div className={`text-4xl transition-transform duration-300 ${isExploded ? 'scale-150 animate-bounce' : ''}`}>
            {isExploded ? '💥' : isFinished ? '👑' : '🏴‍☠️'}
          </div>

          {isExploded && (
            <div className="absolute inset-0 bg-red-600/80 flex flex-col items-center justify-center text-white text-xs font-black animate-pulse">
              <Skull size={32} />
              <span>{language === 'ko' ? '통나무 폭발!' : 'BARREL POPPED!'}</span>
            </div>
          )}
        </div>

        {/* 16 Roulette Slots Grid */}
        <div className="grid grid-cols-4 gap-2 w-full my-2">
          {slots.map((st, i) => {
            const isStabbed = st === 'stabbed';
            const isBomb = st === 'bomb' && isExploded;

            return (
              <button
                key={i}
                disabled={isStabbed || isExploded || isFinished}
                onClick={() => handleStab(i)}
                className={`min-h-[44px] border font-mono font-black text-xs transition-all flex items-center justify-center cursor-pointer rounded-sm ${
                  isStabbed
                    ? 'bg-amber-200 border-amber-500 text-amber-900 cursor-not-allowed'
                    : isBomb
                    ? 'bg-red-500 border-red-700 text-white'
                    : 'bg-white hover:bg-amber-100 border-black/20 text-[#201d1d]'
                }`}
              >
                {isStabbed ? '🗡️' : isBomb ? '💣' : `[${i + 1}]`}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="w-full flex gap-2 mt-3">
          {!isFinished && !isExploded ? (
            <button
              onClick={handleCashout}
              disabled={stabbedCount === 0}
              className={`flex-1 min-h-[44px] px-3 font-black text-xs border rounded-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                stabbedCount > 0
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-black'
                  : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
              }`}
            >
              <Trophy size={14} className="text-yellow-400" />
              <span>{language === 'ko' ? `상금 +${totalPot} SNS 안전 수령` : `Cashout +${totalPot} SNS`}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 min-h-[44px] px-3 bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d] font-black text-xs rounded-sm hover:bg-black flex items-center justify-center cursor-pointer"
            >
              <span>{language === 'ko' ? '닫기' : 'Close'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
