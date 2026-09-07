import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiEscapeSchoolGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Teacher {
  x: number;
  y: number;
  angle: number;
  patrolRoute: { x: number; y: number }[];
  currentRouteIdx: number;
  speed: number;
  viewDist: number;
  fov: number;
}

export const PokiEscapeSchoolGame: React.FC<PokiEscapeSchoolGameProps> = ({ onBack, cardId = 37 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [keys, setKeys] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: { x: 100, y: 350, targetX: 100, targetY: 350, speed: 3.2, radius: 16 },
    exitDoor: { x: 740, y: 350, radius: 45, unlocked: false },
    keys: [
      { x: 260, y: 180, collected: false },
      { x: 500, y: 520, collected: false },
      { x: 680, y: 180, collected: false },
    ],
    teachers: [
      {
        x: 350,
        y: 200,
        angle: 0,
        patrolRoute: [{ x: 350, y: 200 }, { x: 350, y: 500 }],
        currentRouteIdx: 0,
        speed: 1.8,
        viewDist: 140,
        fov: Math.PI / 3.2,
      },
      {
        x: 580,
        y: 500,
        angle: Math.PI,
        patrolRoute: [{ x: 580, y: 500 }, { x: 580, y: 200 }],
        currentRouteIdx: 0,
        speed: 2.0,
        viewDist: 150,
        fov: Math.PI / 3.2,
      },
    ] as Teacher[],
    desks: [
      { x: 220, y: 300, w: 60, h: 40 },
      { x: 440, y: 320, w: 60, h: 40 },
      { x: 640, y: 420, w: 60, h: 40 },
    ],
    keysCollected: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      const p = state.player;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.min(cw / 840, ch / 680);
      const offsetX = (cw - 840 * scale) / 2;
      const offsetY = (ch - 680 * scale) / 2;

      if (!gameOver && !gameWon) {
        // Player move to target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          p.x += (dx / dist) * Math.min(dist, p.speed);
          p.y += (dy / dist) * Math.min(dist, p.speed);
        }

        // Clamp inside classroom
        p.x = Math.max(70, Math.min(770, p.x));
        p.y = Math.max(100, Math.min(600, p.y));

        // Teachers patrol & FOV
        state.teachers.forEach(t => {
          const target = t.patrolRoute[t.currentRouteIdx];
          const tdx = target.x - t.x;
          const tdy = target.y - t.y;
          const tdist = Math.hypot(tdx, tdy);

          if (tdist < 6) {
            t.currentRouteIdx = (t.currentRouteIdx + 1) % t.patrolRoute.length;
          } else {
            t.x += (tdx / tdist) * t.speed;
            t.y += (tdy / tdist) * t.speed;
            t.angle = Math.atan2(tdy, tdx);
          }

          // FOV Check
          const pdx = p.x - t.x;
          const pdy = p.y - t.y;
          const pdist = Math.hypot(pdx, pdy);

          if (pdist < t.viewDist) {
            let angleDiff = Math.atan2(pdy, pdx) - t.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < t.fov / 2) {
              setGameOver(true);
            }
          }

          if (pdist < p.radius + 18) {
            setGameOver(true);
          }
        });

        // Collect Keys
        state.keys.forEach(k => {
          if (!k.collected) {
            if (Math.hypot(p.x - k.x, p.y - k.y) < p.radius + 18) {
              k.collected = true;
              state.keysCollected += 1;
              setKeys(state.keysCollected);
              if (state.keysCollected >= 3) {
                state.exitDoor.unlocked = true;
              }
            }
          }
        });

        // Escape through School Gate
        if (state.exitDoor.unlocked) {
          if (Math.hypot(p.x - state.exitDoor.x, p.y - state.exitDoor.y) < p.radius + state.exitDoor.radius) {
            setGameWon(true);
            const deposit = calculateAndDepositMissionReward({
              gameId: 'poki_escape_school',
              gameTitle: 'Escape From School',
              isVictory: true,
              score: 100,
              maxTargetScore: 100,
              durationSeconds: 35,
            });
            setRewardResult(deposit);
            return;
          }
        }
      }

      // Render
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Classroom Floor
      ctx.fillStyle = '#312e81';
      ctx.fillRect(40, 80, 760, 540);
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 80, 760, 540);

      // School Gate Exit
      ctx.beginPath();
      ctx.arc(state.exitDoor.x, state.exitDoor.y, state.exitDoor.radius, 0, Math.PI * 2);
      ctx.fillStyle = state.exitDoor.unlocked ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      ctx.strokeStyle = state.exitDoor.unlocked ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = state.exitDoor.unlocked ? '#86efac' : '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(state.exitDoor.unlocked ? 'GATE OPEN' : 'LOCKED', state.exitDoor.x, state.exitDoor.y + 4);

      // Desks
      state.desks.forEach(d => {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = '#78350f';
        ctx.strokeRect(d.x, d.y, d.w, d.h);
      });

      // Keys
      state.keys.forEach(k => {
        if (!k.collected) {
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔑', k.x, k.y + 8);
        }
      });

      // Teachers & Flashlight FOV
      state.teachers.forEach(t => {
        // Flashlight cone
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.arc(t.x, t.y, t.viewDist, t.angle - t.fov / 2, t.angle + t.fov / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.stroke();
        ctx.restore();

        // Teacher body
        drawCardSprite(ctx, 45, t.x - 16, t.y - 16, 32, 32);
      });

      // Player Student
      drawCardSprite(ctx, cardId, p.x - 18, p.y - 18, 36, 36);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Pointer move
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.min(cw / 840, ch / 680);
    const offsetX = (cw - 840 * scale) / 2;
    const offsetY = (ch - 680 * scale) / 2;

    const clickX = (e.clientX - rect.left - offsetX) / scale;
    const clickY = (e.clientY - rect.top - offsetY) / scale;

    gameStateRef.current.player.targetX = clickX;
    gameStateRef.current.player.targetY = clickY;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: { x: 100, y: 350, targetX: 100, targetY: 350, speed: 3.2, radius: 16 },
      exitDoor: { x: 740, y: 350, radius: 45, unlocked: false },
      keys: [
        { x: 260, y: 180, collected: false },
        { x: 500, y: 520, collected: false },
        { x: 680, y: 180, collected: false },
      ],
      teachers: [
        {
          x: 350,
          y: 200,
          angle: 0,
          patrolRoute: [{ x: 350, y: 200 }, { x: 350, y: 500 }],
          currentRouteIdx: 0,
          speed: 1.8,
          viewDist: 140,
          fov: Math.PI / 3.2,
        },
        {
          x: 580,
          y: 500,
          angle: Math.PI,
          patrolRoute: [{ x: 580, y: 500 }, { x: 580, y: 200 }],
          currentRouteIdx: 0,
          speed: 2.0,
          viewDist: 150,
          fov: Math.PI / 3.2,
        },
      ],
      desks: gameStateRef.current.desks,
      keysCollected: 0,
    };
    setKeys(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#1e1b4b] overflow-hidden select-none font-mono touch-none">
      <MinimalistMissionHUD
        title="ESCAPE FROM SCHOOL"
        score={keys}
        goalScore={3}
        onBack={onBack}
        unit="KEYS"
      />

      {/* Keys & Gate Status */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-indigo-950/80 border border-indigo-800 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-amber-400">🔑 KEYS: {keys} / 3</span>
        <span className={keys >= 3 ? 'text-emerald-400 font-bold animate-pulse' : 'text-indigo-300'}>
          {keys >= 3 ? 'GATE UNLOCKED! ESCAPE NOW' : 'TEACHER ON PATROL'}
        </span>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-indigo-200 bg-indigo-950/90 border border-indigo-800 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 탭/드래그하여 이동 • 선생님 시야(노란 콘)를 피해 열쇠 3개를 모아 정문으로 탈출하세요!
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointer}
        onPointerMove={e => e.buttons === 1 && handlePointer(e)}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ CAUGHT BY TEACHER ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            선생님의 시야에 포착되어 교무실로 끌려갔습니다! 순찰 타이밍을 노려보세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 탈출
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
          message="선생님의 감시망을 뚫고 무사히 학교를 탈출했습니다!"
        />
      )}
    </div>
  );
};

export default PokiEscapeSchoolGame;
