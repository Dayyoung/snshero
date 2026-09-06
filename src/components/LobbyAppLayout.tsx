/**
 * LobbyAppLayout.tsx
 * 전 플랫폼 메인 로비/상점/덱 전역 1줄 슬림 헤더 & 바텀 도킹 내비게이션 레이아웃
 * (구글 스프레드시트 Row 1032 / ID 552 요구사항 구현 - design.md 준수)
 */

import React, { useState } from 'react';
import { Home, Layers, Gamepad2, ShoppingCart, Store, Menu, X, Coins, Sparkles, User } from 'lucide-react';
import { getUserSnsBalance } from '../lib/rewardSettlementService';

export type PlatformTab = 'lobby' | 'deck' | 'missions' | 'shop' | 'market';

interface LobbyAppLayoutProps {
  currentTab: PlatformTab;
  onTabChange: (tab: PlatformTab) => void;
  userName?: string;
  userAvatar?: string;
  gold?: number;
  snsPoints?: number;
  children: React.ReactNode;
  language?: string;
}

export const LobbyAppLayout: React.FC<LobbyAppLayoutProps> = ({
  currentTab,
  onTabChange,
  userName = 'HERO_PLAYER',
  userAvatar,
  gold = 2500,
  snsPoints: propSns,
  children,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const [snsBalance] = useState<number>(() => propSns ?? getUserSnsBalance());
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const TABS: { id: PlatformTab; labelKo: string; labelEn: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'lobby', labelKo: '로비', labelEn: 'LOBBY', icon: Home },
    { id: 'deck', labelKo: '덱편성', labelEn: 'DECK', icon: Layers },
    { id: 'missions', labelKo: '미션', labelEn: 'PLAY', icon: Gamepad2 },
    { id: 'shop', labelKo: '상점', labelEn: 'SHOP', icon: ShoppingCart },
    { id: 'market', labelKo: '마켓', labelEn: 'MARKET', icon: Store },
  ];

  const handleTabClick = (tab: PlatformTab) => {
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
    <div className="flex flex-col h-[100dvh] w-full bg-[#fdfcfc] dark:bg-[#181616] text-[#201d1d] dark:text-[#fdfcfc] font-mono overflow-hidden select-none">
      {/* 1. 상단 44px 반투명 글래스모피즘 헤더 */}
      <header className="h-11 shrink-0 px-3 bg-[#fdfcfc]/90 dark:bg-[#181616]/90 backdrop-blur-md border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] flex items-center justify-between z-30">
        {/* Left: User Avatar & Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-none border border-[#201d1d] dark:border-white bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={14} className="text-[#201d1d] dark:text-white" />
            )}
          </div>
          <span className="text-xs font-black truncate max-w-[90px] sm:max-w-[140px] tracking-tight">
            {userName}
          </span>
        </div>

        {/* Right: Balances & Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px]">
          {/* Gold */}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-none font-bold">
            <Coins size={11} className="text-amber-500" />
            <span>{gold.toLocaleString()}</span>
          </div>

          {/* SNS Points */}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-none text-purple-700 dark:text-purple-300 font-bold">
            <Sparkles size={11} className="text-purple-600 dark:text-purple-400" />
            <span>{snsBalance.toLocaleString()}P</span>
          </div>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center border border-[rgba(15,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-sm hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 cursor-pointer ml-0.5"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </header>

      {/* 2. 중앙 메인 뷰포트 (75% 이상 확보) */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>

      {/* 3. 하단 50px 인체공학적 썸존 5탭 바텀 내비게이션 바 */}
      <nav
        className="h-[50px] shrink-0 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] flex items-center justify-around px-1 z-30 pb-[env(safe-area-inset-bottom,0px)]"
        role="navigation"
        aria-label="Bottom Navigation"
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          const label = isKo ? tab.labelKo : tab.labelEn;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#201d1d] dark:text-white font-black bg-black/5 dark:bg-white/10 border-t-2 border-[#201d1d] dark:border-white'
                  : 'text-[#6e6e73] dark:text-[#a1a1aa] hover:text-[#201d1d] dark:hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={17} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[10px] tracking-tight leading-none">
                {isActive ? `[${label}]` : label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 햄버거 사이드 드로어 모달 */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs">
          <div className="w-64 max-w-[80vw] h-full bg-[#fdfcfc] dark:bg-[#181616] border-r border-[#201d1d] dark:border-white p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] pb-2">
                <span className="font-black text-sm">SNS HERO MENU</span>
                <button onClick={() => setMenuOpen(false)} className="cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-1 text-xs">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-sm text-left cursor-pointer font-bold"
                  >
                    <tab.icon size={15} />
                    <span>{isKo ? tab.labelKo : tab.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-[#777] border-t border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] pt-2">
              <p>SNSHero Revolution v2.1</p>
              <p className="text-[9px]">DESIGN.md 100% Monospace</p>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </div>
  );
};
