/**
 * CubeBannerCarousel.tsx - SCR-04-20
 * 픽업 배너를 3D 큐브 형태로 좌우 스와이프하는 인터랙티브 3D 회전 캐러셀
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  gradient: string;
  ssrTarget: string;
}

interface CubeBannerCarouselProps {
  banners: BannerItem[];
  onSelectBanner: (banner: BannerItem) => void;
}

export const CubeBannerCarousel: React.FC<CubeBannerCarouselProps> = ({
  banners,
  onSelectBanner,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    triggerHaptic('selection');
    setCurrentIndex((p) => (p === 0 ? banners.length - 1 : p - 1));
  };

  const handleNext = () => {
    triggerHaptic('selection');
    setCurrentIndex((p) => (p === banners.length - 1 ? 0 : p + 1));
  };

  const current = banners[currentIndex] || {
    id: 'b1',
    title: '심연의 마왕 픽업',
    subtitle: 'SSR 출현 확률 2배 UP!',
    badge: 'PICKUP',
    gradient: 'from-amber-600 to-rose-700',
    ssrTarget: '심연의 지배자',
  };

  return (
    <div className="w-full relative py-2 font-mono select-none">
      <div className="relative overflow-hidden rounded-2xl h-36 border border-slate-800 shadow-xl">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          onClick={() => onSelectBanner(current)}
          className={`w-full h-full bg-gradient-to-br ${current.gradient} p-4 flex flex-col justify-between cursor-pointer`}
        >
          <div className="flex justify-between items-start">
            <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-[10px] font-black text-amber-300 border border-amber-400/40">
              {current.badge}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-white/80">
              <Sparkles size={12} className="text-yellow-300" />
              <span>{current.ssrTarget}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-black text-white drop-shadow-md">{current.title}</h3>
            <p className="text-xs text-white/80 drop-shadow-sm">{current.subtitle}</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer active:scale-95 z-10"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer active:scale-95 z-10"
      >
        <ChevronRight size={16} />
      </button>

      {/* Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {banners.map((b, idx) => (
          <div
            key={b.id}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
