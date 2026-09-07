import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiSlimeGameProps {
  onBack: () => void;
}

const TARGET_DISTANCE = 300;

export const PokiBlumgiSlimeGame: React.FC<PokiBlumgiSlimeGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    slimeX: number;
    slimeY: number;
    vx: number;
    vy: number;
    squish: number; // 0..1 charge
    isCharging: boolean;
    inAir: boolean;
    distance: number;
    gameWon: boolean;
    spikes: number[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    slimeX: 80,
    slimeY: 460,
    vx: 0,
    vy: 0,
    squish: 0,
    isCharging: false,
    inAir: false,
    distance: 0,
    gameWon: false,
    spikes: [300, 550, 800, 1100],
    particles: [],
  });

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

      ctx.fillStyle = '#fdfcfc';
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 109, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('BLUMGI SLIME // 쫀득 슬라임 점프', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#10b981';
      const curDist = Math.min(TARGET_DISTANCE, Math.floor(st.distance / 5));
      ctx.fillText(`이동 거리: ${curDist}m/${TARGET_DISTANCE}m | 충전 탄성 점프`, 84, 56);

      // Charge accumulation
      if (st.isCharging && !st.inAir) {
        st.squish = Math.min(1.0, st.squish + 0.04);
      }

      // Physics
      if (st.inAir) {
        st.vy += 0.45; // Gravity
        st.distance += st.vx;
        st.slimeY += st.vy;
        setDistanceTraveled(Math.min(TARGET_DISTANCE, Math.floor(st.distance / 5)));

        // Landing on floor
        if (st.slimeY >= 460) {
          st.slimeY = 460;
          st.vy = 0;
          st.vx = 0;
          st.inAir = false;
          st.squish = 0;

          // Squish landing particles
          for (let p = 0; p < 8; p++) {
            st.particles.push({
              x: st.slimeX,
              y: 470,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 3,
              color: '#10b981',
              life: 0.6,
            });
          }
        }
      }

      // Ground Floor
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 475, w, h - 475);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 475);
      ctx.lineTo(w, 475);
      ctx.stroke();

      // Draw Spikes
      st.spikes.forEach((sx) => {
        const screenX = sx - st.distance;
        if (screenX > -30 && screenX < w + 30) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(screenX, 475);
          ctx.lineTo(screenX + 12, 445);
          ctx.lineTo(screenX + 24, 475);
          ctx.fill();
          ctx.stroke();

          // Spike collision check
          if (Math.abs(st.slimeX - (screenX + 12)) < 16 && st.slimeY >= 450) {
            // Respawn slightly back
            st.distance = Math.max(0, st.distance - 60);
            st.slimeY = 460;
            st.inAir = false;
          }
        }
      });

      // Finish Flag (at distance 1500 px = 300m)
      const flagX = 1500 - st.distance;
      if (flagX > -50 && flagX < w + 50) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(flagX, 390);
        ctx.lineTo(flagX + 35, 410);
        ctx.lineTo(flagX, 430);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(flagX, 390);
        ctx.lineTo(flagX, 475);
        ctx.stroke();

        // Check Victory
        if (st.slimeX >= flagX && !st.gameWon) {
          st.gameWon = true;
          setGameWon(true);
          const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'blumgi-slime',
            gameTitle: 'Blumgi Slime',
            score: 1000,
            durationSeconds: duration,
          });
          setRewardReceipt(receipt);
        }
      }

      // Draw Blumgi Slime (Squishy Green Blob)
      ctx.save();
      ctx.translate(st.slimeX, st.slimeY);

      const scaleX = 1 + st.squish * 0.5;
      const scaleY = 1 - st.squish * 0.4;
      ctx.scale(scaleX, scaleY);

      // Slime Body
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Big cute cartoon eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, -4, 5, 0, Math.PI * 2);
      ctx.arc(12, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(13, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

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
      ctx.fillText('[ 화면을 꾹 눌러 탄성을 충전하고 손을 떼어 도약하세요 ]', w / 2, h - 15);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = () => {
    const st = stateRef.current;
    if (st.inAir) {
      // Air slam (slam down to ground fast)
      st.vy = 12;
    } else {
      st.isCharging = true;
    }
  };

  const handlePointerUp = () => {
    const st = stateRef.current;
    if (st.isCharging && !st.inAir) {
      st.isCharging = false;
      const jumpPower = 6 + st.squish * 10;
      st.vy = -jumpPower;
      st.vx = 4 + st.squish * 6;
      st.inAir = true;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Blumgi Slime"
        score={distanceTraveled}
        targetScore={TARGET_DISTANCE}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
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

export default PokiBlumgiSlimeGame;
