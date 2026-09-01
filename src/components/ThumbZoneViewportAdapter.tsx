/**
 * ThumbZoneViewportAdapter.tsx
 * design.md 준수 하단 썸존 25% 격리 및 3D 뷰포트 반응형 캔버스 리사이징 래퍼
 * (구글 스프레드시트 Row 725 / ID 566 요구사항 구현)
 */

import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface ThumbZoneViewportAdapterProps {
  children: ReactNode;
  gestureThumbZone?: ReactNode;
  className?: string;
}

export const ThumbZoneViewportAdapter: React.FC<ThumbZoneViewportAdapterProps> = ({
  children,
  gestureThumbZone,
  className = ''
}) => {
  return (
    <div className={cn("relative w-full h-[100dvh] flex flex-col overflow-hidden bg-[#201d1d] select-none safe-area-inset", className)}>
      {/* Upper 75% Main 3D / 2D Viewport Area */}
      <div className="relative w-full h-[75%] flex-1 overflow-hidden pointer-events-auto">
        {children}
      </div>

      {/* Bottom 25% Isolated Thumb Zone for Touch Gestures */}
      {gestureThumbZone && (
        <div className="relative w-full h-[25%] max-h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center p-2 pointer-events-auto touch-none z-30 border-t border-white/5">
          {gestureThumbZone}
        </div>
      )}
    </div>
  );
};
