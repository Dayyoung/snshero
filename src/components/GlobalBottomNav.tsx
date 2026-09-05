/**
 * GlobalBottomNav.tsx
 * 전체 플랫폼 통합 '모바일 퍼스트 48px 슬림 플로팅 하단 내비게이션 독' (design.md 준수)
 * [로비 | 마이덱 | 미션(/play) | 마켓 | 소셜] 5대 핵심 탭 100% 엄지 원핸드 탐색 지원
 * (구글 스프레드시트 Row 904 / ID 552 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, Gamepad2, ShoppingBag, MessageSquare } from 'lucide-react';
import { Language, ViewType } from '../types';

interface GlobalBottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language?: Language;
}

export const GlobalBottomNav: React.FC<GlobalBottomNavProps> = ({
  currentView,
  onNavigate,
  language = 'ko',
}) => {
  const isKo = language === 'ko';

  const NAV_ITEMS: {
    key: ViewType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home },
    { key: 'mydeck', label: isKo ? '마이덱' : 'Deck', icon: Layers },
    { key: 'play', label: isKo ? '미션' : 'Play', icon: Gamepad2, badge: 'HOT' },
    { key: 'card-marketplace', label: isKo ? '마켓' : 'Market', icon: ShoppingBag },
    { key: 'community', label: isKo ? '소셜' : 'Social', icon: MessageSquare },
  ];

  return (
    <nav
      aria-label="Global Navigation"
      className="fixed bottom-0 inset-x-0 z-50 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.1)] font-mono select-none transition-all duration-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-12 max-w-md mx-auto px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 h-full cursor-pointer transition-all active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-[#201d1d] dark:text-[#fdfcfc] font-black'
                  : 'text-[#6e6e73] dark:text-[#a0a0a5] hover:text-[#201d1d] dark:hover:text-white'
              }`}
            >
              {item.badge && (
                <span className="absolute top-1 right-1/4 px-1 py-0.2 bg-[#ef4444] text-white text-[8px] font-bold rounded-sm scale-90 tracking-tighter">
                  {item.badge}
                </span>
              )}
              <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.7]'} />
              <span className={`text-[10px] leading-tight mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-0.5 bg-[#201d1d] dark:bg-[#fdfcfc] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
