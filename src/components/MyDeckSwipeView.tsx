/**
 * MyDeckSwipeView.tsx
 * 마이덱 1~5번 슬롯 좌우 터치 스와이프 실시간 전환 래퍼 컴포넌트
 * (구글 스프레드시트 Row 839 / ID 560 요구사항 구현)
 */

import React, { useRef, useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MyDeckSwipeViewProps {
  currentDeckIndex: number; // 0 ~ 4 (Deck 1 ~ 5)
  onDeckChange: (index: number) => void;
  children: ReactNode;
}

export const MyDeckSwipeView: React.FC<MyDeckSwipeViewProps> = ({
  currentDeckIndex,
  onDeckChange,
  children,
}) => {
  const touchStartX = useRef<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX.current;

    // 40px 이상 스와이프 시 덱 전환
    if (Math.abs(diffX) > 40) {
      if (diffX < 0 && currentDeckIndex < 4) {
        // Swipe Left ➔ Next Deck
        onDeckChange(currentDeckIndex + 1);
      } else if (diffX > 0 && currentDeckIndex > 0) {
        // Swipe Right ➔ Prev Deck
        onDeckChange(currentDeckIndex - 1);
      }
    }

    touchStartX.current = null;
    setIsSwiping(false);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full flex flex-col font-mono select-none"
    >
      {/* Deck Indicator Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#f4f2ee] border-b border-[rgba(15,0,0,0.08)]">
        <button
          onClick={() => currentDeckIndex > 0 && onDeckChange(currentDeckIndex - 1)}
          disabled={currentDeckIndex === 0}
          className="p-1 text-[#6e6e73] hover:text-[#201d1d] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              onClick={() => onDeckChange(idx)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border cursor-pointer transition-all ${
                currentDeckIndex === idx
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#fdfcfc] text-[#6e6e73] border-[rgba(15,0,0,0.1)] hover:border-[rgba(15,0,0,0.25)]'
              }`}
            >
              DECK {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => currentDeckIndex < 4 && onDeckChange(currentDeckIndex + 1)}
          disabled={currentDeckIndex === 4}
          className="p-1 text-[#6e6e73] hover:text-[#201d1d] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Main Deck Content Area */}
      <div className={`w-full transition-opacity duration-150 ${isSwiping ? 'opacity-90' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
};
