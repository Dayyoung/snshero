import React, { useEffect, useState } from 'react';
import { CardData, Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface MatchMVPShowcaseModalProps {
  isOpen: boolean;
  mvpCard: CardData | null;
  capturedCount: number;
  language: Language;
  onClose: () => void;
}

/**
 * ID 421, 457: 대전 승리 직후 MATCH MVP 카드 클로즈업 쇼케이스 및 친밀도/숙련도 +50 보너스 연출
 */
export const MatchMVPShowcaseModal: React.FC<MatchMVPShowcaseModalProps> = ({
  isOpen,
  mvpCard,
  capturedCount,
  language,
  onClose,
}) => {
  const [affinityAdded, setAffinityAdded] = useState(false);

  useEffect(() => {
    if (isOpen && mvpCard) {
      triggerHaptic('victory');
      // 친밀도 +50 로컬스토리지 반영
      try {
        const key = `hero_card_affinity_${mvpCard.imageIndex || mvpCard.id}`;
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, (current + 50).toString());
        setAffinityAdded(true);
      } catch {
        // ignore
      }
    }
  }, [isOpen, mvpCard]);

  if (!isOpen || !mvpCard) return null;

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-mono select-none animate-in fade-in duration-200">
      <div className="relative max-w-sm w-full bg-[#fdfcfc] dark:bg-[#1a1717] border border-amber-500/80 p-6 shadow-2xl text-center rounded-none overflow-hidden">
        {/* Shimmer / Ray Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none" />

        {/* Top MVP Header Badge */}
        <div className="inline-block px-3 py-1 bg-amber-500 text-black font-black text-xs uppercase tracking-widest mb-3 rounded-none shadow-sm">
          ★ MATCH MVP ★
        </div>

        <h3 className="text-base font-black text-[#201d1d] dark:text-white mb-1">
          {language === 'ko' ? '최고 활약 영웅 선정' : 'Decisive Battle Hero'}
        </h3>
        <p className="text-[11px] text-[#201d1d]/60 dark:text-white/60 mb-5">
          {language === 'ko'
            ? `총 ${capturedCount}장의 적 카드를 전향시켜 승리를 견인했습니다!`
            : `Flipped ${capturedCount} enemy cards to secure the victory!`}
        </p>

        {/* Golden Bordered Card Portrait Showcase */}
        <div className="relative mx-auto w-40 h-56 border-2 border-amber-400 bg-black/5 dark:bg-white/5 p-2 flex flex-col items-center justify-between shadow-[0_0_16px_rgba(245,158,11,0.4)] mb-5">
          <div className="w-full flex justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400">
            <span>#{mvpCard.imageIndex || 1}</span>
            <span>[{mvpCard.rarity?.toUpperCase() || 'SSR'}]</span>
          </div>

          <div className="w-24 h-24 my-auto relative flex items-center justify-center">
            {mvpCard.imageUrl ? (
              <img
                src={mvpCard.imageUrl}
                alt={mvpCard.title}
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            ) : (
              <div className="text-3xl font-black text-amber-500">MVP</div>
            )}
          </div>

          <div className="w-full border-t border-amber-500/30 pt-1 text-center">
            <div className="text-xs font-black truncate text-[#201d1d] dark:text-white">
              {language === 'en' ? (mvpCard.title_en || mvpCard.title) : mvpCard.title}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
              PWR {(mvpCard.power || 1000).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Affinity Bonus Badge */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-2 text-xs font-bold text-amber-800 dark:text-amber-300 mb-5 flex items-center justify-center gap-2">
          <span>👑 숙련도 & 유대감 보너스:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-black">+50 EXP</span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#201d1d] text-white dark:bg-white dark:text-[#201d1d] font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 active:scale-98 transition-all"
        >
          [ 확인 및 결과 요약 보기 ]
        </button>
      </div>
    </div>
  );
};
