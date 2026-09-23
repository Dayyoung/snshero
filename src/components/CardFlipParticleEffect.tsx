import React, { useEffect, useRef } from 'react';

export interface FlipEffectTrigger {
  id: number;
  count: number; // 뒤집힌 카드 수 (1: Flip!, 2 이상: Doble Flip!)
  slotIndices?: number[];
  originX?: number; // 화면상 x 좌표 (옵션)
  originY?: number; // 화면상 y 좌표 (옵션)
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  spin: number;
  spinSpeed: number;
  shape: 'circle' | 'star' | 'square';
}

interface CardFlipParticleEffectProps {
  trigger: FlipEffectTrigger | null;
}

const RAINBOW_PALETTE = [
  '#FF0055', // Red-Pink
  '#FF5500', // Orange
  '#FFDD00', // Gold Yellow
  '#00FF66', // Bright Green
  '#00E5FF', // Cyan
  '#7700FF', // Purple
  '#FF00CC', // Magenta
  '#FFFFFF', // White Sparkle
];

export const CardFlipParticleEffect: React.FC<CardFlipParticleEffectProps> = ({ trigger }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const textOverlayRef = useRef<HTMLDivElement | null>(null);

  // 1개: Flip!, 2개 이상: Doble Flip! (사용자 지정 문구)
  const isMulti = (trigger?.count ?? 0) >= 2;
  const displayText = isMulti ? 'Doble Flip!' : 'Flip!';

  useEffect(() => {
    if (!trigger) return;

    // 햅틱 진동 피드백
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (isMulti) {
          navigator.vibrate([40, 30, 80]);
        } else {
          navigator.vibrate(35);
        }
      }
    } catch {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 맞춤
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // 발생 위치 결정 (보드 위 슬롯 또는 화면 중앙)
    let startX = trigger.originX ?? width / 2;
    let startY = trigger.originY ?? height / 2;

    // 만약 slotIndices가 있다면 해당 슬롯 DOM 엘리먼트 위치를 찾아서 중앙 계산
    if (trigger.slotIndices && trigger.slotIndices.length > 0) {
      const slotEls = trigger.slotIndices
        .map(idx => document.getElementById(`board-slot-${idx}`))
        .filter(Boolean) as HTMLElement[];

      if (slotEls.length > 0) {
        let sumX = 0;
        let sumY = 0;
        slotEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          sumX += rect.left + rect.width / 2;
          sumY += rect.top + rect.height / 2;
        });
        startX = sumX / slotEls.length;
        startY = sumY / slotEls.length;
      }
    }

    // 파티클 생성: 1개 뒤집힘 -> 35개, 2개 이상(Doble Flip!) -> 100개 이상의 수많은 파티클!
    const particleCount = isMulti ? 110 : 38;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = isMulti ? (3 + Math.random() * 9) : (2 + Math.random() * 6);
      const color = RAINBOW_PALETTE[Math.floor(Math.random() * RAINBOW_PALETTE.length)];
      const shapes: ('circle' | 'star' | 'square')[] = isMulti 
        ? ['star', 'circle', 'square', 'circle'] 
        : ['circle', 'square'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      newParticles.push({
        x: startX + (Math.random() - 0.5) * 20,
        y: startY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isMulti ? 2.5 : 1.5), // 살짝 위로 솟구침
        size: isMulti ? (4 + Math.random() * 6) : (3 + Math.random() * 4),
        color,
        alpha: 1.0,
        decay: isMulti ? (0.012 + Math.random() * 0.015) : (0.018 + Math.random() * 0.02),
        gravity: 0.18,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.25,
        shape,
      });
    }

    particlesRef.current = newParticles;

    // 캔버스 애니메이션 루프
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.alpha <= 0.02) continue;

        aliveCount++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha -= p.decay;
        p.spin += p.spinSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isMulti ? 10 : 6;

        if (p.shape === 'star') {
          // 4각 또는 5각 별 모양 렌더
          ctx.beginPath();
          const r = p.size;
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos((18 + s * 72) * Math.PI / 180) * r, -Math.sin((18 + s * 72) * Math.PI / 180) * r);
            ctx.lineTo(Math.cos((54 + s * 72) * Math.PI / 180) * (r / 2), -Math.sin((54 + s * 72) * Math.PI / 180) * (r / 2));
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (aliveCount > 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [trigger, isMulti]);

  if (!trigger) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[180] overflow-hidden">
      {/* 무지개 폭발 캔버스 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Flip! / Doble Flip! 화려한 텍스트 팝업 */}
      <div 
        ref={textOverlayRef}
        key={trigger.id}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="relative flex flex-col items-center justify-center animate-in zoom-in-50 duration-300 fill-mode-both">
          {/* 배음/광채 백드롭 */}
          <div 
            className={`absolute rounded-full blur-xl pointer-events-none animate-pulse ${
              isMulti 
                ? 'w-64 h-32 bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-400 opacity-80' 
                : 'w-48 h-24 bg-gradient-to-r from-cyan-400 to-fuchsia-500 opacity-60'
            }`} 
          />

          {/* 메인 타이포그래피 */}
          <div 
            className={`font-black tracking-wider uppercase font-mono select-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] transform ${
              isMulti
                ? 'text-4xl sm:text-5xl scale-110 rotate-[-4deg] text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-cyan-400 to-purple-500 animate-bounce'
                : 'text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-pink-400'
            }`}
            style={{
              textShadow: isMulti
                ? '0 0 20px rgba(255,230,0,0.8), 0 0 40px rgba(255,0,128,0.7)'
                : '0 0 15px rgba(0,229,255,0.7)',
              WebkitTextStroke: isMulti ? '1.5px rgba(255,255,255,0.9)' : '1px rgba(255,255,255,0.8)',
            }}
          >
            {displayText}
          </div>

          {/* 서브 뱃지 */}
          {isMulti && (
            <div className="mt-1 px-3 py-0.5 rounded-full bg-stone-950/90 border border-amber-400/80 text-amber-300 text-[11px] font-black tracking-widest uppercase shadow-lg shadow-amber-500/40 animate-pulse">
              ✨ MULTI FLIP COMBO! ✨
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
