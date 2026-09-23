/**
 * StarStampEffect.tsx - SCR-08-28
 * High-impact 3-Star stamp sequence with slam physics, heavy haptic feedback,
 * and WebGL starburst integration. Zero DOM reflow.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface StarStampEffectProps {
  starsEarned: number; // 1, 2, or 3
  onStarLand?: (starIndex: number, clientX: number, clientY: number) => void;
  onSequenceComplete?: () => void;
  playSfx?: (name: string) => void;
  isFastSkipped?: boolean;
}

export const StarStampEffect: React.FC<StarStampEffectProps> = ({
  starsEarned,
  onStarLand,
  onSequenceComplete,
  playSfx,
  isFastSkipped = false
}) => {
  const [landedStars, setLandedStars] = useState<number[]>([]);
  const starRefs = [
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null)
  ];

  useEffect(() => {
    if (isFastSkipped) {
      // Immediately land all earned stars
      const all: number[] = [];
      for (let i = 0; i < starsEarned; i++) all.push(i);
      setLandedStars(all);
      onSequenceComplete?.();
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < starsEarned; i++) {
      const delay = 350 + i * 380;
      const t = setTimeout(() => {
        setLandedStars(prev => [...prev, i]);
        triggerHaptic('heavy');
        playSfx?.('slam');

        const el = starRefs[i].current;
        if (el && onStarLand) {
          const rect = el.getBoundingClientRect();
          onStarLand(i, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }

        if (i === starsEarned - 1) {
          const completeTimer = setTimeout(() => {
            onSequenceComplete?.();
          }, 300);
          timers.push(completeTimer);
        }
      }, delay);
      timers.push(t);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [starsEarned, isFastSkipped]);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="flex items-center justify-center gap-3">
        {[0, 1, 2].map(index => {
          const isEarned = index < starsEarned;
          const isLanded = landedStars.includes(index);

          return (
            <div
              key={`star-stamp-${index}`}
              ref={starRefs[index]}
              className="relative w-14 h-14 flex items-center justify-center"
            >
              {/* Star Background Slot */}
              <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-stone-950/60 border border-stone-800">
                <Star size={24} className="text-stone-700/60" />
              </div>

              {/* Animated Slamming Star */}
              {isEarned && (
                <motion.div
                  initial={isFastSkipped ? { scale: 1, opacity: 1 } : { scale: 3.2, opacity: 0, rotate: -35 }}
                  animate={
                    isLanded
                      ? { scale: [1, 1.25, 1], opacity: 1, rotate: 0 }
                      : isFastSkipped
                      ? { scale: 1, opacity: 1, rotate: 0 }
                      : { scale: 3.2, opacity: 0 }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 22,
                    mass: 0.8
                  }}
                  className="relative z-10 flex items-center justify-center w-full h-full"
                >
                  <div className="relative">
                    <Star
                      size={34}
                      className="text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                    />
                    {/* Golden Core Sheen */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-2.5 h-2.5 rounded-full bg-white blur-[1px] opacity-80" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[11px] font-mono font-bold tracking-wider text-amber-300">
        {starsEarned === 3 && '★★★ PERFECT CLEAR'}
        {starsEarned === 2 && '★★☆ GREAT VICTORY'}
        {starsEarned === 1 && '★☆☆ CLEAR'}
        {starsEarned === 0 && '☆☆☆ DEFEAT'}
      </div>
    </div>
  );
};
