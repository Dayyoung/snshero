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
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'star' | 'diamond' | 'sparkle';
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
  // If count is 1: 'Flip!'
  // If count >= 2 (or more than 1): 'Doble Flip!'
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

  // Spawn bursting particles from one or more origins
  const spawnBurst = useCallback((count: number, origins?: { x: number; y: number }[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const isMulti = count >= 2;
    // Single flip: ~45 particles. Multiple flips ("1개 이상"): 140+ massive particle burst
    const particleAmount = isMulti ? 150 : 45;

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

      // Add shockwave ring
      newShockwaves.push({
        x: center.x,
        y: center.y,
        radius: 8,
        maxRadius: isMulti ? 140 : 80,
        color: isMulti ? '#FFD700' : '#00F0FF',
        alpha: 0.9,
        lineWidth: isMulti ? 4 : 2.5,
      });

      if (isMulti) {
        // Second rainbow shockwave for Doble Flip!
        newShockwaves.push({
          x: center.x,
          y: center.y,
          radius: 4,
          maxRadius: 180,
          color: '#EC4899',
          alpha: 0.7,
          lineWidth: 2,
        });
      }

      for (let i = 0; i < perPointCount; i++) {
        const angle = (Math.PI * 2 * i) / perPointCount + (Math.random() - 0.5) * 0.4;
        const speed = (isMulti ? 5 : 3.5) + Math.random() * (isMulti ? 13 : 9);
        const color = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
        const shapeRand = Math.random();
        const shape: 'circle' | 'star' | 'diamond' | 'sparkle' = 
          shapeRand < 0.4 ? 'circle' : shapeRand < 0.7 ? 'star' : shapeRand < 0.85 ? 'diamond' : 'sparkle';

        newParticles.push({
          x: center.x + (Math.random() - 0.5) * 10,
          y: center.y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 2),
          size: (isMulti ? 4 : 3) + Math.random() * (isMulti ? 6 : 4),
          color,
          alpha: 1,
          decay: 0.014 + Math.random() * (isMulti ? 0.018 : 0.024),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          shape,
          gravity: 0.22,
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
  }, []);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render & update shockwaves
      const shockwaves = shockwavesRef.current;
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.12 + 1.5;
        sw.alpha -= 0.025;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.lineWidth;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      // Render & update particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Physics step
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.size <= 0.5) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size > 5 ? 10 : 4;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.3);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size * 1.3);
          ctx.lineTo(-p.size, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'star') {
          // 4-point sparkle star
          const s = p.size * 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.closePath();
          ctx.fill();
        } else {
          // Sparkle cross
          const s = p.size;
          ctx.fillRect(-s / 4, -s, s / 2, s * 2);
          ctx.fillRect(-s, -s / 4, s * 2, s / 2);
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Handle trigger from props or custom event
  const executeTrigger = useCallback((detail: RainbowFlipDetail) => {
    setActiveAnnouncement(detail);
    spawnBurst(detail.count, detail.origins);

    const timer = setTimeout(() => {
      setActiveAnnouncement(prev => (prev?.id === detail.id ? null : prev));
      onFinished?.();
    }, 1400);

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
    <div className={`${isFixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none z-[160] overflow-hidden select-none ${className}`}>
      {/* 60fps Rainbow Canvas Particles Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Floating Animated Flip Banner */}
      <AnimatePresence>
        {activeAnnouncement && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              key={`flip-banner-${activeAnnouncement.id}`}
              initial={{ scale: 0.2, opacity: 0, y: 25, rotate: -4 }}
              animate={{ 
                scale: [0.2, isMulti ? 1.35 : 1.2, isMulti ? 1.15 : 1.05],
                opacity: 1, 
                y: [25, -12, -22],
                rotate: [-4, 3, 0],
              }}
              exit={{ scale: 1.3, opacity: 0, y: -45 }}
              transition={{ duration: 0.45, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="relative flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Pulsing Rainbow Halo Background */}
              <div 
                className={`absolute -inset-4 rounded-xl blur-md opacity-80 animate-pulse pointer-events-none ${
                  isMulti 
                    ? 'bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-cyan-400 to-purple-600' 
                    : 'bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-500'
                }`}
              />

              {/* Main Badge Container */}
              <div className={`relative px-5 py-2 sm:px-7 sm:py-2.5 rounded-sm border-2 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center font-mono ${
                isMulti
                  ? 'bg-[#181124]/95 border-amber-400 shadow-[0_0_35px_rgba(255,215,0,0.8)]'
                  : 'bg-[#0f172a]/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.7)]'
              }`}>
                {/* Rainbow Sparkle Accents */}
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 text-lg sm:text-xl animate-spin-slow">
                    {isMulti ? '✨🌈' : '⚡'}
                  </span>

                  {/* High-Contrast Vibrant Rainbow Text */}
                  <span 
                    className={`font-black tracking-wider text-xl sm:text-2xl md:text-3xl uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] bg-clip-text text-transparent ${
                      isMulti
                        ? 'bg-gradient-to-r from-red-400 via-amber-300 via-emerald-300 via-cyan-300 via-sky-400 to-fuchsia-400'
                        : 'bg-gradient-to-r from-cyan-300 via-emerald-300 via-amber-200 to-pink-400'
                    }`}
                    style={{
                      textShadow: '0 0 1px rgba(255,255,255,0.4)',
                    }}
                  >
                    {displayText}
                  </span>

                  <span className="text-amber-300 text-lg sm:text-xl animate-spin-slow">
                    {isMulti ? '🌈✨' : '⚡'}
                  </span>
                </div>

                {/* Subtitle count indicator for Doble Flip! */}
                {isMulti && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] sm:text-xs font-black text-amber-300 tracking-widest uppercase bg-amber-950/80 px-2 py-0.5 border border-amber-400/60 rounded-xs">
                      ⚡ COMBO x{activeAnnouncement.count} FLIPS! ⚡
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RainbowFlipEffect;
