/**
 * MobileCardBoardLayout.tsx
 * 2D 카드 대전 모바일 세로 모드 최적화 '하단 카드패 썸존 도킹 & 상단 보드 풀스크린 정렬'
 * (구글 스프레드시트 Row 817 / ID 554 요구사항 구현)
 */

import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface MobileCardBoardLayoutProps {
  topHeader?: ReactNode;
  boardArea: ReactNode;
  playerHandThumbZone: ReactNode;
  opponentHandArea?: ReactNode;
  className?: string;
}

export const MobileCardBoardLayout: React.FC<MobileCardBoardLayoutProps> = ({
  topHeader,
  boardArea,
  playerHandThumbZone,
  opponentHandArea,
  className = '',
}) => {
  return (
    <div
      className={cn(
        "relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#fdfcfc] text-[#201d1d] font-mono select-none safe-area-inset",
        className
      )}
    >
      {/* 1. Top 5% Ultra-Slim Glass Header */}
      {topHeader && (
        <div className="w-full shrink-0 z-20">
          {topHeader}
        </div>
      )}

      {/* 2. Optional Opponent Hand Bar (Slim 5%) */}
      {opponentHandArea && (
        <div className="w-full py-1 px-3 flex items-center justify-center shrink-0 bg-[#f4f2ee] border-b border-[rgba(15,0,0,0.08)]">
          {opponentHandArea}
        </div>
      )}

      {/* 3. Middle 60% Fullscreen Centered 3x3 Battle Grid Area */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2 relative overflow-hidden pointer-events-auto">
        {boardArea}
      </div>

      {/* 4. Bottom 25% Player Hand Thumb-Zone Docking Area */}
      <div className="w-full shrink-0 min-h-[120px] max-h-[160px] bg-[#f8f7f5] border-t border-[rgba(15,0,0,0.12)] p-2 flex items-center justify-center z-30 touch-none">
        {playerHandThumbZone}
      </div>
    </div>
  );
};
