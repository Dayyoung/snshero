import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, Gift, Crown, ExternalLink } from 'lucide-react';
import { Language, ViewType } from '../types';
import { cn } from '../lib/utils';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface BannerSlide {
  id: string;
  badge: string;
  title: string;
  description: string;
  bgGradient: string;
  viewTarget?: ViewType;
  actionText: string;
  icon: React.ReactNode;
}

interface MainLobbyBannerCarouselProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx: (url: string) => void;
}

export const MainLobbyBannerCarousel: React.FC<MainLobbyBannerCarouselProps> = ({
  language,
  onNavigate,
  playSfx,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const banners: BannerSlide[] = [
    {
      id: 'banner-season1',
      badge: 'SEASON 1 GRAND OPEN',
      title: language === 'ko' ? '시즌 1 랭킹전 개막!' : 'Season 1 Ranking Match Open!',
      description: language === 'ko' ? '최대 50,000 SNS 포인트 & 한정 트로피 배지 도전' : 'Compete for up to 50,000 SNS Points & Limited Trophies!',
      bgGradient: 'from-amber-600 via-orange-600 to-amber-700',
      viewTarget: 'ranking',
      actionText: language === 'ko' ? '랭킹전 참가' : 'Enter Ranking',
      icon: <Crown size={20} className="text-amber-300" />
    },
    {
      id: 'banner-gacha',
      badge: 'NEW CARD PACKS',
      title: language === 'ko' ? '신규 UR 카드 소환 천장 이벤!' : 'New UR Card Pack & Pity Event!',
      description: language === 'ko' ? '30회 연속 소환 시 UR 카드 100% 확정 지급' : 'Guaranteed UR Card at 30 Pity Summons!',
      bgGradient: 'from-purple-700 via-fuchsia-700 to-indigo-800',
      viewTarget: 'shop',
      actionText: language === 'ko' ? '뽑기 이동' : 'Go to Gacha',
      icon: <Sparkles size={20} className="text-fuchsia-300" />
    },
    {
      id: 'banner-novel',
      badge: 'OFFICIAL NOVEL',
      title: language === 'ko' ? '웹소설 회차 프롬프트 모드 출시' : 'Novel Prompt Mode Released',
      description: language === 'ko' ? '카단과 메아리의 모험 정통 판타지를 경험하세요.' : 'Experience Kadan & Arcane Echoes novel series!',
      bgGradient: 'from-blue-700 via-cyan-700 to-indigo-800',
      viewTarget: 'novel',
      actionText: language === 'ko' ? '소설 읽기' : 'Read Novel',
      icon: <Gift size={20} className="text-cyan-300" />
    }
  ];

  // Auto Play Timer (Pause on hover or touch)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  const swipeHandlers = useSwipeGesture({
    threshold: 30,
    onSwipeLeft: () => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    },
    onSwipeRight: () => {
      setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    },
  });

  // Touch & Drag Swipe Gesture Handling using Motion & Touch Events
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 40;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -300) {
      // Swipe Left -> Next
      setCurrentIndex(prev => (prev + 1) % banners.length);
    } else if (info.offset.x > swipeThreshold || info.velocity.x > 300) {
      // Swipe Right -> Prev
      setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    swipeHandlers.onTouchStart(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    swipeHandlers.onTouchEnd(e);
    setIsPaused(false);
  };

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-xl select-none touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "p-5 sm:p-6 bg-gradient-to-r text-white flex flex-col justify-between min-h-[140px] sm:min-h-[150px] cursor-grab active:cursor-grabbing",
            currentBanner.bgGradient
          )}
        >
          {/* Top Badge & Pause Control */}
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-xs text-[10px] font-black tracking-wider uppercase border border-white/20 flex items-center gap-1.5">
              {currentBanner.icon}
              {currentBanner.badge}
            </span>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
              title={isPaused ? "Resume Auto-Play" : "Pause Auto-Play"}
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          </div>

          {/* Banner Content */}
          <div className="my-2 space-y-1">
            <h3 className="text-base sm:text-xl font-black tracking-tight leading-snug">
              {currentBanner.title}
            </h3>
            <p className="text-xs text-white/80 font-medium line-clamp-1">
              {currentBanner.description}
            </p>
          </div>

          {/* Action Button & Navigation Dots */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all cursor-pointer",
                    idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>

            {currentBanner.viewTarget && (
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  onNavigate(currentBanner.viewTarget!);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition-all shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span>{currentBanner.actionText}</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Side Arrow Navigation (Desktop) */}
      <button
        onClick={() => setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer hidden sm:flex"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => setCurrentIndex(prev => (prev + 1) % banners.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer hidden sm:flex"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
