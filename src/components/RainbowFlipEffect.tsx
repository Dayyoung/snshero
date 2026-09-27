import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../lib/haptic';
import { playDopamineChime } from '../lib/combatDopamineEngine';

export interface RainbowFlipDetail {
  id: number;
  text?: 'Flip!' | 'Doble Flip!' | string;
  count: number;
  origins?: { x: number; y: number }[];
}

interface RainbowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'circle' | 'diamond' | 'sparkle';
  gravity: number;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

const RAINBOW_COLORS = [
  '#FF1E56', // Crimson Red
  '#FF7B00', // Electric Orange
  '#FFD700', // Pure Gold / Yellow
  '#00FF66', // Neon Green
  '#00F0FF', // Cyan / Aqua
  '#3B82F6', // Royal Blue
  '#A855F7', // Violet Purple
  '#EC4899', // Hot Pink
];

/**
 * Global helper to trigger Rainbow Flip effect from anywhere in the codebase.
 */
export function triggerRainbowFlip(count: number, origins?: { x: number; y: number }[], customText?: string) {
  if (typeof window === 'undefined') return;
  const text = customText || (count <= 1 ? 'Flip!' : 'Doble Flip!');
  const event = new CustomEvent<RainbowFlipDetail>('snshero:rainbow-flip', {
    detail: {
      id: Date.now() + Math.random(),
      text,
      count,
      origins,
    },
  });
  window.dispatchEvent(event);
}

interface RainbowFlipEffectProps {
  trigger?: RainbowFlipDetail | null;
  onFinished?: () => void;
  className?: string;
  isFixed?: boolean;
}

