import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStuntBikeExtremeGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiStuntBikeExtremeGame: React.FC<PokiStuntBikeExtremeGameProps> = ({ onBack, cardId = 33 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [flips, setFlips] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    bike: {
      x: 150,
      y: 350,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVel: 0,
      wheelRadius: 12,
    },
    throttle: false,
    brake: false,
    groundPoints: [] as { x: number; y: number }[],
    finishX: 3200,
    cameraX: 0,
    flipsCount: 0,
    accumulatedRotation: 0,
  });

  // Generate terrain
  useEffect(() => {
    const pts: { x: number; y: number }[] = [];
    for (let x = -200; x <= 3500; x += 40) {
      let y = 420;
      if (x > 300 && x < 600) y = 420 - Math.sin(((x - 300) / 300) * Math.PI) * 90;
      if (x > 900 && x < 1300) y = 420 - Math.sin(((x - 900) / 400) * Math.PI) * 130;
      if (x > 1600 && x < 2100) y = 420 - Math.sin(((x - 1600) / 500) * Math.PI) * 150;
      if (x > 2400 && x < 2900) y = 420 - Math.sin(((x - 2400) / 500) * Math.PI) * 110;
      pts.push({ x, y });
    }
    gameStateRef.current.groundPoints = pts;
  }, []);

  const getGroundY = (x: number) => {
    const pts = gameStateRef.current.groundPoints;
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const ratio = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
        return pts[i].y + ratio * (pts[i + 1].y - pts[i].y);
      }
    }
    return 420;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const b = state.bike;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      if (!gameOver && !gameWon) {
        // Controls
        if (state.throttle) {
          b.vx = Math.min(13, b.vx + 0.35);
          b.angularVel += 0.004;
        } else if (state.brake) {
          b.vx = Math.max(-2, b.vx - 0.4);
          b.angularVel -= 0.006;
        } else {
          b.vx *= 0.99;
        }

        // Gravity
        b.vy += 0.38;
        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.angularVel;
        b.angularVel *= 0.97;

        state.accumulatedRotation += b.angularVel;
        if (Math.abs(state.accumulatedRotation) >= Math.PI * 2) {
          state.accumulatedRotation = 0;
          state.flipsCount += 1;
          setFlips(state.flipsCount);
        }

        // Terrain collision
        const groundY = getGroundY(b.x);
        if (b.y >= groundY - b.wheelRadius) {
          b.y = groundY - b.wheelRadius;
          b.vy = 0;

          // Align angle to slope smoothly
          const nextGroundY = getGroundY(b.x + 20);
          const slopeAngle = Math.atan2(nextGroundY - groundY, 20);
          b.angle += (slopeAngle - b.angle) * 0.2;

          // Crash check if upside down
          let normAngle = b.angle % (Math.PI * 2);
          if (normAngle < 0) normAngle += Math.PI * 2;
          if (normAngle > Math.PI * 0.65 && normAngle < Math.PI * 1.35) {
            setGameOver(true);
          }
        }

        // Camera Follow
        state.cameraX = b.x - cw * 0.35;

        // Progress
        const p = Math.min(100, Math.max(0, Math.round((b.x / state.finishX) * 100)));
        setProgress(p);

        // Win Check
        if (b.x >= state.finishX) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_stunt_bike',
            gameTitle: 'Stunt Bike Extreme',
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
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(-state.cameraX, 0);

      // Draw Terrain
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(state.groundPoints[0]?.x || 0, 800);
      state.groundPoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(3500, 800);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Finish Banner
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(state.finishX, 200, 16, 220);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#86efac';
      ctx.fillText('FINISH LINE', state.finishX + 24, 280);

      // Draw Bike & Hero
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      // Wheels
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-16, 10, b.wheelRadius, 0, Math.PI * 2);
      ctx.arc(16, 10, b.wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bike Frame
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(0, -5);
      ctx.lineTo(16, 10);
      ctx.stroke();

      // Rider Hero Card
      drawCardSprite(ctx, cardId, -12, -26, 24, 24);

      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Touch Screen Split Controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cw = window.innerWidth;
    if (e.clientX > cw / 2) {
      gameStateRef.current.throttle = true;
    } else {
      gameStateRef.current.brake = true;
    }
  };

  const handlePointerUp = () => {
    gameStateRef.current.throttle = false;
    gameStateRef.current.brake = false;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      ...gameStateRef.current,
      bike: {
        x: 150,
        y: 350,
        vx: 0,
        vy: 0,
        angle: 0,
        angularVel: 0,
        wheelRadius: 12,
      },
      throttle: false,
      brake: false,
      cameraX: 0,
      flipsCount: 0,
      accumulatedRotation: 0,
    };
    setProgress(0);
    setFlips(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="STUNT BIKE EXTREME"
        score={progress}
        goalScore={100}
        onBack={onBack}
        unit="%"
      />

      {/* Progress & Flips HUD */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-sm text-xs">
        <div className="flex items-center gap-2">
          <span>PROGRESS:</span>
          <div className="w-24 h-2 bg-slate-800 rounded-xs overflow-hidden">
            <div className="h-full bg-sky-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-bold text-sky-400">{progress}%</span>
        </div>
        <span className="font-bold text-amber-400">FLIPS: {flips}</span>
      </div>

      {/* Touch Screen Split Overlay Hints */}
      <div className="absolute inset-0 pointer-events-none flex text-xs font-bold opacity-35 z-10">
        <div className="flex-1 flex items-center justify-center border-r border-slate-700 text-rose-300">
          [ BRAKE / TILT BACK ]
        </div>
        <div className="flex-1 flex items-center justify-center text-emerald-300">
          [ GAS / ACCEL ]
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ CRASHED - WIPEOUT ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            바이크가 거꾸로 뒤집혀 충돌했습니다! 공중 회전 각도를 조절해 바퀴로 착지하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
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
          message="산악 스턴트 익스트림 코스를 완벽한 균형감각으로 주파했습니다!"
        />
      )}
    </div>
  );
};

export default PokiStuntBikeExtremeGame;
