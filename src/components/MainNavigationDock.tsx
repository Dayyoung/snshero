/**
 * MainNavigationDock.tsx
 * 전 플랫폼 메뉴 탭 모바일 한손 썸존 하단 내비게이션 독 및 design.md 준수 상단 헤더 슬림화
 * (구글 스프레드시트 Row 739 / ID 576 요구사항 구현)
 */

import React from 'react';
import { Home, Swords, Layers, ShoppingBag, Store } from 'lucide-react';
import type { ViewType, Language } from '../types';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

interface NavItem {
  id: ViewType;
  labelKo: string;
  labelEn: string;
  asciiTag: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeCount?: number;
}

interface MainNavigationDockProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  language?: Language;
  deckCount?: number;
  newCardsBadge?: boolean;
  marketAlertBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    labelKo: '로비',
    labelEn: 'LOBBY',
    asciiTag: '[LOBBY]',
    icon: Home,
  },
  {
    id: 'play',
    labelKo: '플레이',
    labelEn: 'PLAY',
    asciiTag: '[PLAY]',
    icon: Swords,
  },
  {
    id: 'mydeck',
    labelKo: '마이덱',
    labelEn: 'DECK',
    asciiTag: '[DECK]',
    icon: Layers,
  },
  {
    id: 'card-marketplace',
    labelKo: '거래소',
    labelEn: 'MARKET',
    asciiTag: '[MARKET]',
    icon: Store,
  },
  {
    id: 'shop',
    labelKo: '상점',
    labelEn: 'SHOP',
    asciiTag: '[SHOP]',
    icon: ShoppingBag,
  },
];

export const MainNavigationDock: React.FC<MainNavigationDockProps> = ({
  currentView,
  onNavigate,
  language = 'ko',
  deckCount,
  newCardsBadge = false,
  marketAlertBadge = false,
}) => {
  const isKo = language === 'ko';

  // 특정 전체화면 뷰에서는 내비게이션 바 숨김 (필요시)
  const isFullScreenGame = currentView === 'game' || currentView === 'main';
  if (isFullScreenGame) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#fdfcfc]/95 dark:bg-[#201d1d]/95 backdrop-blur-md border-t border-slate-900/10 dark:border-white/10 shadow-lg pb-[env(safe-area-inset-bottom,0px)] select-none font-mono"
      role="navigation"
      aria-label="Main Navigation Dock"
    >
      <div className="mx-auto max-w-lg flex items-center justify-around px-2 h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          const hasBadge =
            (item.id === 'mydeck' && newCardsBadge) ||
            (item.id === 'card-marketplace' && marketAlertBadge);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center h-full min-h-[44px] transition-all duration-150 active:scale-95 group focus:outline-none",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Hairline Indicator on Top */}
              {isActive && (
                <div className="absolute top-0 left-2 right-2 h-[2px] bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  className={cn(
                    "transition-transform duration-150",
                    isActive && "scale-110"
                  )}
                />

                {hasBadge && (
                  <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                )}
              </div>

              {/* Label in Monospace Neo-Brutalist Style */}
              <span className="text-[10px] tracking-tight mt-0.5 uppercase">
                {isKo ? item.labelKo : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
