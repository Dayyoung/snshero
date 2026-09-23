/**
 * SuperFastSkipHandler.tsx - SCR-08-29
 * Double-tap gesture detector for instant 0.2s Super Fast Skip on 100dvh screens,
 * drastically reducing repetitive farming fatigue.
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FastForward } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SuperFastSkipHandlerProps {
  onFastSkip: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SuperFastSkipHandler: React.FC<SuperFastSkipHandlerProps> = ({
  onFastSkip,
  children,
  disabled = false
}) => {
  const lastTapRef = useRef<number>(0);
  const [showSkipBanner, setShowSkipBanner] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    const now = performance.now();
    const timeSinceLast = now - lastTapRef.current;

    // Double-tap threshold: between 40ms and 300ms
    if (timeSinceLast > 40 && timeSinceLast < 300) {
      lastTapRef.current = 0;
      triggerHaptic('heavy');
      setShowSkipBanner(true);
      onFastSkip();
      setTimeout(() => setShowSkipBanner(false), 900);
    } else {
      lastTapRef.current = now;
    }
  }, [disabled, onFastSkip]);

  return (
    <div
      onPointerDown={handlePointerDown}
      className="relative w-full h-full select-none"
    >
      {children}

      <AnimatePresence>
        {showSkipBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/90 text-stone-950 font-mono text-[11px] font-black tracking-tight shadow-lg shadow-cyan-500/40"
          >
            <FastForward size={14} className="animate-pulse" />
            <span>SUPER FAST SKIP (0.2s)</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
