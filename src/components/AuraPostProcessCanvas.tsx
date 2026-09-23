/**
 * AuraPostProcessCanvas.tsx - SCR-02-25
 * 풀스크린 오프스크린 블러 텍스처를 핀포인트로 합성해 60fps로 필드 카드 오라를 렌더링하는 포스트 프로세스 캔버스
 */

import React, { useRef, useEffect } from 'react';

export const AuraPostProcessCanvas: React.FC<{ activeAuras: { x: number; y: number; color: string }[] }> = ({
  activeAuras,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      activeAuras.forEach((aura) => {
        const pulse = Math.sin(tick * 0.08) * 6 + 28;
        const radGrad = ctx.createRadialGradient(aura.x, aura.y, 10, aura.x, aura.y, pulse);
        radGrad.addColorStop(0, aura.color);
        radGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(aura.x, aura.y, pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeAuras]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth || 360}
      height={window.innerHeight || 640}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
};
