import React, { useEffect, useRef } from 'react';

interface FlyingCoin {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  size: number;
}

interface RewardFlyingCanvasProps {
  triggerTrigger: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
}

export const RewardFlyingCanvas: React.FC<RewardFlyingCanvasProps> = ({
  triggerTrigger,
  startX,
  startY,
  targetX,
  targetY
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coinsRef = useRef<FlyingCoin[]>([]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!triggerTrigger || typeof window === 'undefined') return;

    const sX = startX ?? window.innerWidth / 2;
    const sY = startY ?? window.innerHeight / 2;
    const tX = targetX ?? window.innerWidth - 60;
    const tY = targetY ?? 24;

    const newCoins: FlyingCoin[] = [];
    for (let i = 0; i < 20; i++) {
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;
      newCoins.push({
        x: sX + offsetX,
        y: sY + offsetY,
        targetX: tX,
        targetY: tY,
        progress: 0,
        speed: 0.02 + Math.random() * 0.02,
        size: 8 + Math.random() * 6
      });
    }
    coinsRef.current = [...coinsRef.current, ...newCoins];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = coinsRef.current.length - 1; i >= 0; i--) {
        const c = coinsRef.current[i];
        c.progress += c.speed;

        // Quadratic curve motion
        const t = Math.min(1, c.progress);
        const curX = (1 - t) * c.x + t * c.targetX;
        const curY = (1 - t) * c.y + t * c.targetY - Math.sin(t * Math.PI) * 80;

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(curX, curY, c.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (c.progress >= 1) {
          coinsRef.current.splice(i, 1);
        }
      }

      if (coinsRef.current.length > 0) {
        animRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animRef.current = null;
      }
    };

    if (!animRef.current) {
      animRef.current = requestAnimationFrame(render);
    }
  }, [triggerTrigger, startX, startY, targetX, targetY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 select-none"
    />
  );
};
