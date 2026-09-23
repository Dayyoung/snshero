/**
 * MarketplaceVirtualGrid.tsx - SCR-05-22
 * 60fps 무감속 가상 그리드 뷰포트
 */

import React, { useRef, useState, useEffect } from 'react';
import { VirtualTextureManager } from '../lib/VirtualTextureManager';

interface MarketplaceVirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function MarketplaceVirtualGrid<T extends { id: string }>({
  items,
  itemHeight = 90,
  renderItem,
}: MarketplaceVirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const vtManager = useRef(new VirtualTextureManager());

  const viewportHeight = 500;
  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + viewportHeight) / itemHeight) + 2);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  useEffect(() => {
    const visibleIds = new Set(visibleItems.map((i) => i.id));
    vtManager.current.evictInvisibleTiles(visibleIds);
  }, [visibleItems]);

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="relative w-full h-[500px] overflow-y-auto font-mono select-none"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={item.id} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
