/**
 * MainBottomDock.tsx
 * 모바일 썸존(Thumb-Zone) 특화 하단 5단 독(Bottom Dock) 내비게이션 바 및 상단 1줄 슬림 재화 스트립
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 964 / ID 552 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Gamepad2, ShoppingBag, User, Coins } from 'lucide-react';
import { ViewType, Language } from '../types';

interface MainBottomDockProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language?: Language;
}

export const MainBottomDock: React.FC<MainBottomDockProps> = ({
  currentView,
  onNavigate,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const [snsPoint, setSnsPoint] = useState<number>(1000);

  useEffect(() => {
    const readPoints = () => {
      try {
        const p = parseInt(localStorage.getItem('hero_sns_point') || '1000', 10);
        setSnsPoint(isNaN(p) ? 1000 : p);
      } catch {
        setSnsPoint(1000);
      }
    };

    readPoints();
    const handlePointChanged = () => readPoints();
    window.addEventListener('hero_sns_point_changed', handlePointChanged);
    window.addEventListener('storage', handlePointChanged);

    return () => {
      window.removeEventListener('hero_sns_point_changed', handlePointChanged);
      window.removeEventListener('storage', handlePointChanged);
    };
  }, []);

  const DOCK_TABS: {
    key: ViewType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home },
    { key: 'wiki-card', label: isKo ? '도감' : 'Cards', icon: BookOpen },
    { key: 'play', label: isKo ? '미션' : 'Missions', icon: Gamepad2, badge: 'HOT' },
    { key: 'card-marketplace', label: isKo ? '마켓' : 'Market', icon: ShoppingBag },
    { key: 'profile', label: isKo ? '프로필' : 'Profile', icon: User },
  ];

  return (
    <>
      {/* 상단 1줄 슬림 글래스모피즘 재화 스트립 */}
      <header className="fixed top-0 inset-x-0 z-40 h-10 bg-[#fdfcfc]/90 dark:bg-[#181616]/90 backdrop-blur-md border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.1)] font-mono text-xs select-none">
        <div className="flex items-center justify-between h-full max-w-lg mx-auto px-3">
          <div className="flex items-center gap-1.5 font-black text-[#201d1d] dark:text-[#fdfcfc]">
            <span className="text-[11px] tracking-wider">[SNSHERO]</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-sm">
              <Coins size={12} className="text-amber-500 fill-amber-500" />
              <span className="font-bold text-[#201d1d] dark:text-[#fdfcfc] text-[11px]">
                {snsPoint.toLocaleString()} SNS
              </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="ONLINE" />
          </div>
        </div>
      </header>

      {/* 하단 15% 썸존 독 내비게이션 바 */}
      <nav
        aria-label="Main Mobile Thumb-Zone Dock"
        className="fixed bottom-0 inset-x-0 z-40 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.1)] font-mono select-none"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
          {DOCK_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => onNavigate(tab.key)}
                className={`relative flex-1 flex flex-col items-center justify-center py-1.5 h-full cursor-pointer transition-all active:scale-95 touch-manipulation ${
                  isActive
                    ? 'text-[#201d1d] dark:text-[#fdfcfc] font-black'
                    : 'text-[#6e6e73] dark:text-[#a0a0a5] hover:text-[#201d1d] dark:hover:text-white'
                }`}
              >
                {tab.badge && (
                  <span className="absolute top-1 right-2 px-1 py-0.2 bg-[#ef4444] text-white text-[8px] font-bold rounded-sm scale-90 tracking-tighter">
                    {tab.badge}
                  </span>
                )}
                <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                <span className={`text-[10px] leading-tight mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1 bg-[#201d1d] dark:bg-[#fdfcfc] rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
