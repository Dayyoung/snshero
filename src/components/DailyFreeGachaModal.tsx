import React, { useState } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface DailyFreeGachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onClaimFreeGacha: () => void;
  playSfx?: (url: string) => void;
}

export const DailyFreeGachaModal: React.FC<DailyFreeGachaModalProps> = ({
  isOpen,
  onClose,
  language,
  onClaimFreeGacha,
  playSfx,
}) => {
  const [isOpening, setIsOpening] = useState(false);

  if (!isOpen) return null;

  const isKo = language === 'ko';

  const handleClaim = () => {
    if (isOpening) return;
    setIsOpening(true);
    triggerHaptic('victory');
    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    setTimeout(() => {
      onClaimFreeGacha();
      setIsOpening(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/30 rounded-none shadow-2xl p-5 text-center overflow-hidden">
        <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Gift size={14} className="text-amber-500" />
            <span>{isKo ? '[오늘의 무료 1회 소환]' : '[DAILY FREE SUMMON]'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/10 rounded-xs cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="w-16 h-16 bg-amber-100 border border-amber-400 rounded-sm mx-auto flex items-center justify-center text-3xl animate-bounce">
            🎁
          </div>
          <h3 className="text-sm font-black text-[#201d1d]">
            {isKo ? '매일 1회 무료 행운 소환권이 도착했습니다!' : 'Daily Free Summon is Ready!'}
          </h3>
          <p className="text-[11px] text-[#201d1d]/60 leading-relaxed">
            {isKo
              ? '수수료 없이 즉시 무료로 카드를 뽑고 오늘 하루의 행운을 점쳐보세요.'
              : 'Pull your free daily hero card now with 0 cost!'}
          </p>
        </div>

        <div className="pt-2 border-t border-[#201d1d]/10 space-y-2">
          <button
            type="button"
            onClick={handleClaim}
            disabled={isOpening}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xs cursor-pointer shadow-xs active:scale-[0.99] transition-all"
          >
            {isOpening
              ? (isKo ? '소환 진행 중...' : 'Summoning...')
              : (isKo ? '[ 무료 1회 소환권 개봉하기 ]' : '[ OPEN FREE SUMMON ]')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-[#201d1d]/50 hover:text-[#201d1d] cursor-pointer"
          >
            {isKo ? '다음에 하기' : 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
};
