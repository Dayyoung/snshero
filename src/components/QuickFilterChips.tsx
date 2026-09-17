import React from 'react';
import { CardRarity, Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface QuickFilterChipsProps {
  selectedRarity: string | 'ALL';
  onSelectRarity: (rarity: string | 'ALL') => void;
  selectedElement: string | 'ALL';
  onSelectElement: (element: string | 'ALL') => void;
  language: Language;
}

export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  selectedRarity,
  onSelectRarity,
  selectedElement,
  onSelectElement,
  language,
}) => {
  const isKo = language === 'ko';

  const rarities: (string | 'ALL')[] = ['ALL', 'SSR', 'SR', 'R', 'N'];
  const elements = [
    { key: 'ALL', label: isKo ? '전체' : 'All' },
    { key: 'fire', label: isKo ? '🔥 불' : 'Fire' },
    { key: 'water', label: isKo ? '💧 물' : 'Water' },
    { key: 'earth', label: isKo ? '🌿 대지' : 'Earth' },
    { key: 'wind', label: isKo ? '⚡ 바람' : 'Wind' },
  ];

  return (
    <div className="w-full flex flex-col gap-1.5 font-mono select-none py-1.5">
      {/* 티어/등급 칩 바 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
        <span className="text-[10px] text-[#201d1d]/60 font-bold shrink-0">
          {isKo ? '[등급]' : '[TIER]'}
        </span>
        {rarities.map((r) => {
          const isSelected = selectedRarity === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelectRarity(r);
              }}
              className={`min-h-[32px] px-2.5 py-1 text-[11px] font-bold rounded-xs cursor-pointer transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#201d1d] text-[#fdfcfc] shadow-xs'
                  : 'bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/20 hover:border-[#201d1d]'
              }`}
            >
              {r === 'ALL' ? (isKo ? '전체' : 'ALL') : r}
            </button>
          );
        })}
      </div>

      {/* 속성 칩 바 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
        <span className="text-[10px] text-[#201d1d]/60 font-bold shrink-0">
          {isKo ? '[속성]' : '[ELEM]'}
        </span>
        {elements.map((el) => {
          const isSelected = selectedElement === el.key;
          return (
            <button
              key={el.key}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelectElement(el.key);
              }}
              className={`min-h-[32px] px-2.5 py-1 text-[11px] font-bold rounded-xs cursor-pointer transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#201d1d] text-[#fdfcfc] shadow-xs'
                  : 'bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/20 hover:border-[#201d1d]'
              }`}
            >
              {el.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
