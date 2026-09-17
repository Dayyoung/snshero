import React from 'react';
import { Sparkles, ShoppingBag, Package, Coins, Flame, Zap, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import type { Language } from '../types';

export type ShopCategoryTab = 'all' | 'packs' | 'items' | 'sns' | 'special';

interface ShopQuickTabBarProps {
  activeTab: ShopCategoryTab;
  onSelectTab: (tab: ShopCategoryTab) => void;
  language: Language;
  snsBalance: number;
  freePullAvailable: boolean;
  onQuickFreePull: () => void;
  onQuickCharge: () => void;
}

const TABS: Array<{ id: ShopCategoryTab; labelKo: string; labelEn: string; icon: React.ReactNode }> = [
  { id: 'all', labelKo: '전체', labelEn: 'All', icon: <ShoppingBag size={13} /> },
  { id: 'packs', labelKo: '카드팩', labelEn: 'Packs', icon: <Sparkles size={13} /> },
  { id: 'items', labelKo: '아이템', labelEn: 'Items', icon: <Package size={13} /> },
  { id: 'sns', labelKo: '재화충전', labelEn: 'SNS Coins', icon: <Coins size={13} /> },
  { id: 'special', labelKo: '스페셜', labelEn: 'Special', icon: <Flame size={13} /> },
];

export const ShopQuickTabBar: React.FC<ShopQuickTabBarProps> = ({
  activeTab,
  onSelectTab,
  language,
  snsBalance,
  freePullAvailable,
  onQuickFreePull,
  onQuickCharge,
}) => {
  const isKo = language === 'ko';

  return (
    <div className="w-full bg-[#121010] border-y border-white/10 p-2 font-mono space-y-2 select-none shadow-md">
      {/* 1-Tap Sliding Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onSelectTab(tab.id);
                triggerHaptic('light');
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95",
                isActive
                  ? "bg-amber-400 text-black shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/5"
              )}
            >
              {tab.icon}
              <span>{isKo ? tab.labelKo : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Smart Quick Action Bar (Free Pull / Quick Charge) */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-white/10 rounded-xl p-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <Coins size={13} className="text-amber-400" />
            <span>{snsBalance.toLocaleString()} SNS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {freePullAvailable ? (
            <button
              type="button"
              onClick={() => {
                onQuickFreePull();
                triggerHaptic('medium');
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[11px] rounded-lg flex items-center gap-1 shadow-sm animate-pulse cursor-pointer"
            >
              <Sparkles size={12} />
              <span>{isKo ? '오늘의 무료 뽑기' : 'Free Pull Ready'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onQuickCharge();
                triggerHaptic('light');
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-400/30 flex items-center gap-1 cursor-pointer"
            >
              <Zap size={11} className="text-amber-400" />
              <span>{isKo ? '즉시 충전' : 'Quick Charge'}</span>
              <ArrowRight size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
