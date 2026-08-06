import React from 'react';
import { Home, Library, ShoppingBag, Gamepad2, Play } from 'lucide-react';
import { ViewType, Language } from '../types';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import { motion } from 'framer-motion';
import { useGameSettings } from '../contexts/GameSettingsContext';

interface NavbarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  setIsAutoBattle?: (val: boolean) => void;
  playSfx: (url: string) => void;
  language: Language;
  onRandomPlay?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, setIsAutoBattle, playSfx, language, onRandomPlay }) => {
  const { theme } = useGameSettings();
  const items = [
    { id: 'home', label: t('home', language), icon: Home },
    { id: 'mydeck', label: t('mydeck', language), icon: Library },
    { id: 'main', label: t('kadan_rpg_nav', language), icon: Play },
    { id: 'play', label: t('training_ground', language), icon: Gamepad2 },
    { id: 'shop', label: t('shop', language), icon: ShoppingBag },
  ];

  const isDark = theme === 'dark' || theme === 'metal';

  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] h-16 sm:h-[68px] flex rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] z-[9999] pointer-events-auto max-w-[1024px] overflow-hidden font-mono">
      {items.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (setIsAutoBattle) {
                setIsAutoBattle(false);
              }
              setView(item.id as ViewType);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all relative group touch-target cursor-pointer",
              isActive 
                ? "text-[#fdfcfc]" 
                : "text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7]"
            )}
            aria-label={item.label}
          >
            {isActive && (
              <motion.div
                layoutId="navbar-active"
                className="absolute inset-x-1.5 inset-y-1.5 bg-[#201d1d] rounded-sm"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <item.icon 
              size={18} 
              strokeWidth={isActive ? 2.5 : 2}
              className="relative z-10 transition-transform duration-200"
            />
            <span className="max-w-full truncate px-0.5 text-[9px] sm:text-[10px] font-black tracking-wider uppercase relative z-10 font-mono">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
