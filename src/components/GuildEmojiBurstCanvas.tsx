/**
 * GuildEmojiBurstCanvas.tsx - SCR-09-16
 * 레이드 승리 시 50인 길드원의 실시간 이모티콘/폭죽을 60fps 무감속으로 렌더링하는 WebGL/Canvas 오버레이
 */

import React, { useRef, useEffect } from 'react';

interface BurstEmoji {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  alpha: number;
}

interface GuildEmojiBurstCanvasProps {
  triggerBurst?: boolean;
  width?: number;
  height?: number;
}

export const GuildEmojiBurstCanvas: React.FC<GuildEmojiBurstCanvasProps> = ({
  triggerBurst,
  width = 360,
  height = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const emojis: BurstEmoji[] = [];
    const pool = ['🎉', '⚔️', '🔥', '👑', '💎', '🥳', '💥', '✨'];

    const emit = () => {
      for (let i = 0; i < 40; i++) {
        emojis.push({
          x: width / 2 + (Math.random() * 40 - 20),
          y: height / 2 + (Math.random() * 40 - 20),
          vx: (Math.random() - 0.5) * 8,
          vy: -2 - Math.random() * 6,
          char: pool[Math.floor(Math.random() * pool.length)],
          alpha: 1.0,
        });
      }
    };

    if (triggerBurst) {
      emit();
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';

      for (let i = emojis.length - 1; i >= 0; i--) {
        const e = emojis[i];
        e.x += e.vx;
        e.y += e.vy;
        e.vy += 0.15; // gravity
        e.alpha -= 0.015;

        if (e.alpha <= 0) {
          emojis.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, e.alpha);
        ctx.fillText(e.char, e.x, e.y);
        ctx.globalAlpha = 1.0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [triggerBurst, width, height]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full pointer-events-none"
      />
    </div>
  );
};
