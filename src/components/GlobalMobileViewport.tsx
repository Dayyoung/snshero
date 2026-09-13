/**
 * GlobalMobileViewport.tsx
 * 전역 모바일 뷰포트 1줄 슬림 헤더 & 하단 썸존 5탭 내비게이션 레이아웃
 * (구글 스프레드시트 Row 1036 / ID 548 요구사항 구현)
 * design.md 준수: 상단 5% 1줄 슬림 글래스 바, 하단 25% 썸존 독, 중앙 70%+ 메인 뷰포트 보장
 */

import React from 'react';
import { LobbyMobileDock, DockTabId } from './LobbyMobileDock';
import { Coins, Sparkles, User, ChevronLeft } from 'lucide-react';

export interface GlobalMobileViewportProps {
  currentTab: DockTabId;
  onTabChange: (tab: DockTabId) => void;
  title?: string;
  userName?: string;
  userAvatar?: string;
  gold?: number;
  snsPoints?: number;
  onBack?: () => void;
  children: React.ReactNode;
  language?: string;
  showDock?: boolean;
}

export const GlobalMobileViewport: React.FC<GlobalMobileViewportProps> = ({
  currentTab,
  onTabChange,
  title,
  userName = 'HERO',
  userAvatar,
  gold = 0,
  snsPoints = 0,
  onBack,
  children,
  language = 'ko',
  showDock = true,
}) => {
  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-[#fdfcfc] dark:bg-[#181616] text-[#201d1d] dark:text-[#fdfcfc] font-mono overflow-hidden select-none">
      {/* 1. 최상단 1줄 슬림 헤더 (높이 44px, 약 5%) */}
      <header className="h-11 shrink-0 px-3 bg-[#fdfcfc]/90 dark:bg-[#181616]/90 backdrop-blur-md border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] flex items-center justify-between z-30">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center border border-[rgba(15,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-sm hover:bg-black/5 active:scale-95 cursor-pointer shrink-0"
              aria-label="Go Back"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {userAvatar && (
            <div className="w-7 h-7 border border-[#201d1d] dark:border-white overflow-hidden shrink-0">
              <img src={userAvatar} alt="user avatar" className="w-full h-full object-cover" />
            </div>
          )}
          <span className="text-xs font-black truncate max-w-[120px] tracking-tight">
            {title || userName}
          </span>
        </div>

        {/* 잔액 요약 (골드, SNS) */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-none">
            <Coins size={11} className="text-amber-500" />
            <span>{gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-none text-purple-700 dark:text-purple-300">
            <Sparkles size={11} className="text-purple-600 dark:text-purple-400" />
            <span>{snsPoints.toLocaleString()}P</span>
          </div>
        </div>
      </header>

      {/* 2. 중앙 메인 뷰포트 (70%+ 안전 영역) */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative pb-[68px]">
        {children}
      </main>

      {/* 3. 하단 썸존 5탭 플로팅 독 */}
      {showDock && (
        <LobbyMobileDock
          currentTab={currentTab}
          onTabChange={onTabChange}
          language={language}
        />
      )}
    </div>
  );
};
