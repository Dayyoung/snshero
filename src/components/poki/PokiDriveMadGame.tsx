import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDriveMadGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiDriveMadGame: React.FC<PokiDriveMadGameProps> = ({ onBack, cardId = 35 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    truck: {
      x: 120,
      y: 380,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0,
      width: 60,
      height: 28,
      wheelRadius: 14,
    },
    gas: false,
    reverse: false,
    terrain: [] as { x: number; y: number }[],
    finishX: 2800,
    cameraX: 0,
    gravity: 0.35,
  });

  // Build tricky stairs and bumps terrain
  useEffect(() => {
    const pts: { x: number; y: number }[] = [];
    for (let x = -200; x <= 3200; x += 30) {
      let y = 430;
      if (x > 300 && x < 500) y = 410; // First bump
      if (x >= 500 && x < 700) y = 430;
      if (x >= 700 && x < 1100) y = 430 - Math.sin(((x - 700) / 400) * Math.PI) * 70; // Hill
      if (x >= 1200 && x < 1500) y = 400; // Stairs
      if (x >= 1500 && x < 1800) y = 370; // High tier
      if (x >= 1800 && x < 2100) y = 430; // Drop down
      if (x >= 2200 && x < 2600) y = 430 - Math.sin(((x - 2200) / 400) * Math.PI) * 90; // Bridge
      pts.push({ x, y });
    }
    gameStateRef.current.terrain = pts;
  }, []);

  const getTerrainY = (x: number) => {
    const pts = gameStateRef.current.terrain;
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const ratio = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
        return pts[i].y + ratio * (pts[i + 1].y - pts[i].y);
      }
    }
    return 430;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const t = state.truck;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      if (!gameOver && !gameWon) {
        // Gas / Reverse
        if (state.gas) {
          t.vx = Math.min(8.5, t.vx + 0.22);
          t.angularVel += 0.003;
        } else if (state.reverse) {
          t.vx = Math.max(-4, t.vx - 0.25);
          t.angularVel -= 0.004;
        } else {
          t.vx *= 0.985;
        }

        // Gravity & Physics
        t.vy += state.gravity;
        t.x += t.vx;
        t.y += t.vy;
        t.angle += t.angularVel;
        t.angularVel *= 0.96;

        // Wheel ground collisions
        const wheelGroundY = getTerrainY(t.x);
        if (t.y >= wheelGroundY - t.wheelRadius) {
          t.y = wheelGroundY - t.wheelRadius;
          t.vy = 0;

          // Slope alignment
          const nextY = getTerrainY(t.x + 30);
          const slopeAngle = Math.atan2(nextY - wheelGroundY, 30);
          t.angle += (slopeAngle - t.angle) * 0.18;

          // Check if flipped over
          let normA = t.angle % (Math.PI * 2);
          if (normA < 0) normA += Math.PI * 2;
          if (normA > Math.PI * 0.75 && normA < Math.PI * 1.25) {
            setGameOver(true);
          }
        }

        // Camera follow
        state.cameraX = t.x - cw * 0.35;

        // Track Progress
        const p = Math.min(100, Math.max(0, Math.round((t.x / state.finishX) * 100)));
        setProgress(p);

        // Win check
        if (t.x >= state.finishX) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_drive_mad',
            gameTitle: 'Drive Mad',
            isVictory: true,
            score: 100,
            maxTargetScore: 100,
            durationSeconds: 35,
          });
          setRewardResult(deposit);
          return;
        }
      }

      // Render
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(-state.cameraX, 0);

      // Draw Voxel Terrain
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.moveTo(state.terrain[0]?.x || 0, 800);
      state.terrain.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(3200, 800);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Finish Block
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(state.finishX, 220, 20, 210);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#86efac';
      ctx.fillText('FINISH', state.finishX + 30, 310);

      // Draw Monster Truck
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      // Truck Body
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-t.width / 2, -t.height, t.width, t.height);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-t.width / 2 + 10, -t.height - 12, 35, 12);

      // Driver Card
      drawCardSprite(ctx, cardId, -t.width / 2 + 12, -t.height - 10, 22, 22);

      // Giant Monster Wheels
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 3;

      [-20, 20].forEach(wx => {
        ctx.beginPath();
        ctx.arc(wx, 4, t.wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Touch Controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cw = window.innerWidth;
    if (e.clientX > cw / 2) {
      gameStateRef.current.gas = true;
    } else {
      gameStateRef.current.reverse = true;
    }
  };

  const handlePointerUp = () => {
    gameStateRef.current.gas = false;
    gameStateRef.current.reverse = false;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      ...gameStateRef.current,
      truck: {
        x: 120,
        y: 380,
        vx: 0,
        vy: 0,
        angle: 0,
        angularVel: 0,
        width: 60,
        height: 28,
        wheelRadius: 14,
      },
      gas: false,
      reverse: false,
      cameraX: 0,
    };
    setProgress(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#111827] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="DRIVE MAD"
        score={progress}
        goalScore={100}
        onBack={onBack}
        unit="%"
      />

      {/* Progress Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-gray-900/80 border border-gray-700 px-3 py-1.5 rounded-sm text-xs">
        <div className="flex items-center gap-2">
          <span>PROGRESS:</span>
          <div className="w-24 h-2 bg-gray-800 rounded-xs overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-bold text-amber-400">{progress}%</span>
        </div>
        <span className="text-gray-300">KEEP BALANCE • NO FLIP</span>
      </div>

      {/* Touch Screen Split Hints */}
      <div className="absolute inset-0 pointer-events-none flex text-xs font-bold opacity-30 z-10">
        <div className="flex-1 flex items-center justify-center border-r border-gray-700 text-rose-300">
          [ REVERSE / 후진 ]
        </div>
        <div className="flex-1 flex items-center justify-center text-emerald-300">
          [ GAS / 전진 ]
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ TRUCK FLIPPED - CRASH ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            트럭이 전복되어 폭발했습니다! 계단 지형에서 속도를 줄여 균형을 유지하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 주행
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-sm transition-colors cursor-pointer"
            >
              미션 목록
            </button>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          onClose={onBack}
          rewardAmount={rewardResult?.rewardAmount || 38}
          message="험난한 계단과 언덕을 뒤집힘 없이 정복하고 골인했습니다!"
        />
      )}
    </div>
  );
};

export default PokiDriveMadGame;
