/**
 * DeckSynergyFilter.tsx
 * 마이덱 편성 화면 상단 1줄 슬림 수평 속성 시너지 필터 도크 및 실시간 시너지 점수 계산 위젯
 * (구글 스프레드시트 Row 831 / ID 552 요구사항 구현)
 */

import React from 'react';
import { CardData, Language } from '../types';

export type SynergyElementType = 'all' | 'fire' | 'water' | 'earth' | 'wind';

interface DeckSynergyFilterProps {
  selectedElement: SynergyElementType;
  onSelectElement: (el: SynergyElementType) => void;
  currentDeck: CardData[];
  language: Language;
}

export const DeckSynergyFilter: React.FC<DeckSynergyFilterProps> = ({
  selectedElement,
  onSelectElement,
  currentDeck,
  language,
}) => {
  const isKo = language === 'ko';

  // Calculate current deck element counts & synergy score
  const counts: Record<'fire' | 'water' | 'earth' | 'wind', number> = {
    fire: 0,
    water: 0,
    earth: 0,
    wind: 0,
  };

  currentDeck.forEach((c) => {
    const el = (c.element?.toLowerCase() || 'fire') as keyof typeof counts;
    if (counts[el] !== undefined) counts[el]++;
  });

  const FILTERS: { key: SynergyElementType; label: string; icon: string; count: number }[] = [
    { key: 'all', label: isKo ? '전체' : 'ALL', icon: '✦', count: currentDeck.length },
    { key: 'fire', label: isKo ? '화염' : 'FIRE', icon: '🔥', count: counts.fire },
    { key: 'water', label: isKo ? '수속' : 'WATER', icon: '💧', count: counts.water },
    { key: 'earth', label: isKo ? '대지' : 'EARTH', icon: '🌿', count: counts.earth },
    { key: 'wind', label: isKo ? '질풍' : 'WIND', icon: '⚡', count: counts.wind },
  ];

  return (
    <div className="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] px-2 py-1.5 flex items-center justify-between font-mono select-none overflow-x-auto no-scrollbar">
      {/* 1-Line Slim Horizontal Element Filter Dock */}
      <div className="flex items-center gap-1 shrink-0">
        {FILTERS.map((f) => {
          const isSelected = selectedElement === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onSelectElement(f.key)}
              className={`px-2 py-1 text-[11px] font-bold rounded-sm border transition-colors flex items-center gap-1 cursor-pointer ${
                isSelected
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-transparent text-[#6e6e73] border-transparent hover:border-[rgba(15,0,0,0.15)] hover:text-[#201d1d]'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              {f.count > 0 && f.key !== 'all' && (
                <span className="ml-0.5 text-[9px] px-1 bg-black/10 rounded-full">
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Real-time Deck Synergy Score Indicator */}
      <div className="shrink-0 text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 border border-cyan-200 rounded-sm">
        {isKo ? '시너지' : 'SYN'}: {Math.max(...Object.values(counts)) >= 3 ? '+2 ATK ⚡' : 'NORMAL'}
      </div>
    </div>
  );
};
