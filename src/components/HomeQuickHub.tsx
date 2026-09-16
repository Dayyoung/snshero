import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, Mail, Bell, Volume2, VolumeX, Layers, HelpCircle, 
  Gift, ChevronDown, Sparkles, Smartphone, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';
import { cn } from '../lib/utils';

interface HomeQuickHubProps {
  language: Language;
  unreadMailCount: number;
  unreadNotifCount: number;
  isAudioMuted: boolean;
  deckCount: number;
  maxDeckCount?: number;
  isLobbyDrawerOpen: boolean;
  onOpenMailbox: () => void;
  onOpenNotifModal: () => void;
  onToggleMute: () => void;
  onNavigate: (view: any) => void;
  onToggleDrawer: () => void;
  onOpenHelp: () => void;
}

export const HomeQuickHub: React.FC<HomeQuickHubProps> = ({
  language,
  unreadMailCount,
  unreadNotifCount,
  isAudioMuted,
  deckCount,
  maxDeckCount = 200,
  isLobbyDrawerOpen,
  onOpenMailbox,
  onOpenNotifModal,
  onToggleMute,
  onNavigate,
  onToggleDrawer,
  onOpenHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hubRef = useRef<HTMLDivElement>(null);
  const totalUnread = unreadMailCount + unreadNotifCount;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleHub = () => {
    triggerHaptic('light');
    setIsOpen(!isOpen);
  };

  return (
    <div ref={hubRef} className="relative inline-block text-left font-mono z-30">
      {/* 48px Minimal Touch Target Smart Quick Hub Button */}
      <button
        type="button"
        onClick={toggleHub}
        className={cn(
          "min-h-[44px] sm:min-h-[48px] px-3 py-2 border transition-all flex items-center gap-2 cursor-pointer select-none rounded-none",
          isOpen
            ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
            : "bg-white text-[#201d1d] border-[#201d1d]/20 hover:border-[#201d1d] hover:bg-slate-50"
        )}
        aria-expanded={isOpen}
        aria-label="Smart Quick Hub"
      >
        <Menu size={16} className={cn(isOpen ? "text-amber-300" : "text-[#201d1d]")} />
        <span className="text-xs font-bold uppercase tracking-wider">
          {language === 'ko' ? '[⚡ 스마트 퀵 허브]' : '[⚡ QUICK HUB]'}
        </span>
        {totalUnread > 0 && (
          <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold animate-pulse">
            {totalUnread}
          </span>
        )}
        <ChevronDown 
          size={14} 
          className={cn("transition-transform duration-200", isOpen ? "rotate-180 text-amber-300" : "text-[#201d1d]/60")} 
        />
      </button>

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-1.5 w-[310px] sm:w-[330px] bg-white border border-[#201d1d] shadow-lg p-2.5 space-y-1.5 rounded-none"
          >
            <div className="flex items-center justify-between border-b border-[#201d1d]/10 pb-1.5 mb-2">
              <span className="text-[11px] font-bold text-[#201d1d] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                {language === 'ko' ? '로비 스마트 퀵 메뉴' : 'LOBBY QUICK MENU'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* 1. 우편함 */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerHaptic('light');
                  onOpenMailbox();
                }}
                className="min-h-[42px] p-2 bg-[#fdfcfc] border border-[#201d1d]/15 hover:border-[#201d1d] hover:bg-slate-50 transition-all flex items-center justify-between text-xs font-bold text-[#201d1d] cursor-pointer rounded-none"
              >
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-600" />
                  <span>{language === 'ko' ? '우편함' : 'Mailbox'}</span>
                </div>
                {unreadMailCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-bold">
                    {unreadMailCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#201d1d]/40">0</span>
                )}
              </button>

              {/* 2. 알림 센터 */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerHaptic('light');
                  onOpenNotifModal();
                }}
                className="min-h-[42px] p-2 bg-[#fdfcfc] border border-[#201d1d]/15 hover:border-[#201d1d] hover:bg-slate-50 transition-all flex items-center justify-between text-xs font-bold text-[#201d1d] cursor-pointer rounded-none"
              >
                <div className="flex items-center gap-1.5">
                  <Bell size={14} className="text-amber-500" />
                  <span>{language === 'ko' ? '알림 센터' : 'Notice'}</span>
                </div>
                {unreadNotifCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold">
                    {unreadNotifCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#201d1d]/40">0</span>
                )}
              </button>

              {/* 3. SFX 사운드 토글 */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onToggleMute();
                }}
                className="min-h-[42px] p-2 bg-[#fdfcfc] border border-[#201d1d]/15 hover:border-[#201d1d] hover:bg-slate-50 transition-all flex items-center justify-between text-xs font-bold text-[#201d1d] cursor-pointer rounded-none"
              >
                <div className="flex items-center gap-1.5">
                  {isAudioMuted ? <VolumeX size={14} className="text-rose-600" /> : <Volume2 size={14} className="text-emerald-600" />}
                  <span>{language === 'ko' ? '사운드' : 'Sound'}</span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-1 py-0.2 border",
                  isAudioMuted ? "border-rose-300 text-rose-600" : "border-emerald-300 text-emerald-700"
                )}>
                  {isAudioMuted ? 'OFF' : 'ON'}
                </span>
              </button>

              {/* 4. 덱 인벤토리 용량 */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerHaptic('light');
                  onNavigate('mydeck');
                }}
                className="min-h-[42px] p-2 bg-[#fdfcfc] border border-indigo-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all flex items-center justify-between text-xs font-bold text-[#201d1d] cursor-pointer rounded-none"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🃏</span>
                  <span>{language === 'ko' ? '카드 보관' : 'Inventory'}</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-700">
                  {deckCount}/{maxDeckCount}
                </span>
              </button>

              {/* 5. 서브 서랍 토글 */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onToggleDrawer();
                }}
                className={cn(
                  "min-h-[42px] p-2 border transition-all flex items-center justify-between text-xs font-bold cursor-pointer rounded-none",
                  isLobbyDrawerOpen 
                    ? "bg-[#201d1d] text-amber-300 border-[#201d1d]"
                    : "bg-[#fdfcfc] border-[#201d1d]/15 text-[#201d1d] hover:border-[#201d1d] hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className={isLobbyDrawerOpen ? "text-amber-400" : "text-[#201d1d]/70"} />
                  <span>{language === 'ko' ? '서브 서랍' : 'Drawer'}</span>
                </div>
                <span className="text-[10px]">
                  {isLobbyDrawerOpen ? (language === 'ko' ? '[열림]' : '[OPEN]') : (language === 'ko' ? '[닫힘]' : '[CLOSED]')}
                </span>
              </button>

              {/* 6. 도움말 가이드 */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerHaptic('light');
                  onOpenHelp();
                }}
                className="min-h-[42px] p-2 bg-[#fdfcfc] border border-[#201d1d]/15 hover:border-[#201d1d] hover:bg-slate-50 transition-all flex items-center justify-between text-xs font-bold text-[#201d1d] cursor-pointer rounded-none"
              >
                <div className="flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-[#201d1d]/70" />
                  <span>{language === 'ko' ? '도움말' : 'Guide'}</span>
                </div>
                <span className="text-[10px] text-[#201d1d]/40">FAQ</span>
              </button>
            </div>

            {/* 7. 상점 무료팩 / 특가 숏컷 배너 */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerHaptic('light');
                onNavigate('shop');
              }}
              className="w-full min-h-[40px] px-3 py-2 bg-amber-400 hover:bg-amber-300 text-[#201d1d] text-xs font-bold border border-amber-600 transition-all flex items-center justify-between cursor-pointer rounded-none mt-1"
            >
              <div className="flex items-center gap-1.5">
                <Gift size={14} className="text-[#201d1d]" />
                <span>{language === 'ko' ? '[🎁 일일 무료 소환 & 80% 핫딜]' : '[🎁 Free Pack & Hot Deals]'}</span>
              </div>
              <span className="text-[10px] font-black">SHOP →</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
