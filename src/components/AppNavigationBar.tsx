/**
 * AppNavigationBar.tsx
 * 전 플랫폼 모바일 썸존 하단 내비게이션 바 per design.md
 * (구글 스프레드시트 Row 1020 / ID 560 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, ShoppingBag, Gamepad2, User } from 'lucide-react';

export type NavigationTab = 'lobby' | 'deck' | 'market' | 'play' | 'profile';

interface AppNavigationBarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language?: string;
  className?: string;
}

export const AppNavigationBar: React.FC<AppNavigationBarProps> = ({
  currentTab,
  onTabChange,
  language = 'ko',
  className = '',
}) => {
  const isKo = language === 'ko';

  const TABS: { id: NavigationTab; labelKo: string; labelEn: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'lobby', labelKo: '로비', labelEn: 'LOBBY', icon: Home },
    { id: 'deck', labelKo: '마이덱', labelEn: 'DECK', icon: Layers },
    { id: 'market', labelKo: '마켓', labelEn: 'MARKET', icon: ShoppingBag },
    { id: 'play', labelKo: '미션', labelEn: 'PLAY', icon: Gamepad2 },
    { id: 'profile', labelKo: '프로필', labelEn: 'PROFILE', icon: User },
  ];

  const handleSelect = (tab: NavigationTab) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {
        // Haptic feedback ignore
      }
    }
    onTabChange(tab);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] font-mono select-none pointer-events-auto transition-transform duration-200 pb-[env(safe-area-inset-bottom,0px)] ${className}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto h-14 flex items-center justify-around px-1">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          const label = isKo ? tab.labelKo : tab.labelEn;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-all rounded-sm cursor-pointer ${
                isActive
                  ? 'text-[#201d1d] dark:text-white font-black bg-[rgba(15,0,0,0.05)] dark:bg-[rgba(255,255,255,0.08)] border-b-2 border-[#201d1d] dark:border-white'
                  : 'text-[#201d1d]/60 dark:text-white/60 hover:text-[#201d1d] dark:hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[10px] tracking-tight leading-none">
                {isActive ? `[${label}]` : label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
