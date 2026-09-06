/**
 * CardVirtualList.tsx
 * 카드 컬렉션/도감용 DOM 가상화 스크롤 리스트
 * (구글 스프레드시트 Row 1023 / ID 563 요구사항 구현)
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CardData, Language } from '../types';
import { AssetLoader } from '../lib/assetLoader';

interface CardVirtualListProps {
  cards: CardData[];
  onCardClick?: (card: CardData) => void;
  selectedCardId?: string;
  itemHeight?: number; // 기본 아이템 높이 px (예: 96)
  containerHeight?: number; // 컨테이너 높이 px (예: 500)
  language?: Language;
  className?: string;
}

export const CardVirtualList: React.FC<CardVirtualListProps> = ({
  cards,
  onCardClick,
  selectedCardId,
  itemHeight = 88,
  containerHeight = 480,
  language = 'ko',
  className = '',
}) => {
  const isKo = language === 'ko';
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const assetLoader = AssetLoader.getInstance();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalCount = cards.length;
  const totalHeight = totalCount * itemHeight;

  // 버퍼 포함 가시 인덱스 계산
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const buffer = 3;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2;
    const end = Math.min(totalCount, start + visibleCount);
    const offset = start * itemHeight;
    return { startIndex: start, endIndex: end, offsetY: offset };
  }, [scrollTop, itemHeight, containerHeight, totalCount]);

  const visibleCards = useMemo(() => {
    return cards.slice(startIndex, endIndex).map((card, idx) => ({
      card,
      index: startIndex + idx,
    }));
  }, [cards, startIndex, endIndex]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto border border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] font-mono select-none relative ${className}`}
      style={{ height: containerHeight }}
    >
      {/* 가상 전체 높이 스페이서 */}
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        {/* 실제 렌더링 영역 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
          className="flex flex-col gap-1 p-1"
        >
          {visibleCards.map(({ card, index }) => {
            const isSelected = selectedCardId === card.id;
            const optimizedImage = card.image ? assetLoader.resolveOptimalImageUrl(card.image) : '';

            return (
              <div
                key={card.id || index}
                onClick={() => onCardClick?.(card)}
                style={{ height: itemHeight - 4 }}
                className={`flex items-center gap-3 px-3 py-2 border rounded-sm transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-[#201d1d] dark:text-white'
                    : 'bg-white dark:bg-[#201d1d] border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[#201d1d] dark:hover:border-white'
                }`}
              >
                {/* 썸네일 */}
                <div className="w-12 h-14 bg-black/10 dark:bg-white/10 rounded-xs overflow-hidden flex items-center justify-center shrink-0 border border-[rgba(15,0,0,0.1)]">
                  {optimizedImage ? (
                    <img
                      src={optimizedImage}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[10px] text-[#888]">#{card.id}</span>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate text-[#201d1d] dark:text-white">
                      {card.name}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[#666] dark:text-[#aaa] font-bold rounded-xs shrink-0">
                      ★{card.rarity || 'N'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#777] dark:text-[#aaa] mt-0.5">
                    <span>
                      {isKo ? '속성' : 'Elem'}: {card.element || 'Normal'}
                    </span>
                    <span>•</span>
                    <span>ATK {card.attack}</span>
                    <span>•</span>
                    <span>DEF {card.defense}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
