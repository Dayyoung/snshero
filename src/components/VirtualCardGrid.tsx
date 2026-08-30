import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { DatabaseCard } from '../types';
import { ImageLazyLoader } from '../lib/ImageLazyLoader';
import { cn } from '../lib/utils';

export interface VirtualCardGridProps {
  cards: DatabaseCard[];
  renderCard: (card: DatabaseCard, index: number) => React.ReactNode;
  columns?: number;
  itemHeight?: number;
  gap?: number;
  className?: string;
  emptyMessage?: string;
}

export const VirtualCardGrid: React.FC<VirtualCardGridProps> = ({
  cards,
  renderCard,
  columns = 3,
  itemHeight = 220,
  gap = 12,
  className,
  emptyMessage = 'No cards available',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Prewarm core sprite assets
  useEffect(() => {
    ImageLazyLoader.prewarmSpriteAssets(['/cards1.png', '/cards2.png']);
  }, []);

  // Update container height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    setContainerHeight(el.clientHeight || 600);

    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalItems = cards.length;
  const totalRows = Math.ceil(totalItems / columns);
  const totalContentHeight = totalRows * itemHeight + (totalRows > 0 ? (totalRows - 1) * gap : 0);

  const { visibleStartIndex, visibleEndIndex, offsetY } = useMemo(() => {
    const rowHeightWithGap = itemHeight + gap;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeightWithGap) - 1); // 1 overscan row above
    const visibleRowCount = Math.ceil(containerHeight / rowHeightWithGap) + 2; // 2 overscan rows below
    const endRow = Math.min(totalRows, startRow + visibleRowCount);

    const startIdx = startRow * columns;
    const endIdx = Math.min(totalItems, endRow * columns);
    const offset = startRow * rowHeightWithGap;

    return {
      visibleStartIndex: startIdx,
      visibleEndIndex: endIdx,
      offsetY: offset,
    };
  }, [scrollTop, containerHeight, totalRows, totalItems, columns, itemHeight, gap]);

  if (cards.length === 0) {
    return (
      <div className="w-full py-16 flex items-center justify-center text-center font-mono text-black/40 text-xs border border-dashed border-black/15">
        [{emptyMessage}]
      </div>
    );
  }

  const visibleCards = cards.slice(visibleStartIndex, visibleEndIndex);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "w-full overflow-y-auto relative scroll-smooth will-change-scroll",
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        style={{
          height: `${totalContentHeight}px`,
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: `${gap}px`,
          }}
        >
          {visibleCards.map((card, idx) => {
            const actualIndex = visibleStartIndex + idx;
            return (
              <div key={card.id || actualIndex} style={{ height: `${itemHeight}px` }}>
                {renderCard(card, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
