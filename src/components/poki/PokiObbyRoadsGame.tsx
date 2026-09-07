import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiObbyRoadsGameProps {
  onBack: () => void;
}

const TARGET_DISTANCE = 500;

interface RoadSegment {
  y: number;
  width: number;
  offsetX: number;
  obstacleType?: 'roller' | 'gap' | 'ramp';
}

export const PokiObbyRoadsGame: React.FC<PokiObbyRoadsGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState<number>(() => Date.now());

  const stateRef = useRef<{
    carX: number;
    carY: number;
    carSpeed: number;
    steerAngle: number;
    targetSteer: number;
    distance: number;
    gameWon: boolean;
    roadCurve: number;
    obstacles: Array<{ y: number; x: number; angle: number }>;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  }>({
    carX: 200,
    carY: 420,
    carSpeed: 5.5,
    steerAngle: 0,
    targetSteer: 0,
    distance: 0,
    gameWon: false,
    roadCurve: 0,
    obstacles: [
      { y: -300, x: 200, angle: 0 },
      { y: -700, x: 180, angle: 1.5 },
      { y: -1100, x: 220, angle: 3.0 },
      { y: -1500, x: 200, angle: 0.8 },
    ],
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

      // Sky gradient (High altitude cloud atmosphere)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.6, '#38bdf8');
      sky.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Top Banner
      ctx.fillStyle = '#201d1d';
      ctx.fillRect(16, 12, w - 32, 60);
      drawCardSprite(ctx, 110, 24, 18, 48, 48);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('OBBY ROADS // 고공 장애물 로드 레이스', 84, 38);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#f59e0b';
      const curDist = Math.min(TARGET_DISTANCE, Math.floor(st.distance / 4));
      ctx.fillText(`질주 거리: ${curDist}m/${TARGET_DISTANCE}m | 추락 주의 & 부스터 질주`, 84, 56);

      // Distance progress
      st.distance += st.carSpeed;
      setDistanceTraveled(Math.min(TARGET_DISTANCE, Math.floor(st.distance / 4)));

      // Car steering physics
      st.steerAngle += (st.targetSteer - st.steerAngle) * 0.15;
      st.carX += st.steerAngle * 4.5;

      // Road perspective (Suspended highway in sky)
      const roadCenter = w / 2 + Math.sin(st.distance * 0.005) * 35;
      const roadWidth = 140;

      // Road base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(roadCenter - roadWidth / 2, 0, roadWidth, h);

      // Road Neon edges
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roadCenter - roadWidth / 2, 0);
      ctx.lineTo(roadCenter - roadWidth / 2, h);
      ctx.moveTo(roadCenter + roadWidth / 2, 0);
      ctx.lineTo(roadCenter + roadWidth / 2, h);
      ctx.stroke();

      // Road dash line
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 14]);
      ctx.lineDashOffset = -st.distance;
      ctx.beginPath();
      ctx.moveTo(roadCenter, 0);
      ctx.lineTo(roadCenter, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Check Fall off Road
      if (st.carX < roadCenter - roadWidth / 2 || st.carX > roadCenter + roadWidth / 2) {
        // Respawn in center with slight delay
        st.carX = roadCenter;
        st.carSpeed = 2.0;
        setTimeout(() => { st.carSpeed = 5.5; }, 400);
      }

      // Update Obstacles (Rotating roller bars)
      st.obstacles.forEach((obs) => {
        obs.y += st.carSpeed;
        obs.angle += 0.08;

        if (obs.y > h + 50) {
          obs.y = -400 - Math.random() * 200;
        }

        if (obs.y > -50 && obs.y < h + 50) {
          // Draw Rotating Obstacle Bar across road
          ctx.save();
          ctx.translate(roadCenter, obs.y);
          ctx.rotate(obs.angle);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-60, -8, 120, 16);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(-60, -8, 120, 16);

          ctx.restore();

          // Collision with car
          if (Math.abs(obs.y - st.carY) < 25 && Math.abs(st.carX - roadCenter) < 55) {
            st.carSpeed = 1.5;
            setTimeout(() => { st.carSpeed = 5.5; }, 500);
          }
        }
      });

      // Finish Gate at 2000 px = 500m
      const finishY = (2000 - st.distance);
      if (finishY > -100 && finishY < h) {
        // Checkerboard Banner
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(roadCenter - roadWidth / 2, finishY, roadWidth, 24);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(roadCenter - roadWidth / 2, finishY, roadWidth, 24);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 FINISH 🏁', roadCenter, finishY + 16);
        ctx.textAlign = 'left';

        // Check Victory
        if (st.carY <= finishY + 20 && !st.gameWon) {
          st.gameWon = true;
          setGameWon(true);
          const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
          const receipt = calculateAndDepositMissionReward({
            gameId: 'obby-roads',
            gameTitle: 'Obby Roads',
            score: 1000,
            durationSeconds: duration,
          });
          setRewardReceipt(receipt);
        }
      }

      // Draw Player Sports Car
      ctx.save();
      ctx.translate(st.carX, st.carY);
      ctx.rotate(st.steerAngle * 0.4);

      // Car Body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-14, -28, 28, 56);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -28, 28, 56);

      // Windshield
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-10, -14, 20, 14);

      // Rear Spoiler
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, 20, 32, 6);

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -20, 4, 10);
      ctx.fillRect(14, -20, 4, 10);
      ctx.fillRect(-18, 12, 4, 10);
      ctx.fillRect(14, 12, 4, 10);

      ctx.restore();

      // Exhaust Boost Particles
      st.particles.push({
        x: st.carX + (Math.random() - 0.5) * 8,
        y: st.carY + 28,
        vx: (Math.random() - 0.5) * 2,
        vy: 3 + Math.random() * 2,
        color: '#f97316',
        life: 0.6,
      });

      // Update & Draw Particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) {
          st.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      }

      // Instructions
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 화면 좌/우 터치로 핸들을 조작해 로드를 완주하세요 ]', w / 2, h - 15);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;

    if (x < canvas.width / 2) {
      stateRef.current.targetSteer = -0.8;
    } else {
      stateRef.current.targetSteer = 0.8;
    }
  };

  const handlePointerUp = () => {
    stateRef.current.targetSteer = 0;
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] flex flex-col font-mono select-none overflow-hidden">
      <MinimalistMissionHUD
        gameTitle="Obby Roads"
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

export default PokiObbyRoadsGame;
