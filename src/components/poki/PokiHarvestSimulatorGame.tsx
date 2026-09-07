import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHarvestSimulatorGameProps {
  onBack: () => void;
}

const TARGET_EARNINGS = 500;

interface Crop {
  x: number;
  y: number;
  type: 'wheat' | 'sunflower';
  harvested: boolean;
}

export const PokiHarvestSimulatorGame: React.FC<PokiHarvestSimulatorGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [earnings, setEarnings] = useState(0);
  const [tankLoad, setTankLoad] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    harvesterX: number;
    harvesterY: number;
    harvesterAngle: number;
    targetX: number;
    targetY: number;
    speed: number;
    grainTank: number;
    maxTank: number;
    totalEarnings: number;
    gameWon: boolean;
    crops: Crop[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    harvesterX: 200,
    harvesterY: 400,
    harvesterAngle: -Math.PI / 2,
    targetX: 200,
    targetY: 400,
    speed: 3.2,
    grainTank: 0,
    maxTank: 50,
    totalEarnings: 0,
    gameWon: false,
    crops: [],
    particles: [],
  });

  // Initialize Crops
  useEffect(() => {
    const crops: Crop[] = [];
    for (let x = 40; x <= 360; x += 18) {
      for (let y = 140; y <= 380; y += 18) {
        crops.push({
          x,
          y,
          type: (x + y) % 36 === 0 ? 'sunflower' : 'wheat',
          harvested: false,
        });
      }
    }
    stateRef.current.crops = crops;
  }, []);

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

      ctx.fillStyle = '#f5f0e6'; // Earth soil background
      ctx.fillRect(0, 0, w, h);

      // Top UI Bar
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 92, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HARVEST SIMULATOR // 콤바인 수확기', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#eab308';
      ctx.fillText(`적재함: ${st.grainTank}/${st.maxTank} | 수익: $${st.totalEarnings}/$${TARGET_EARNINGS}`, 84, 56);

      // Silo Unloading Station (Top Right Area)
      const siloX = 320;
      const siloY = 100;
      ctx.fillStyle = '#78716c';
      ctx.fillRect(siloX - 35, siloY - 25, 70, 50);
      ctx.strokeStyle = '#201d1d';
      ctx.lineWidth = 2;
      ctx.strokeRect(siloX - 35, siloY - 25, 70, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('곡물 저장고', siloX, siloY - 5);
      ctx.font = '9px monospace';
      ctx.fillText('[하역/정산]', siloX, siloY + 12);
      ctx.textAlign = 'left';

      // Move Harvester towards target
      const dx = st.targetX - st.harvesterX;
      const dy = st.targetY - st.harvesterY;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const targetAngle = Math.atan2(dy, dx);
        st.harvesterAngle = targetAngle;
        st.harvesterX += Math.cos(targetAngle) * Math.min(st.speed, dist);
        st.harvesterY += Math.sin(targetAngle) * Math.min(st.speed, dist);
      }

      // Check Silo Unloading
      const distToSilo = Math.hypot(st.harvesterX - siloX, st.harvesterY - siloY);
      if (distToSilo < 50 && st.grainTank > 0) {
        const earned = st.grainTank * 5;
        st.totalEarnings += earned;
        st.grainTank = 0;
        setEarnings(st.totalEarnings);
        setTankLoad(0);

        // Confetti at Silo
        for (let i = 0; i < 15; i++) {
          st.particles.push({
            x: siloX,
            y: siloY,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#eab308',
            life: 1.0,
          });
        }

        if (st.totalEarnings >= TARGET_EARNINGS && !st.gameWon) {
          st.gameWon = true;
          setGameWon(true);
          const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'harvest-simulator',
            gameTitle: 'Harvest Simulator',
            score: st.totalEarnings,
            durationSeconds: duration,
          });
          setRewardReceipt(receipt);
        }
      }

      // Draw and Harvest Crops
      let unharvestedCount = 0;
      st.crops.forEach((crop) => {
        if (!crop.harvested) {
          unharvestedCount++;
          // Draw Crop
          ctx.beginPath();
          ctx.arc(crop.x, crop.y, crop.type === 'sunflower' ? 7 : 5, 0, Math.PI * 2);
          ctx.fillStyle = crop.type === 'sunflower' ? '#f59e0b' : '#eab308';
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Center for sunflower
          if (crop.type === 'sunflower') {
            ctx.beginPath();
            ctx.arc(crop.x, crop.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#451a03';
            ctx.fill();
          }

          // Check collision with Harvester Header (front of tractor)
          const headerX = st.harvesterX + Math.cos(st.harvesterAngle) * 22;
          const headerY = st.harvesterY + Math.sin(st.harvesterAngle) * 22;
          const cropDist = Math.hypot(headerX - crop.x, headerY - crop.y);

          if (cropDist < 20 && st.grainTank < st.maxTank) {
            crop.harvested = true;
            st.grainTank += 1;
            setTankLoad(st.grainTank);

            // Straw particles
            for (let p = 0; p < 3; p++) {
              st.particles.push({
                x: crop.x,
                y: crop.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: crop.type === 'sunflower' ? '#f59e0b' : '#fde047',
                life: 0.7,
              });
            }
          }
        } else {
          // Stubble on ground
          ctx.fillStyle = '#d6cbaf';
          ctx.fillRect(crop.x - 3, crop.y - 1, 6, 2);
        }
      });

      // Respawn crops if nearly all harvested
      if (unharvestedCount < 10) {
        st.crops.forEach((c) => (c.harvested = false));
      }

      // Draw Harvester (Combine)
      ctx.save();
      ctx.translate(st.harvesterX, st.harvesterY);
      ctx.rotate(st.harvesterAngle);

      // Body (Green John Deere style or SNS Red)
      ctx.fillStyle = '#15803d'; // Combine Green
      ctx.fillRect(-22, -14, 44, 28);
      ctx.strokeStyle = '#201d1d';
      ctx.lineWidth = 2;
      ctx.strokeRect(-22, -14, 44, 28);

      // Cabin Glass
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -10, 14, 20);

      // Grain Tank Level Visual
      const tankRatio = st.grainTank / st.maxTank;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-20, -12, 18 * tankRatio, 24);

      // Cutter Bar (Header at Front)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(22, -22, 8, 44);
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(22, -22, 8, 44);

      // Rotating Reel Blades
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(26, -20);
      ctx.lineTo(26, 20);
      ctx.stroke();

      ctx.restore();

      // Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
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
      if (st.grainTank >= st.maxTank) {
        ctx.fillStyle = '#dc2626';
        ctx.fillText('⚠ 적재함 가득 참! 우상단 [곡물 저장고]로 이동해 하역하세요!', w / 2, h - 20);
      } else {
        ctx.fillText('[ 화면을 드래그하여 콤바인을 운전해 작물을 수확하세요 ]', w / 2, h - 20);
      }
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    stateRef.current.targetX = (e.clientX - rect.left) * scaleX;
    stateRef.current.targetY = (e.clientY - rect.top) * scaleY;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Harvest Simulator"
        score={earnings}
        targetScore={TARGET_EARNINGS}
        onBack={onBack}
      />

      <div className="flex-1 relative flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons > 0) handlePointer(e);
          }}
          className="max-w-full max-h-full border border-black/10 bg-[#fdfcfc] touch-none shadow-sm"
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

export default PokiHarvestSimulatorGame;

