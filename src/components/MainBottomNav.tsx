/**
 * MainBottomNav.tsx
 * 전 플랫폼 모바일 썸존(Thumb-Zone) 5-Tab 하단 내비게이션 독
 * (구글 스프레드시트 Row 839 / ID 560 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, Swords, ShoppingBag, Store } from 'lucide-react';
import { Language, ViewType } from '../types';

interface MainBottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language: Language;
}

export const MainBottomNav: React.FC<MainBottomNavProps> = ({
  currentView,
  onNavigate,
  language,
}) => {
  const isKo = language === 'ko';

  const TABS: { key: ViewType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'home', label: isKo ? '로비' : 'Lobby', icon: Home },
    { key: 'mydeck', label: isKo ? '마이덱' : 'Decks', icon: Layers },
    { key: 'ranking', label: isKo ? '대전' : 'Battle', icon: Swords },
    { key: 'shop', label: isKo ? '상점' : 'Shop', icon: ShoppingBag },
    { key: 'card-marketplace', label: isKo ? '거래소' : 'Market', icon: Store },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#fdfcfc]/95 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] safe-area-inset font-mono select-none">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors cursor-pointer active:scale-95 ${
                isActive ? 'text-[#201d1d] font-black' : 'text-[#6e6e73] hover:text-[#201d1d]'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#201d1d] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
