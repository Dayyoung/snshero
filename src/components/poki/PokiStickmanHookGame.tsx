import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanHookGameProps {
  onBack: () => void;
  cardId?: number;
}

interface HookPoint {
  x: number;
  y: number;
  radius: number;
}

interface Trampoline {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PokiStickmanHookGame: React.FC<PokiStickmanHookGameProps> = ({ onBack, cardId = 20 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: {
      x: 100,
      y: 300,
      vx: 6,
      vy: 0,
      radius: 16,
      angle: 0,
      angularVel: 0.1,
    },
    hook: {
      active: false,
      anchorIndex: -1,
      anchorX: 0,
      anchorY: 0,
      length: 0,
    },
    anchors: [
      { x: 250, y: 160, radius: 10 },
      { x: 500, y: 140, radius: 10 },
      { x: 800, y: 180, radius: 10 },
      { x: 1150, y: 150, radius: 10 },
      { x: 1500, y: 170, radius: 10 },
      { x: 1900, y: 140, radius: 10 },
      { x: 2300, y: 180, radius: 10 },
      { x: 2700, y: 150, radius: 10 },
      { x: 3100, y: 160, radius: 10 },
    ] as HookPoint[],
    trampolines: [
      { x: 650, y: 460, w: 100, h: 18 },
      { x: 1300, y: 480, w: 120, h: 18 },
      { x: 2100, y: 470, w: 110, h: 18 },
      { x: 2900, y: 490, w: 130, h: 18 },
    ] as Trampoline[],
    finishX: 3500,
    cameraX: 0,
    cameraY: 0,
    isPointerDown: false,
    gravity: 0.35,
    damping: 0.992,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      if (!gameOver && !gameWon) {
        const p = state.player;

        // If pointer is held, try to hook to closest forward anchor
        if (state.isPointerDown) {
          if (!state.hook.active) {
            // Find closest available anchor in reasonable distance
            let closestIdx = -1;
            let minDist = 320;
            state.anchors.forEach((anc, idx) => {
              const d = Math.hypot(anc.x - p.x, anc.y - p.y);
              if (d < minDist && anc.x >= p.x - 80) {
                minDist = d;
                closestIdx = idx;
              }
            });

            if (closestIdx !== -1) {
              const anc = state.anchors[closestIdx];
              state.hook.active = true;
              state.hook.anchorIndex = closestIdx;
              state.hook.anchorX = anc.x;
              state.hook.anchorY = anc.y;
              state.hook.length = Math.hypot(anc.x - p.x, anc.y - p.y);
            }
          }
        } else {
          state.hook.active = false;
        }

        if (state.hook.active) {
          // Pendulum swing physics
          const dx = p.x - state.hook.anchorX;
          const dy = p.y - state.hook.anchorY;
          let currentDist = Math.hypot(dx, dy) || 1;

          // Apply gravity
          p.vy += state.gravity;

          // Constrain to rope length
          p.x += p.vx;
          p.y += p.vy;

          const nDx = p.x - state.hook.anchorX;
          const nDy = p.y - state.hook.anchorY;
          const nDist = Math.hypot(nDx, nDy) || 1;

          if (nDist > state.hook.length) {
            const excess = nDist - state.hook.length;
            p.x -= (nDx / nDist) * excess;
            p.y -= (nDy / nDist) * excess;

            // Project velocity perpendicular to the rope (tension force)
            const unitX = nDx / nDist;
            const unitY = nDy / nDist;
            const dot = p.vx * unitX + p.vy * unitY;
            p.vx -= dot * unitX;
            p.vy -= dot * unitY;

            // Centrifugal boost when swinging forward
            p.vx += 0.12;
          }

          p.vx *= state.damping;
          p.vy *= state.damping;
          p.angle += Math.hypot(p.vx, p.vy) * 0.04;
        } else {
          // Free airborne flight
          p.vy += state.gravity;
          p.vx *= state.damping;
          p.vy *= state.damping;
          p.x += p.vx;
          p.y += p.vy;
          p.angle += p.vx * 0.03;
        }

        // Trampoline bounce
        state.trampolines.forEach(t => {
          if (
            p.x >= t.x &&
            p.x <= t.x + t.w &&
            p.y + p.radius >= t.y &&
            p.y - p.radius <= t.y + t.h &&
            p.vy > 0
          ) {
            p.vy = -14.5;
            p.vx = Math.max(p.vx, 7.5);
          }
        });

        // Track progress %
        const progress = Math.min(100, Math.max(0, Math.round((p.x / state.finishX) * 100)));
        setProgressPct(progress);

        // Win check
        if (p.x >= state.finishX) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_stickman_hook',
            gameTitle: 'Stickman Hook',
            isVictory: true,
            score: 100,
            maxTargetScore: 100,
            durationSeconds: 30,
          });
          setRewardResult(deposit);
          return;
        }