export const RainbowFlipEffect: React.FC<RainbowFlipEffectProps> = ({
  trigger,
  onFinished,
  className = '',
  isFixed = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState<RainbowFlipDetail | null>(null);
  const particlesRef = useRef<RainbowParticle[]>([]);
  const shockwavesRef = useRef<ShockwaveRing[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const isRenderingRef = useRef(false);

  // Sync canvas dimensions on resize (never inside RAF)
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize, { passive: true });
    return () => {
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [syncCanvasSize]);

  // High-performance canvas animation loop (sleeps when idle, 0 CPU overhead)
  const startAnimationLoop = useCallback(() => {
    if (isRenderingRef.current) return;
    isRenderingRef.current = true;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        isRenderingRef.current = false;
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isRenderingRef.current = false;
        return;
      }

      const shockwaves = shockwavesRef.current;
      const particles = particlesRef.current;

      // When everything has faded out, clear and stop loop
      if (shockwaves.length === 0 && particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isRenderingRef.current = false;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Shockwaves (Simple fast stroke, no shadowBlur)
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.18 + 2;
        sw.alpha -= 0.045;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.stroke();
      }

      // 2. Particles (Fast hardware-friendly rendering, zero shadowBlur, zero save/restore per particle)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Physics step
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.size <= 0.4) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + s, p.y);
          ctx.lineTo(p.x, p.y + s);
          ctx.lineTo(p.x - s, p.y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Fast Sparkle Cross
          const s = p.size;
          ctx.fillRect(p.x - s * 0.3, p.y - s, s * 0.6, s * 2);
          ctx.fillRect(p.x - s, p.y - s * 0.3, s * 2, s * 0.6);
        }
      }

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  // Spawn bursting particles from one or more origins (performance tuned)
  const spawnBurst = useCallback((count: number, origins?: { x: number; y: number }[]) => {
    syncCanvasSize();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width || window.innerWidth;
    const h = canvas.height || window.innerHeight;

    const isMulti = count >= 2;
    // Single flip: 28 particles. Multiple flips: 64 particles (responsive, 60fps lightweight)
    const particleAmount = isMulti ? 64 : 28;

    // Determine explosion centers
    let centerPoints: { x: number; y: number }[] = [];
    if (origins && origins.length > 0) {
      centerPoints = origins.map(o => ({
        x: Math.max(20, Math.min(w - 20, o.x)),
        y: Math.max(20, Math.min(h - 20, o.y)),
      }));
    } else {
      centerPoints = [{ x: w / 2, y: h / 2 }];
    }

    const newParticles: RainbowParticle[] = [];
    const newShockwaves: ShockwaveRing[] = [];

    centerPoints.forEach(center => {
      const perPointCount = Math.ceil(particleAmount / centerPoints.length);

      // Fast single shockwave
      newShockwaves.push({
        x: center.x,
        y: center.y,
        radius: 6,
        maxRadius: isMulti ? 90 : 60,
        color: isMulti ? '#FFD700' : '#00F0FF',
        alpha: 0.8,
        lineWidth: isMulti ? 3 : 2,
      });

      for (let i = 0; i < perPointCount; i++) {
        const angle = (Math.PI * 2 * i) / perPointCount + (Math.random() - 0.5) * 0.35;
        const speed = (isMulti ? 4 : 3) + Math.random() * (isMulti ? 8 : 6);
        const color = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
        const shapeRand = Math.random();
        const shape: 'circle' | 'diamond' | 'sparkle' = 
          shapeRand < 0.5 ? 'circle' : shapeRand < 0.8 ? 'diamond' : 'sparkle';

        newParticles.push({
          x: center.x + (Math.random() - 0.5) * 8,
          y: center.y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 2),
          size: (isMulti ? 3.5 : 2.8) + Math.random() * (isMulti ? 3.5 : 2.5),
          color,
          alpha: 1,
          decay: 0.026 + Math.random() * (isMulti ? 0.024 : 0.032), // Quick decay ~0.6s
          shape,
          gravity: 0.18,
        });
      }
    });

    particlesRef.current.push(...newParticles);
    shockwavesRef.current.push(...newShockwaves);

    // Audio & Haptics
    if (isMulti) {
      playDopamineChime(Math.min(5, count), true);
      triggerHaptic('heavy');
    } else {
      playDopamineChime(1, false);
      triggerHaptic('medium');
    }

    startAnimationLoop();
  }, [syncCanvasSize, startAnimationLoop]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      isRenderingRef.current = false;
    };
  }, []);

  // Handle trigger from props or custom event
  const executeTrigger = useCallback((detail: RainbowFlipDetail) => {
    setActiveAnnouncement(detail);
    spawnBurst(detail.count, detail.origins);

    // Crisp, fast notification (800ms) without lingering over cards
    const timer = setTimeout(() => {
      setActiveAnnouncement(prev => (prev?.id === detail.id ? null : prev));
      onFinished?.();
    }, 850);

    return () => clearTimeout(timer);
  }, [spawnBurst, onFinished]);

  // Prop trigger change
  useEffect(() => {
    if (trigger) {
      const cleanup = executeTrigger(trigger);
      return cleanup;
    }
  }, [trigger, executeTrigger]);

  // Listen to window custom event
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<RainbowFlipDetail>;
      if (customEvent.detail) {
        executeTrigger(customEvent.detail);
      }
    };

    window.addEventListener('snshero:rainbow-flip', handleCustomEvent);
    return () => {
      window.removeEventListener('snshero:rainbow-flip', handleCustomEvent);
    };
  }, [executeTrigger]);

  const isMulti = (activeAnnouncement?.count ?? 0) >= 2;
  const displayText = activeAnnouncement?.text || (isMulti ? 'Doble Flip!' : 'Flip!');

  return (
    <div className={`${isFixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none z-[160] overflow-hidden select-none bg-transparent ${className}`}>
      {/* High-Performance Canvas Particles Layer (0% idle CPU) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none bg-transparent"
      />

      {/* Floating Animated Flip Banner — 100% Transparent Background (카드 시야 가림 0%) */}
      <AnimatePresence>
        {activeAnnouncement && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-transparent">
            <motion.div
              key={`flip-banner-${activeAnnouncement.id}`}
              initial={{ scale: 0.5, opacity: 0, y: 15 }}
              animate={{ 
                scale: [0.5, isMulti ? 1.25 : 1.1, 1.0],
                opacity: [0, 1, 1], 
                y: [15, -12, -24],
              }}
              exit={{ scale: 0.9, opacity: 0, y: -40, transition: { duration: 0.2 } }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center justify-center pointer-events-none select-none bg-transparent"
            >
              {/* Vibrant Text with Zero Background Box */}
              <div className="flex items-center gap-1.5 bg-transparent pointer-events-none">
                <span className="text-amber-300 text-lg sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {isMulti ? '✨' : '⚡'}
                </span>

                {/* High-Contrast Rainbow Text with Stroke Outline */}
                <span 
                  className={`font-black tracking-wider text-2xl sm:text-3xl md:text-4xl uppercase select-none bg-clip-text text-transparent ${
                    isMulti
                      ? 'bg-gradient-to-r from-amber-300 via-rose-400 via-cyan-300 to-fuchsia-400'
                      : 'bg-gradient-to-r from-cyan-300 via-amber-200 to-rose-400'
                  }`}
                  style={{
                    WebkitTextStroke: '1px rgba(0, 0, 0, 0.9)',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.95))',
                  }}
                >
                  {displayText}
                </span>

                <span className="text-amber-300 text-lg sm:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {isMulti ? '✨' : '⚡'}
                </span>
              </div>

              {/* Subtitle combo count — Transparent Text */}
              {isMulti && (
                <div className="flex items-center gap-1 mt-0.5 bg-transparent">
                  <span 
                    className="text-[11px] sm:text-xs font-black text-amber-300 tracking-wider uppercase bg-transparent"
                    style={{
                      WebkitTextStroke: '0.6px rgba(0, 0, 0, 0.85)',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                    }}
                  >
                    ⚡ x{activeAnnouncement.count} COMBO! ⚡
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RainbowFlipEffect;
