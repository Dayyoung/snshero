/**
 * AppMobileNavigation.tsx
 * 전 플랫폼 모바일 뷰포트 최적화 & 하단 네비게이션 독(Bottom Dock) 인체공학 통합
 * (design.md Monospace 플랫 가이드 준수 & 100dvh 대응)
 * (구글 스프레드시트 Row 1004 / ID 552 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, Gamepad2, ShoppingBag, User } from 'lucide-react';
import { ViewType, Language } from '../types';

interface AppMobileNavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language?: Language;
}

export const AppMobileNavigation: React.FC<AppMobileNavigationProps> = ({
  currentView,
  onNavigate,
  language = 'ko',
}) => {
  const isKo = language === 'ko';

  const ROUTES: {
    key: ViewType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home },
    { key: 'mydeck', label: isKo ? '마이덱' : 'Deck', icon: Layers },
    { key: 'play', label: isKo ? '미션' : 'Missions', icon: Gamepad2, badge: 'HOT' },
    { key: 'card-marketplace', label: isKo ? '마켓' : 'Market', icon: ShoppingBag },
    { key: 'profile', label: isKo ? '프로필' : 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Ergonomic Mobile Bottom Dock Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.1)] font-mono select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const isActive = currentView === route.key;

          return (
            <button
              key={route.key}
              onClick={() => onNavigate(route.key)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 h-full cursor-pointer transition-all active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-[#201d1d] dark:text-[#fdfcfc] font-black'
                  : 'text-[#6e6e73] dark:text-[#a0a0a5] hover:text-[#201d1d] dark:hover:text-white'
              }`}
            >
              {route.badge && (
                <span className="absolute top-1 right-2 px-1 py-0.2 bg-[#ef4444] text-white text-[8px] font-bold rounded-sm scale-90 tracking-tighter">
                  {route.badge}
                </span>
              )}
              <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              <span className={`text-[10px] leading-tight mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
                {route.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1 bg-[#201d1d] dark:bg-[#fdfcfc] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
