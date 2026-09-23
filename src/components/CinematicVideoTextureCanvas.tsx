/**
 * CinematicVideoTextureCanvas.tsx - SCR-04-22
 * 최고 등급(SSR) 등장 시 파티클과 실시간 알파 블렌딩 합성하는 60fps 시네마틱 텍스처 캔버스
 */

import React, { useRef, useEffect } from 'react';
import { WebCodecsVideoPlayer } from '../lib/WebCodecsVideoPlayer';

interface CinematicVideoTextureCanvasProps {
  isPlaying: boolean;
  onFinish?: () => void;
}

export const CinematicVideoTextureCanvas: React.FC<CinematicVideoTextureCanvasProps> = ({
  isPlaying,
  onFinish,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const player = new WebCodecsVideoPlayer();
    let tick = 0;

    const stop = player.loadVideoFrames(canvas, (ctx) => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gold aura particle blend
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
      grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rays
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((tick * Math.PI) / 60);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(200, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 4);
      }
      ctx.restore();
    });

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (stop && typeof stop.then === 'function') {
        stop.then((s) => s && s());
      }
    };
  }, [isPlaying, onFinish]);

  if (!isPlaying) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center pointer-events-none">
      <canvas
        ref={canvasRef}
        width={360}
        height={640}
        className="w-full h-full max-w-md max-h-[100dvh]"
      />
    </div>
  );
};
