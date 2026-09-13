/**
 * LobbyMobileDock.tsx
 * 모바일 한손 엄지 도달 범위 최적화 하단 플로팅 독(Floating Dock) 내비게이션
 * (구글 스프레드시트 Row 1044 / ID 552 & Row 1036 / ID 548 요구사항 구현)
 * design.md 준수: Monospace, 웜크림/잉크 팔레트, 1px 헤어라인, 4px 반경, 44px+ 터치 타깃
 */

import React from 'react';
import { Home, Layers, Gamepad2, ShoppingCart, Store } from 'lucide-react';

export type DockTabId = 'lobby' | 'deck' | 'missions' | 'shop' | 'market';

export interface DockTabItem {
  id: DockTabId;
  labelKo: string;
  labelEn: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge?: string | number;
}

export interface LobbyMobileDockProps {
  currentTab: DockTabId;
  onTabChange: (tab: DockTabId) => void;
  language?: string;
  className?: string;
}

export const DOCK_TABS: DockTabItem[] = [
  { id: 'lobby', labelKo: '로비', labelEn: 'LOBBY', icon: Home },
  { id: 'deck', labelKo: '덱편성', labelEn: 'DECK', icon: Layers },
  { id: 'missions', labelKo: '미션', labelEn: 'PLAY', icon: Gamepad2 },
  { id: 'shop', labelKo: '상점', labelEn: 'SHOP', icon: ShoppingCart },
  { id: 'market', labelKo: '마켓', labelEn: 'MARKET', icon: Store },
];

export const LobbyMobileDock: React.FC<LobbyMobileDockProps> = ({
  currentTab,
  onTabChange,
  language = 'ko',
  className = '',
}) => {
  const isKo = language === 'ko';

  const handleTabClick = (tabId: DockTabId) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {
        // Safe haptic feedback ignore
      }
    }
    onTabChange(tabId);
  };

  return (
    <nav
      aria-label="Bottom Navigation Dock"
      className={`fixed bottom-2 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] h-[54px] z-40 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border border-[rgba(15,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-sm shadow-sm flex items-center justify-around px-2 font-mono select-none ${className}`}
    >
      {DOCK_TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;
        const label = isKo ? tab.labelKo : tab.labelEn;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-sm transition-all active:scale-95 cursor-pointer relative ${
              isActive
                ? 'text-[#201d1d] dark:text-[#fdfcfc] font-black bg-black/[0.04] dark:bg-white/[0.06] border-b-2 border-[#201d1d] dark:border-[#fdfcfc]'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-[#201d1d] dark:hover:text-[#fdfcfc]'
            }`}
          >
            <Icon size={18} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[10px] tracking-tight">{label}</span>
            {tab.badge !== undefined && (
              <span className="absolute top-1 right-2 min-w-[14px] h-[14px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
