import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCarCircleGameProps {
  onBack: () => void;
}

const TARGET_MERGED_CARS = 12;

interface TrafficCar {
  angle: number; // in radians
  speed: number;
  color: string;
  id: number;
}

export const PokiCarCircleGame: React.FC<PokiCarCircleGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mergedCount, setMergedCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    traffic: TrafficCar[];
    enteringCar: { y: number; progress: number; active: boolean; color: string } | null;
    mergedCount: number;
    lives: number;
    gameWon: boolean;
    circleRadius: number;
    centerX: number;
    centerY: number;
    flashEffect: number;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    traffic: [
      { angle: 0, speed: 0.025, color: '#3b82f6', id: 1 },
      { angle: Math.PI * 0.7, speed: 0.025, color: '#10b981', id: 2 },
      { angle: Math.PI * 1.4, speed: 0.025, color: '#f59e0b', id: 3 },
    ],
    enteringCar: null,
    mergedCount: 0,
    lives: 3,
    gameWon: false,
    circleRadius: 110,
    centerX: 200,
    centerY: 290,
    flashEffect: 0,
    particles: [],
  });

  const handleLaunchCar = () => {
    const st = stateRef.current;
    if (st.gameWon || st.lives <= 0 || (st.enteringCar && st.enteringCar.active)) return;

    st.enteringCar = {
      y: 500,
      progress: 0,
      active: true,
      color: '#ef4444',
    };
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
      st.centerX = w / 2;
      st.centerY = h / 2 + 10;

      // Background
      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Flash on crash
      if (st.flashEffect > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${st.flashEffect * 0.3})`;
        ctx.fillRect(0, 0, w, h);
        st.flashEffect -= 0.05;
      }

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 93, 24, 18, 48, 48);

      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('CAR CIRCLE // 로터리 합류 스킬', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`합류: ${st.mergedCount}/${TARGET_MERGED_CARS} | 라이프: ${'♥'.repeat(st.lives)}`, 84, 56);

      const cx = st.centerX;
      const cy = st.centerY;
      const r = st.circleRadius;

      // Draw Roundabout Asphalt Road
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 40;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Road Center Dash line
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f8fafc';
      ctx.stroke();
      ctx.setLineDash([]);

      // Roundabout Center Island (Greenery)
      ctx.beginPath();
      ctx.arc(cx, cy, r - 22, 0, Math.PI * 2);
      ctx.fillStyle = '#15803d';
      ctx.fill();
      ctx.strokeStyle = '#201d1d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center Fountain / Monument
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();

      // Entry Lane from Bottom (connecting to bottom of circle at angle Math.PI / 2)
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 18, cy + r - 20, 36, 160);
      ctx.strokeStyle = '#f8fafc';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, cy + r - 20);
      ctx.lineTo(cx, cy + r + 140);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stop Line at entry
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + r + 10);
      ctx.lineTo(cx + 16, cy + r + 10);
      ctx.stroke();

      // Update and Draw Traffic Cars on Circle
      st.traffic.forEach((car) => {
        car.angle = (car.angle + car.speed) % (Math.PI * 2);

        const carX = cx + Math.cos(car.angle) * r;
        const carY = cy + Math.sin(car.angle) * r;

        ctx.save();
        ctx.translate(carX, carY);
        ctx.rotate(car.angle + Math.PI / 2); // Orient along tangent

        ctx.fillStyle = car.color;
        ctx.fillRect(-10, -18, 20, 36);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -18, 20, 36);

        // Windshield
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-7, -8, 14, 10);

        ctx.restore();
      });

      // Update and Draw Entering Car
      const entryMergeAngle = Math.PI / 2; // Bottom of circle
      const targetMergeY = cy + r;

      if (st.enteringCar && st.enteringCar.active) {
        st.enteringCar.y -= 7; // Fast approach

        // Draw approaching car
        ctx.save();
        ctx.translate(cx, st.enteringCar.y);

        ctx.fillStyle = st.enteringCar.color;
        ctx.fillRect(-10, -18, 20, 36);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -18, 20, 36);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-7, -8, 14, 10);
        ctx.restore();

        // Check if reached merge point
        if (st.enteringCar.y <= targetMergeY) {
          // Check collision with traffic cars near merge angle Math.PI / 2
          let collision = false;
          st.traffic.forEach((car) => {
            let angleDiff = Math.abs(car.angle - entryMergeAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
            if (angleDiff < 0.28) {
              collision = true;
            }
          });

          if (collision) {
            // CRASH!
            st.lives -= 1;
            setLives(st.lives);
            st.flashEffect = 1.0;
            st.enteringCar = null;

            // Explosion particles
            for (let i = 0; i < 20; i++) {
              st.particles.push({
                x: cx,
                y: targetMergeY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: '#ef4444',
                life: 1.0,
              });
            }
          } else {
            // SUCCESSFUL MERGE!
            st.mergedCount += 1;
            setMergedCount(st.mergedCount);

            // Add into traffic circle
            st.traffic.push({
              angle: entryMergeAngle,
              speed: 0.025,
              color: '#10b981',
              id: Date.now(),
            });

            // Green success burst
            for (let i = 0; i < 12; i++) {
              st.particles.push({
                x: cx,
                y: targetMergeY,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: '#10b981',
                life: 0.8,
              });
            }

            st.enteringCar = null;

            if (st.mergedCount >= TARGET_MERGED_CARS && !st.gameWon) {
              st.gameWon = true;
              setGameWon(true);
              const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
              const receipt = calculateAndDepositMissionReward({
                gameId: 'car-circle',
                gameTitle: 'Car Circle',
                score: st.mergedCount * 100,
                durationSeconds: duration,
              });
              setRewardReceipt(receipt);
            }
          }
        }
      } else {
        // Draw Waiting Car at starting slot
        ctx.save();
        ctx.translate(cx, 490);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-10, -18, 20, 36);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -18, 20, 36);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-7, -8, 14, 10);
        ctx.restore();
      }

      // Particles
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

      // Action Button at Bottom
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(w / 2 - 80, h - 55, 160, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('합류 출발 [TAP]', w / 2, h - 28);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Car Circle"
        score={mergedCount}
        targetScore={TARGET_MERGED_CARS}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handleLaunchCar}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm cursor-pointer"
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

export default PokiCarCircleGame;

