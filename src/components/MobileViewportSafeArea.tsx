/**
 * MobileViewportSafeArea.tsx
 * 모바일 세로/가로 뷰포트 완벽 대응 및 하단 25% 썸존 터치 영역 분리 격리 (design.md 준수)
 * (구글 스프레드시트 Row 809 / ID 562 요구사항 구현)
 */

import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface MobileViewportSafeAreaProps {
  children: ReactNode;
  thumbZoneContent?: ReactNode;
  className?: string;
  viewportClassName?: string;
}

export const MobileViewportSafeArea: React.FC<MobileViewportSafeAreaProps> = ({
  children,
  thumbZoneContent,
  className = '',
  viewportClassName = '',
}) => {
  return (
    <div
      className={cn(
        "relative w-full h-[100dvh] flex flex-col overflow-hidden bg-[#201d1d] select-none font-mono safe-area-inset",
        className
      )}
    >
      {/* Upper 75% Clear 3D/2D Game Viewport (design.md 70%+ clear visibility) */}
      <div
        className={cn(
          "relative w-full h-[75%] flex-1 overflow-hidden pointer-events-auto",
          viewportClassName
        )}
      >
        {children}
      </div>

      {/* Bottom 25% Isolated Thumb-Zone for Pure Touch Gestures */}
      {thumbZoneContent && (
        <div className="relative w-full h-[25%] max-h-48 bg-[#181616] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-center p-2 pointer-events-auto touch-none z-30">
          {thumbZoneContent}
        </div>
      )}
    </div>
  );
};
