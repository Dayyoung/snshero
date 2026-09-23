/**
 * HorizontalProductCarousel.tsx - SCR-04-14
 * 100dvh 상단 수평 스와이프 스냅 카테고리 캐러셀
 */

import React from 'react';
import { triggerHaptic } from '../lib/haptic';

export interface ShopCategory {
  id: string;
  nameKo: string;
  nameEn: string;
  icon: string;
}

interface HorizontalProductCarouselProps {
  categories: ShopCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  language?: string;
}

export const HorizontalProductCarousel: React.FC<HorizontalProductCarouselProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  language = 'ko',
}) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1.5 px-1 select-none">
      <div className="flex items-center gap-2 snap-x snap-mandatory min-w-max">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelectCategory(cat.id);
              }}
              className={`snap-start px-3.5 py-2 rounded-sm font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{language === 'ko' ? cat.nameKo : cat.nameEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
