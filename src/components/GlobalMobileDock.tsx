/**
 * GlobalMobileDock.tsx
 * 로비 및 서브화면(덱/상점/미션/설정) 상단 70% 시야 개방 & 하단 썸존 내비게이션 독 통일
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 912 / ID 560 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, Gamepad2, ShoppingBag, Settings } from 'lucide-react';
import { ViewType, Language } from '../types';

interface GlobalMobileDockProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language?: Language;
}

export const GlobalMobileDock: React.FC<GlobalMobileDockProps> = ({
  currentView,
  onNavigate,
  language = 'ko',
}) => {
  const isKo = language === 'ko';

  const DOCK_ITEMS: {
    key: ViewType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home },
    { key: 'mydeck', label: isKo ? '마이덱' : 'Deck', icon: Layers },
    { key: 'play', label: isKo ? '미션' : 'Play', icon: Gamepad2, badge: 'HOT' },
    { key: 'card-marketplace', label: isKo ? '상점' : 'Shop', icon: ShoppingBag },
    { key: 'setting', label: isKo ? '설정' : 'Config', icon: Settings },
  ];

  return (
    <aside
      aria-label="Unified Mobile Thumb-Zone Navigation Dock"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.1)] font-mono select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 h-full cursor-pointer transition-all active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-[#201d1d] dark:text-[#fdfcfc] font-black'
                  : 'text-[#6e6e73] dark:text-[#a0a0a5] hover:text-[#201d1d] dark:hover:text-white'
              }`}
            >
              {item.badge && (
                <span className="absolute top-1 right-2 px-1 py-0.2 bg-[#ef4444] text-white text-[8px] font-bold rounded-sm scale-90 tracking-tighter">
                  {item.badge}
                </span>
              )}
              <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
              <span
                className={`text-[10px] leading-tight mt-0.5 tracking-tight ${
                  isActive ? 'font-bold underline underline-offset-2' : 'font-normal'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1 bg-[#201d1d] dark:bg-[#fdfcfc] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
