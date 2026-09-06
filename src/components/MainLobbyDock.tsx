/**
 * MainLobbyDock.tsx
 * 모바일 한손 엄지 그립 최적화 하단 통합 플로팅 도크 및 상단 70% 클린 뷰포트 개편
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 1012 / ID 552 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, Gamepad2, ShoppingBag, User } from 'lucide-react';
import { ViewType, Language } from '../types';

interface MainLobbyDockProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language?: Language;
}

export const MainLobbyDock: React.FC<MainLobbyDockProps> = ({
  currentView,
  onNavigate,
  language = 'ko',
}) => {
  const isKo = language === 'ko';

  const DOCK_TABS: {
    key: ViewType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home },
    { key: 'mydeck', label: isKo ? '마이덱' : 'Deck', icon: Layers },
    { key: 'play', label: isKo ? '미션' : 'Play', icon: Gamepad2, badge: 'HOT' },
    { key: 'card-marketplace', label: isKo ? '마켓' : 'Market', icon: ShoppingBag },
    { key: 'profile', label: isKo ? '프로필' : 'Profile', icon: User },
  ];

  return (
    <aside
      aria-label="Ergonomic Bottom Floating Dock"
      className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto font-mono select-none pointer-events-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <nav className="pointer-events-auto flex items-center justify-around h-14 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border border-[rgba(15,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-sm shadow-xl px-2">
        {DOCK_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 h-full cursor-pointer transition-all active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-[#201d1d] dark:text-[#fdfcfc] font-black'
                  : 'text-[#6e6e73] dark:text-[#a0a0a5] hover:text-[#201d1d] dark:hover:text-white'
              }`}
            >
              {tab.badge && (
                <span className="absolute -top-1 right-2 px-1 py-0.2 bg-[#ef4444] text-white text-[8px] font-bold rounded-sm scale-90 tracking-tighter">
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
      </nav>
    </aside>
  );
};
