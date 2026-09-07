import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPartyTimeGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiPartyTimeGame: React.FC<PokiPartyTimeGameProps> = ({ onBack, cardId = 39 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: { x: 400, y: 350, targetX: 400, targetY: 350, jumpY: 0, vy: 0, isJumping: false, radius: 18 },
    sweeperAngle: 0,
    sweeperSpeed: 0.045,
    sweeperLength: 220,
    timeRemaining: 30,
    center: { x: 400, y: 350 },
    radius: 240,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const state = gameStateRef.current;
      const p = state.player;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      state.center = { x: cw / 2, y: ch / 2 + 10 };

      if (!gameOver && !gameWon) {
        state.timeRemaining = Math.max(0, state.timeRemaining - dt);
        setTimeLeft(Math.ceil(state.timeRemaining));

        if (state.timeRemaining <= 0) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_party_time',
            gameTitle: 'Party Time',
            isVictory: true,
            score: 100,
            maxTargetScore: 100,
            durationSeconds: 30,
          });
          setRewardResult(deposit);
          return;
        }

        // Move to target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          p.x += (dx / dist) * Math.min(dist, 4.5);
          p.y += (dy / dist) * Math.min(dist, 4.5);
        }

        // Clamp inside party arena
        const dCenter = Math.hypot(p.x - state.center.x, p.y - state.center.y);
        if (dCenter > state.radius - p.radius) {
          const angle = Math.atan2(p.y - state.center.y, p.x - state.center.x);
          p.x = state.center.x + Math.cos(angle) * (state.radius - p.radius);
          p.y = state.center.y + Math.sin(angle) * (state.radius - p.radius);
        }

        // Jump physics
        if (p.isJumping) {
          p.jumpY += p.vy;
          p.vy += 0.85;
          if (p.jumpY >= 0) {
            p.jumpY = 0;
            p.isJumping = false;
          }
        }

        // Rotate sweeper bar
        state.sweeperAngle += state.sweeperSpeed;

        // Collision with Sweeper Beam
        if (!p.isJumping || p.jumpY > -25) {
          // Sweeper is line from center to tip
          const tipX = state.center.x + Math.cos(state.sweeperAngle) * state.sweeperLength;
          const tipY = state.center.y + Math.sin(state.sweeperAngle) * state.sweeperLength;

          // Distance from point to line segment
          const lineDx = tipX - state.center.x;
          const lineDy = tipY - state.center.y;
          const lineLenSq = lineDx * lineDx + lineDy * lineDy;
          const t = Math.max(0, Math.min(1, ((p.x - state.center.x) * lineDx + (p.y - state.center.y) * lineDy) / lineLenSq));
          const projX = state.center.x + t * lineDx;
          const projY = state.center.y + t * lineDy;
          const distToLine = Math.hypot(p.x - projX, p.y - projY);

          if (distToLine < p.radius + 12) {
            setGameOver(true);
          }
        }
      }

      // Drawing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cw, ch);

      // Party Circular Floor
      ctx.beginPath();
      ctx.arc(state.center.x, state.center.y, state.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Sweeper Beam
      ctx.save();
      ctx.translate(state.center.x, state.center.y);
      ctx.rotate(state.sweeperAngle);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, -8, state.sweeperLength, 16);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -8, state.sweeperLength, 16);

      // Central Pillar
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.restore();

      // Player Hero Card
      const renderY = p.y + p.jumpY;
      drawCardSprite(ctx, cardId, p.x - 18, renderY - 18, 36, 36);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Touch handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const p = gameStateRef.current.player;

    // Tap to jump
    if (!p.isJumping) {
      p.isJumping = true;
      p.vy = -12.5;
    }

    p.targetX = touchX;
    p.targetY = touchY;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: { x: 400, y: 350, targetX: 400, targetY: 350, jumpY: 0, vy: 0, isJumping: false, radius: 18 },
      sweeperAngle: 0,
      sweeperSpeed: 0.045,
      sweeperLength: 220,
      timeRemaining: 30,
      center: { x: 400, y: 350 },
      radius: 240,
    };
    setTimeLeft(30);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#0f172a] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={e => e.buttons === 1 && handlePointerDown(e)}
    >
      <MinimalistMissionHUD
        title="PARTY TIME"
        score={30 - timeLeft}
        goalScore={30}
        onBack={onBack}
        unit="SECONDS"
      />

      {/* Survival Time Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-pink-400">🎉 PARTY ARENA SURVIVAL</span>
        <span className="font-bold text-amber-400 animate-pulse">TIME LEFT: {timeLeft}s</span>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-slate-300 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 탭하여 <span className="text-amber-400 font-bold">회전봉을 점프로 뛰어넘고</span> 30초간 살아남으세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ SWEPT AWAY ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            회전봉에 걸려 날아갔습니다! 다가오는 회전봉의 타이밍을 보고 제때 점프하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 파티
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
          message="광란의 회전봉 파티 아레나에서 끝까지 살아남아 우승했습니다!"
        />
      )}
    </div>
  );
};

export default PokiPartyTimeGame;
