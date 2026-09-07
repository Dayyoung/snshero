import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiBounceGameProps {
  onBack: () => void;
}

const TARGET_HOOPS = 5;

export const PokiBlumgiBounceGame: React.FC<PokiBlumgiBounceGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hoopsScored, setHoopsScored] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    ball: { x: number; y: number; vx: number; vy: number; radius: number; inAir: boolean };
    dragStart: { x: number; y: number } | null;
    dragCurrent: { x: number; y: number } | null;
    hoop: { x: number; y: number; width: number };
    platforms: Array<{ x: number; y: number; w: number; h: number }>;
    hoopsScored: number;
    gameWon: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    ball: { x: 80, y: 460, vx: 0, vy: 0, radius: 14, inAir: false },
    dragStart: null,
    dragCurrent: null,
    hoop: { x: 310, y: 250, width: 45 },
    platforms: [
      { x: 180, y: 340, w: 70, h: 14 },
      { x: 260, y: 420, w: 60, h: 14 },
    ],
    hoopsScored: 0,
    gameWon: false,
    particles: [],
  });

  const resetBall = () => {
    const st = stateRef.current;
    st.ball.x = 80;
    st.ball.y = 460;
    st.ball.vx = 0;
    st.ball.vy = 0;
    st.ball.inAir = false;

    // Reposition hoop slightly
    st.hoop.y = 200 + Math.random() * 120;
    st.hoop.x = 280 + Math.random() * 50;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const st = stateRef.current;

      // Clean background
      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 103, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('BLUMGI BOUNCE // 바운스 농구 골인', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#f97316';
      ctx.fillText(`골인 성공: ${st.hoopsScored}/${TARGET_HOOPS}골 | 슬링샷 각도 조절`, 84, 56);

      // Draw Slingshot Trajectory
      if (st.dragStart && st.dragCurrent && !st.ball.inAir) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        const dx = st.dragStart.x - st.dragCurrent.x;
        const dy = st.dragStart.y - st.dragCurrent.y;
        ctx.beginPath();
        ctx.moveTo(st.ball.x, st.ball.y);
        ctx.lineTo(st.ball.x + dx * 2, st.ball.y + dy * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Platforms
      ctx.fillStyle = '#334155';
      st.platforms.forEach((plat) => {
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Draw Basketball Hoop (Backboard, Rim, Net)
      const hx = st.hoop.x;
      const hy = st.hoop.y;
      const hw = st.hoop.width;

      // Backboard
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx + hw, hy - 40, 8, 60);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + hw, hy - 40, 8, 60);

      // Rim
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + hw, hy);
      ctx.stroke();

      // Net
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 8, hy + 24);
      ctx.lineTo(hx + hw - 8, hy + 24);
      ctx.lineTo(hx + hw, hy);
      ctx.stroke();

      // Update Ball Physics if launched
      if (st.ball.inAir) {
        st.ball.vy += 0.4; // Gravity
        st.ball.x += st.ball.vx;
        st.ball.y += st.ball.vy;

        // Bounce off walls
        if (st.ball.x - st.ball.radius < 10 || st.ball.x + st.ball.radius > w - 10) {
          st.ball.vx *= -0.8;
        }
        // Floor reset
        if (st.ball.y + st.ball.radius > h - 30) {
          setTimeout(resetBall, 300);
        }

        // Bounce off platforms
        st.platforms.forEach((plat) => {
          if (
            st.ball.x >= plat.x - 5 &&
            st.ball.x <= plat.x + plat.w + 5 &&
            st.ball.y + st.ball.radius >= plat.y &&
            st.ball.y - st.ball.radius <= plat.y + plat.h
          ) {
            st.ball.vy *= -0.85;
            st.ball.y = plat.y - st.ball.radius;
          }
        });

        // Check Hoop Scoring: Ball passes through rim area from above
        if (
          st.ball.x >= hx &&
          st.ball.x <= hx + hw &&
          Math.abs(st.ball.y - hy) < 12 &&
          st.ball.vy > 0
        ) {
          st.hoopsScored += 1;
          setHoopsScored(st.hoopsScored);

          // Confetti particles
          for (let p = 0; p < 20; p++) {
            st.particles.push({
              x: hx + hw / 2,
              y: hy,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#f97316',
              life: 1.0,
            });
          }

          if (st.hoopsScored >= TARGET_HOOPS && !st.gameWon) {
            st.gameWon = true;
            setGameWon(true);
            const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            const receipt = calculateAndDepositMissionReward({
              gameId: 'blumgi-bounce',
              gameTitle: 'Blumgi Bounce',
              score: st.hoopsScored * 100,
              durationSeconds: duration,
            });
            setRewardReceipt(receipt);
          } else {
            setTimeout(resetBall, 400);
          }
        }
      }

      // Draw Blumgi Basketball
      ctx.beginPath();
      ctx.arc(st.ball.x, st.ball.y, st.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Basketball seams
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(st.ball.x, st.ball.y, st.ball.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Bottom Instructions
      ctx.fillStyle = '#201d1d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 공을 드래그해 각도와 파워를 맞추고 손을 떼어 슛하세요 ]', w / 2, h - 15);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.ball.inAir) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    stateRef.current.dragStart = { x, y };
    stateRef.current.dragCurrent = { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    stateRef.current.dragCurrent = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    const st = stateRef.current;
    if (st.dragStart && st.dragCurrent && !st.ball.inAir) {
      const dx = st.dragStart.x - st.dragCurrent.x;
      const dy = st.dragStart.y - st.dragCurrent.y;
      const power = Math.min(15, Math.hypot(dx, dy) * 0.14);
      const angle = Math.atan2(dy, dx);

      st.ball.vx = Math.cos(angle) * power;
      st.ball.vy = Math.sin(angle) * power;
      st.ball.inAir = true;
    }
    st.dragStart = null;
    st.dragCurrent = null;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Blumgi Bounce"
        score={hoopsScored}
        targetScore={TARGET_HOOPS}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-crosshair"
        />
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          receipt={rewardReceipt}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default PokiBlumgiBounceGame;
