import React, { useEffect, useState } from 'react';
import { Home, Library, ShoppingBag, Gamepad2, Play } from 'lucide-react';
import { ViewType, Language } from '../types';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import { motion } from 'framer-motion';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { getClaimableCount, getTodayStr, hasUnfinishedMissions } from '../lib/dailyMissions';

interface NavbarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  setIsAutoBattle?: (val: boolean) => void;
  playSfx: (url: string) => void;
  language: Language;
  onRandomPlay?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, setIsAutoBattle, playSfx, language }) => {
  const { theme } = useGameSettings();
  const [hasMissionNotice, setHasMissionNotice] = useState<boolean>(false);
  const [hasShopReward, setHasShopReward] = useState<boolean>(false);

  useEffect(() => {
    const checkRedDots = () => {
      try {
        // Daily Quest: 수령 가능한 미션 보상이 있는 경우에만 빨간점 표시 (보상 수령 완료 시 빨간점 미표시)
        const hasPending = getClaimableCount() > 0;
        setHasMissionNotice(hasPending);

        // Daily Shop free claim status
        const todayStr = getTodayStr();
        const shopClaimed = localStorage.getItem(`hero_shop_free_sns_claimed_${todayStr}`);
        setHasShopReward(shopClaimed !== 'true');
      } catch (e) {
        // Safe fallback
      }
    };

    checkRedDots();
    const interval = setInterval(checkRedDots, 3000);
    window.addEventListener('hero_daily_missions_updated', checkRedDots);
    window.addEventListener('hero_daily_mission_completed', checkRedDots);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hero_daily_missions_updated', checkRedDots);
      window.removeEventListener('hero_daily_mission_completed', checkRedDots);
    };
  }, []);

  const items = [
    { id: 'home', label: t('home', language), icon: Home, hasRedDot: false },
    { id: 'mydeck', label: t('mydeck', language), icon: Library, hasRedDot: false },
    { id: 'main', label: t('kadan_rpg_nav', language), icon: Play, hasRedDot: false },
    { id: 'play', label: t('training_ground', language), icon: Gamepad2, hasRedDot: hasMissionNotice },
    { id: 'shop', label: t('shop', language), icon: ShoppingBag, hasRedDot: hasShopReward },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#fdfcfc] border-t border-[rgba(15,0,0,0.12)] shadow-xl z-[9999] pointer-events-auto pb-[env(safe-area-inset-bottom)] font-mono">
      <div className="max-w-[1024px] mx-auto w-full h-16 sm:h-[72px] flex items-stretch">
        {items.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'main') {
                if (typeof window !== 'undefined') {
                  const season = localStorage.getItem('hero_current_season') || 'season1';
                  localStorage.setItem(`hero_kadan_rpg_auto_mode_${season}`, 'true');
                }
              } else if (setIsAutoBattle) {
                setIsAutoBattle(false);
              }
              setView(item.id as ViewType);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            className={cn(
              "flex-1 h-full flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-1 px-0.5 transition-all relative group cursor-pointer select-none",
              isActive 
                ? "text-[#fdfcfc]" 
                : "text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7]"
            )}
            aria-label={item.label}
          >
            {isActive && (
              <motion.div
                layoutId="navbar-active"
                className="absolute inset-x-1 inset-y-1 bg-[#201d1d] rounded-sm"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            
            <div className="relative">
              <item.icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2}
                className="relative z-10 transition-transform duration-200"
              />
              {item.hasRedDot && (
                <span className="absolute -top-1 -right-1.5 z-20 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border border-white"></span>
                </span>
              )}
            </div>
            <span className="max-w-full truncate px-0.5 text-[10px] sm:text-[11px] font-black tracking-wide uppercase relative z-10 font-mono leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
      </div>
    </nav>
  );
};
