/**
 * MobileThumbNavDock.tsx
 * 모바일 최적화 하단 20% 썸존 통합 네비게이션 독 & 상단 75% 뷰포트 개방 리팩토링
 * (구글 스프레드시트 Row 715 / ID 556 요구사항 구현)
 */

import React from 'react';
import { Home, Layers, Swords, ShoppingBag, User } from 'lucide-react';
import { cn } from '../lib/utils';

export type NavTabType = 'lobby' | 'deck' | 'battle' | 'shop' | 'profile';

interface MobileThumbNavDockProps {
  activeTab: NavTabType;
  onTabSelect: (tab: NavTabType) => void;
  language?: string;
  className?: string;
}

export const MobileThumbNavDock: React.FC<MobileThumbNavDockProps> = ({
  activeTab,
  onTabSelect,
  language = 'ko',
  className = ''
}) => {
  const isKo = language === 'ko';

  const NAV_ITEMS: { id: NavTabType; label_ko: string; label_en: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'lobby', label_ko: '로비', label_en: 'Lobby', icon: Home },
    { id: 'deck', label_ko: '마이덱', label_en: 'Deck', icon: Layers },
    { id: 'battle', label_ko: '배틀/미션', label_en: 'Battle', icon: Swords },
    { id: 'shop', label_ko: '상점/마켓', label_en: 'Shop', icon: ShoppingBag },
    { id: 'profile', label_ko: '내정보', label_en: 'Profile', icon: User }
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#201d1d]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.12)] flex items-center justify-around px-2 font-mono select-none pointer-events-auto safe-area-bottom",
      className
    )}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabSelect(item.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-all rounded-xs cursor-pointer active:scale-95",
              isActive ? "text-amber-400 font-bold bg-white/5" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <IconComponent size={18} className={isActive ? "text-amber-400" : "text-slate-400"} />
            <span className="text-[10px] mt-0.5 tracking-tight">
              {isKo ? item.label_ko : item.label_en}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
