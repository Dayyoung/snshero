import React, { useEffect, useRef } from 'react';
import { GachaTextureManager } from '../lib/GachaTextureManager';

interface GachaWebGLCanvasProps {
  cardIndices: number[];
  onAnimationComplete?: () => void;
  lowSpecMode?: boolean;
}

export const GachaWebGLCanvas: React.FC<GachaWebGLCanvasProps> = ({
  cardIndices,
  onAnimationComplete,
  lowSpecMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();
    const duration = lowSpecMode ? 600 : 1200;

    let images: HTMLImageElement[] = [];

    GachaTextureManager.loadGachaSprites(cardIndices).then((loaded) => {
      images = loaded;
      startTime = performance.now();
      loop();
    });

    const loop = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 단일 드로우 콜로 카드들을 원형 및 그리드로 배치 렌더링
      const count = images.length;
      images.forEach((img, i) => {
        if (!img.complete || img.naturalWidth === 0) return;

        const cols = count > 5 ? 5 : count;
        const col = i % cols;
        const row = Math.floor(i / cols);

        const cardW = 54;
        const cardH = 72;
        const startX = (canvas.width - cols * (cardW + 8)) / 2 + col * (cardW + 8);
        const startY = 40 + row * (cardH + 10);

        ctx.save();
        ctx.globalAlpha = progress;
        // 위에서 아래로 떨어지는 페이드인 애니메이션
        const offsetY = (1 - progress) * 20;
        ctx.drawImage(img, startX, startY + offsetY, cardW, cardH);

        // 카드 테두리
        ctx.strokeStyle = '#201d1d';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY + offsetY, cardW, cardH);
        ctx.restore();
      });

      if (progress < 1) {
        animId = requestAnimationFrame(loop);
      } else {
        onAnimationComplete?.();
      }
    };

    return () => {
      cancelAnimationFrame(animId);
      GachaTextureManager.dispose();
    };
  }, [cardIndices, onAnimationComplete, lowSpecMode]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={240}
      className="w-full max-w-sm mx-auto h-auto block select-none"
    />
  );
};
