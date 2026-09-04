/**
 * AdaptiveMobileViewport.tsx
 * 모바일 가로·세로 화면 회전 대응 및 Safe-Area 자동 보정 반응형 뷰포트 레이아웃
 * (구글 스프레드시트 Row 862 / ID 554 요구사항 구현)
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface AdaptiveMobileViewportProps {
  children: ReactNode;
  thumbZoneOverlay?: ReactNode;
  onResize?: (width: number, height: number, isLandscape: boolean) => void;
  className?: string;
}

export const AdaptiveMobileViewport: React.FC<AdaptiveMobileViewportProps> = ({
  children,
  thumbZoneOverlay,
  onResize,
  className = '',
}) => {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h;
      setIsLandscape(landscape);
      onResize?.(w, h, landscape);
    };

    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);

    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, [onResize]);

  return (
    <div
      className={cn(
        "relative w-full h-[100dvh] flex overflow-hidden bg-[#201d1d] select-none font-mono safe-area-inset",
        isLandscape ? "flex-row" : "flex-col",
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* 1. Main Viewport Area (Clear 70%~75%) */}
      <div className={cn("relative flex-1 overflow-hidden pointer-events-auto", isLandscape ? "h-full w-[75%]" : "w-full h-[75%]")}>
        {children}
      </div>

      {/* 2. Thumb-Zone Control Overlay (25%) */}
      {thumbZoneOverlay && (
        <div
          className={cn(
            "relative z-30 pointer-events-auto touch-none bg-[#181616]/95 border-[rgba(255,255,255,0.08)] flex items-center justify-center p-2",
            isLandscape ? "w-[25%] h-full border-l" : "w-full h-[25%] border-t"
          )}
        >
          {thumbZoneOverlay}
        </div>
      )}
    </div>
  );
};
