/**
 * CardGridVirtualizer.tsx
 * 카드 컬렉션 WebGL 텍스처 가상 스크롤 및 저사양 모바일 DOM 가상화 컴포넌트
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 1015 / ID 555 요구사항 구현)
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CardData } from '../types';
import { AssetVirtualLoader } from '../lib/assetVirtualLoader';

interface CardGridVirtualizerProps {
  cards: CardData[];
  itemHeight?: number;
  columns?: number;
  renderItem: (card: CardData, index: number) => React.ReactNode;
  className?: string;
}

export const CardGridVirtualizer: React.FC<CardGridVirtualizerProps> = ({
  cards,
  itemHeight = 160,
  columns = 2,
  renderItem,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      setContainerHeight(el.clientHeight || 600);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalRows = Math.ceil(cards.length / columns);
  const totalHeight = totalRows * itemHeight;

  // 화면에 보이는 행 계산 (위아래 1행씩 버퍼)
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / itemHeight) + 1);

  const visibleCards = useMemo(() => {
    const startIndex = startRow * columns;
    const endIndex = Math.min(cards.length, endRow * columns);
    return cards.slice(startIndex, endIndex).map((card, i) => ({
      card,
      index: startIndex + i,
      row: Math.floor((startIndex + i) / columns),
      col: (startIndex + i) % columns,
    }));
  }, [cards, startRow, endRow, columns]);

  // 가시 카드 텍스처 프리페치 트리거
  useEffect(() => {
    const loader = AssetVirtualLoader.getInstance();
    const visibleUrls = visibleCards
      .map((item) => item.card.imageUrl)
      .filter((url): url is string => Boolean(url));

    visibleUrls.forEach((url) => loader.loadVisibleTexture(url));
    loader.purgeOutOfViewTextures(visibleUrls);
  }, [visibleCards]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`relative overflow-y-auto overflow-x-hidden font-mono select-none ${className}`}
      style={{ willChange: 'transform' }}
    >
      <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
        {visibleCards.map(({ card, index, row, col }) => {
          const topPx = row * itemHeight;
          const leftPercent = (col / columns) * 100;
          const widthPercent = 100 / columns;

          return (
            <div
              key={card.id || index}
              style={{
                position: 'absolute',
                top: `${topPx}px`,
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                height: `${itemHeight}px`,
                padding: '4px',
                boxSizing: 'border-box',
              }}
            >
              {renderItem(card, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
