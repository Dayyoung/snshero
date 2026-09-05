/**
 * BottomDockNav.tsx
 * 전체 에코시스템 공통 '하단 고정형 엄지 도킹 네비게이션 바(Bottom Docked Nav)' (design.md 준수)
 * [로비 | 마이덱 | 미션(/play) | 마켓 | 프로필] 5개 탭 지원 & Safe-Area 완벽 대응
 * (구글 스프레드시트 Row 880 / ID 552 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, Gamepad2, ShoppingBag, User } from 'lucide-react';
import { Language, ViewType } from '../types';

interface BottomDockNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language: Language;
}

export const BottomDockNav: React.FC<BottomDockNavProps> = ({
  currentView,
  onNavigate,
  language,
}) => {
  const isKo = language === 'ko';

  const TABS: { key: ViewType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home },
    { key: 'mydeck', label: isKo ? '마이덱' : 'MyDeck', icon: Layers },
    { key: 'play', label: isKo ? '미션' : 'Missions', icon: Gamepad2 },
    { key: 'card-marketplace', label: isKo ? '마켓' : 'Market', icon: ShoppingBag },
    { key: 'profile', label: isKo ? '프로필' : 'Profile', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-[#fdfcfc]/90 dark:bg-[#181616]/90 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.1)] font-mono select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#201d1d] dark:text-[#fdfcfc] font-bold'
                  : 'text-[#6e6e73] dark:text-[#aaa] hover:text-[#201d1d] dark:hover:text-white'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
              <span className={`text-[10px] ${isActive ? 'font-black' : 'font-normal'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#201d1d] dark:bg-[#fdfcfc] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