        // Fall death
        if (p.y > 680) {
          setGameOver(true);
        }

        // Camera follow
        state.cameraX = p.x - cw * 0.35;
        state.cameraY = Math.min(100, Math.max(-100, (p.y - ch * 0.5) * 0.4));
      }

      // Render
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(-state.cameraX, -state.cameraY);

      // Background grid lines
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      const startX = Math.floor(state.cameraX / 60) * 60;
      for (let x = startX; x < state.cameraX + cw + 60; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, -200);
        ctx.lineTo(x, 800);
        ctx.stroke();
      }

      // Finish line
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(state.finishX, 0, 16, 700);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#86efac';
      ctx.fillText('FINISH LINE', state.finishX + 24, 250);

      // Trampolines (Bouncy pads)
      state.trampolines.forEach(t => {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(t.x + 4, t.y + 3, t.w - 8, 4);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('BOUNCE', t.x + t.w / 2, t.y + 13);
      });

      // Anchors
      state.anchors.forEach((anc, idx) => {
        const isCurrent = state.hook.active && state.hook.anchorIndex === idx;
        ctx.beginPath();
        ctx.arc(anc.x, anc.y, anc.radius, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? '#ec4899' : '#e4e4e7';
        ctx.fill();
        ctx.strokeStyle = isCurrent ? '#f472b6' : '#71717a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ring around anchor
        ctx.beginPath();
        ctx.arc(anc.x, anc.y, anc.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = isCurrent ? 'rgba(236, 72, 153, 0.4)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Grappling Hook Rope
      if (state.hook.active) {
        ctx.beginPath();
        ctx.moveTo(state.hook.anchorX, state.hook.anchorY);
        ctx.lineTo(state.player.x, state.player.y);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Rope tension dots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc((state.hook.anchorX + state.player.x) / 2, (state.hook.anchorY + state.player.y) / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      ctx.save();
      ctx.translate(state.player.x, state.player.y);
      ctx.rotate(state.player.angle);
      drawCardSprite(ctx, cardId, -16, -16, 32, 32);
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  const handlePointerDown = () => {
    gameStateRef.current.isPointerDown = true;
  };

  const handlePointerUp = () => {
    gameStateRef.current.isPointerDown = false;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      ...gameStateRef.current,
      player: {
        x: 100,
        y: 300,
        vx: 6,
        vy: 0,
        radius: 16,
        angle: 0,
        angularVel: 0.1,
      },
      hook: {
        active: false,
        anchorIndex: -1,
        anchorX: 0,
        anchorY: 0,
        length: 0,
      },
      cameraX: 0,
      cameraY: 0,
      isPointerDown: false,
    };
    setGameOver(false);
    setGameWon(false);
    setProgressPct(0);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#18181b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="STICKMAN HOOK"
        score={progressPct}
        goalScore={100}
        onBack={onBack}
        unit="%"
      />

      {/* Progress Bar Header */}
      <div className="absolute top-14 left-4 right-4 z-10 flex items-center gap-3 bg-[#09090b]/80 border border-[#27272a] px-3 py-1.5 rounded-sm">
        <span className="text-xs text-zinc-400">DISTANCE:</span>
        <div className="flex-1 h-2.5 bg-zinc-800 rounded-xs overflow-hidden">
          <div
            className="h-full bg-rose-500 transition-all duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-rose-400">{progressPct}%</span>
      </div>

      {/* Floating Control Tip */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm shadow-md pointer-events-none text-center">
        화면을 <span className="text-rose-400 font-bold">길게 누르면 로프 연결 (스윙)</span> • 손을 <span className="text-emerald-400 font-bold">떼면 전방 가속 점프</span>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ FALL DOWN ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            추락했습니다! 앵커 포인트를 제때 잡고 공중 탄력을 유지하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 스윙
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
          message="화려한 스윙과 가속 점프로 결승선 통과를 완수했습니다!"
        />
      )}
    </div>
  );
};

export default PokiStickmanHookGame;
