import React from 'react';
import { SlidersHorizontal, ArrowDownAZ, ArrowUpAZ, Flame, Zap, Trophy, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import type { Language } from '../types';

export type MarketSortOption = 'price_asc' | 'price_desc' | 'power_desc' | 'latest';

interface MarketplaceSortBottomSheetProps {
  currentSort: MarketSortOption;
  onSelectSort: (sort: MarketSortOption) => void;
  language: Language;
  onClose: () => void;
}

const SORT_ITEMS: Array<{ id: MarketSortOption; labelKo: string; labelEn: string; icon: React.ReactNode }> = [
  { id: 'price_asc', labelKo: '최저가순 (저렴한 매물 우선)', labelEn: 'Lowest Price', icon: <ArrowDownAZ size={16} /> },
  { id: 'price_desc', labelKo: '최고가순 (하이엔드 고가 우선)', labelEn: 'Highest Price', icon: <ArrowUpAZ size={16} /> },
  { id: 'power_desc', labelKo: '전투력 높은순 (강력한 카드 우선)', labelEn: 'Highest Power', icon: <Trophy size={16} /> },
  { id: 'latest', labelKo: '최신 등록순 (방금 올라온 매물)', labelEn: 'Newly Listed', icon: <Zap size={16} /> },
];

export const MarketplaceSortBottomSheet: React.FC<MarketplaceSortBottomSheetProps> = ({
  currentSort,
  onSelectSort,
  language,
  onClose,
}) => {
  const isKo = language === 'ko';

  return (
    <div className="fixed inset-0 z-[10070] bg-black/70 backdrop-blur-xs flex items-end justify-center select-none animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#161414] border-t-2 border-amber-400 rounded-t-3xl p-5 text-white font-mono shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Handle */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-2" />
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300">
              <SlidersHorizontal size={14} />
              <span>{isKo ? '원핸드 빠른 정렬 필터' : 'QUICK SORT OPTIONS'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sort Options List */}
        <div className="space-y-2">
          {SORT_ITEMS.map((item) => {
            const isSelected = currentSort === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSort(item.id);
                  triggerHaptic('medium');
                  onClose();
                }}
                className={cn(
                  "w-full min-h-[48px] px-4 py-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer active:scale-98",
                  isSelected
                    ? "bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isSelected ? "text-amber-400" : "text-slate-500"}>
                    {item.icon}
                  </span>
                  <span>{isKo ? item.labelKo : item.labelEn}</span>
                </div>
                {isSelected && <Check size={16} className="text-amber-400" />}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-center text-slate-500 pt-1">
          {isKo ? '💡 한 손 엄지손가락으로 1-Tap 즉시 정렬됩니다.' : '💡 1-Tap thumb sort applied instantly.'}
        </p>
      </div>
    </div>
  );
};
