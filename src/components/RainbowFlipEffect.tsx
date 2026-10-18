import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../lib/haptic';
import { playDopamineChime } from '../lib/combatDopamineEngine';
import { usePerformanceMode } from '../hooks/usePerformanceMode';

// Global event deduplication to prevent double audio/particles if multiple instances exist
let lastHandledEventId: number | null = null;
let lastHandledTime = 0;

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
 '#201d1d',
 '#fdfcfc',
 '#80602b',
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
 const { reducedMotion } = usePerformanceMode();
 const reducedMotionRef = useRef(reducedMotion);
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const [activeAnnouncement, setActiveAnnouncement] = useState<RainbowFlipDetail | null>(null);
 const particlesRef = useRef<RainbowParticle[]>([]);
 const shockwavesRef = useRef<ShockwaveRing[]>([]);
 const animFrameRef = useRef<number | null>(null);
 const isRenderingRef = useRef(false);

 // Preference changes stop visuals without restarting the event's completion timer.
 useEffect(() => {
 reducedMotionRef.current = reducedMotion;
 if (reducedMotion) {
 if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
 animFrameRef.current = null;
 isRenderingRef.current = false;
 particlesRef.current = [];
 shockwavesRef.current = [];
 }
 }, [reducedMotion]);

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
 if (reducedMotion) return;
 syncCanvasSize();
 window.addEventListener('resize', syncCanvasSize, { passive: true });
 return () => {
 window.removeEventListener('resize', syncCanvasSize);
 };
 }, [syncCanvasSize, reducedMotion]);

 // High-performance canvas animation loop (sleeps when idle, 0 CPU overhead)
 const startAnimationLoop = useCallback(() => {
 if (reducedMotionRef.current || isRenderingRef.current) return;
 isRenderingRef.current = true;
 const startedAt = performance.now();

 const render = () => {
 if (reducedMotionRef.current) {
 isRenderingRef.current = false;
 return;
 }
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
 if (performance.now() - startedAt >= 450) {
 shockwaves.length = 0;
 particles.length = 0;
 }

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
 if (reducedMotionRef.current) return;
 syncCanvasSize();
 const canvas = canvasRef.current;
 if (!canvas) return;

 const w = canvas.width || window.innerWidth;
 const h = canvas.height || window.innerHeight;

 const isMulti = count >= 2;
 const particleAmount = isMulti ? 16 : 8;

 // Determine explosion centers
 let centerPoints: { x: number; y: number }[] = [];
 if (origins && origins.length > 0) {
 centerPoints = origins.slice(0, 2).map(o => ({
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
 maxRadius: isMulti ? 36 : 24,
 color: isMulti ? '#80602b' : '#201d1d',
 alpha: 0.45,
 lineWidth: 1,
 });

 for (let i = 0; i < perPointCount; i++) {
 const angle = (Math.PI * 2 * i) / perPointCount + (Math.random() - 0.5) * 0.35;
 const speed = 1.5 + Math.random() * 2;
 const color = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
 const shapeRand = Math.random();
 const shape: 'circle' | 'diamond' | 'sparkle' = 
 shapeRand < 0.5 ? 'circle' : shapeRand < 0.8 ? 'diamond' : 'sparkle';

 newParticles.push({
 x: center.x + (Math.random() - 0.5) * 8,
 y: center.y + (Math.random() - 0.5) * 8,
 vx: Math.cos(angle) * speed,
 vy: Math.sin(angle) * speed - (Math.random() * 2),
 size: 1 + Math.random() * 1.5,
 color,
 alpha: 1,
 decay: 0.06 + Math.random() * 0.02,
 shape,
 gravity: 0.18,
 });
 }
 });

 particlesRef.current = [...particlesRef.current, ...newParticles].slice(-24);
 shockwavesRef.current = [...shockwavesRef.current, ...newShockwaves].slice(-2);

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
 // Sound and haptics remain event feedback even when visual motion is disabled.
 if (detail.count >= 2) {
 playDopamineChime(Math.min(5, detail.count), true);
 triggerHaptic('heavy');
 } else {
 playDopamineChime(1, false);
 triggerHaptic('medium');
 }
 spawnBurst(detail.count, detail.origins);

 // Keep the existing 850ms announcement/completion contract.
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
 const now = Date.now();
 if (lastHandledEventId === customEvent.detail.id || (now - lastHandledTime < 50)) {
 return;
 }
 lastHandledEventId = customEvent.detail.id;
 lastHandledTime = now;
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

 const content = (
 <div 
 className={`${isFixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none z-[999999] overflow-hidden select-none bg-transparent ${className}`}
 style={{ zIndex: 999999 }}
 >
 {/* High-Performance Canvas Particles Layer (0% idle CPU) */}
 {!reducedMotion && <canvas
 ref={canvasRef}
 className="absolute inset-0 w-full h-full pointer-events-none bg-transparent"
 />}

 {/* Brief, compact announcement with a solid surface for reliable contrast. */}
 <AnimatePresence>
 {activeAnnouncement && (
 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-transparent">
 <motion.div
 key={`flip-banner-${activeAnnouncement.id}`}
 initial={reducedMotion ? false : { opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
 transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }}
 className="relative max-w-[calc(100%-2rem)] flex flex-col items-center justify-center pointer-events-none select-none font-mono"
 >
 <div className="px-4 py-2 bg-[#201d1d] border border-[#fdfcfc]/30 text-[#fdfcfc] text-center rounded-none">
 <span 
 className="font-bold text-lg sm:text-xl uppercase select-none break-words"
 >
 {displayText}
 </span>
 </div>

 {isMulti && (
 <div className="mt-1 px-2 py-1 bg-[#fdfcfc] border border-[#0f0000]/12 text-[#201d1d]">
 <span 
 className="text-[11px] sm:text-xs font-medium uppercase"
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

 if (isFixed && typeof document !== 'undefined') {
 return createPortal(content, document.body);
 }

 return content;
};

export default RainbowFlipEffect;
