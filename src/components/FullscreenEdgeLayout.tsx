/**
 * FullscreenEdgeLayout.tsx
 * 3D 뷰포트 내 불필요한 테두리 패딩 제거 및 '풀스크린 엣지투엣지(Edge-to-Edge) 레이아웃'
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 998 / ID 578 요구사항 구현)
 */

import React from 'react';

interface FullscreenEdgeLayoutProps {
  children: React.ReactNode;
  headerOverlay?: React.ReactNode;
  bottomDockOverlay?: React.ReactNode;
  className?: string;
}

export const FullscreenEdgeLayout: React.FC<FullscreenEdgeLayoutProps> = ({
  children,
  headerOverlay,
  bottomDockOverlay,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-[100dvh] overflow-hidden bg-black font-mono select-none ${className}`}>
      {/* 1. 엣지투엣지 3D 캔버스 / 메인 게임 뷰포트 (화면 전체 100% 사용) */}
      <div className="absolute inset-0 w-full h-full z-0 p-0 m-0">
        {children}
      </div>

      {/* 2. 상단 Safe-Area 대응 미니멀 글래스 플로팅 헤더 */}
      {headerOverlay && (
        <div
          className="absolute top-0 inset-x-0 z-30 pointer-events-none"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <div className="pointer-events-auto">
            {headerOverlay}
          </div>
        </div>
      )}

      {/* 3. 하단 Safe-Area 대응 썸존 플로팅 독 오버레이 */}
      {bottomDockOverlay && (
        <div
          className="absolute bottom-0 inset-x-0 z-30 pointer-events-none"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="pointer-events-auto">
            {bottomDockOverlay}
          </div>
        </div>
      )}
    </div>
  );
};
