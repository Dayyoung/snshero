import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSoccerRealGameProps {
  onBack: () => void;
  cardId?: number;
}

export const PokiSoccerRealGame: React.FC<PokiSoccerRealGameProps> = ({ onBack, cardId = 25 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [goalBanner, setGoalBanner] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    ball: { x: 400, y: 500, vx: 0, vy: 0, radius: 10, isShot: false },
    goalkeeper: { x: 400, y: 160, vx: 3.5, width: 60, height: 20 },
    defender: { x: 350, y: 320, vx: -2.8, width: 50, height: 20 },
    goal: { x: 260, y: 120, w: 280, h: 40 },
    dragStart: { x: 0, y: 0 },
    isAiming: false,
    dragCurrent: { x: 0, y: 0 },
    scoreCount: 0,
    attemptsLeft: 5,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resetBall = () => {
      gameStateRef.current.ball = {
        x: 400,
        y: 500,
        vx: 0,
        vy: 0,
        radius: 10,
        isShot: false,
      };
      gameStateRef.current.isAiming = false;
    };

    const render = () => {
      const state = gameStateRef.current;
      const b = state.ball;
      const gk = state.goalkeeper;
      const df = state.defender;
      const g = state.goal;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.min(cw / 800, ch / 680);
      const offsetX = (cw - 800 * scale) / 2;
      const offsetY = (ch - 680 * scale) / 2;

      if (!gameOver && !gameWon) {
        // Goalkeeper movement
        gk.x += gk.vx;
        if (gk.x < g.x + 30 || gk.x > g.x + g.w - 30) {
          gk.vx = -gk.vx;
        }

        // Defender movement
        df.x += df.vx;
        if (df.x < 200 || df.x > 600) {
          df.vx = -df.vx;
        }

        // Ball physics
        if (b.isShot) {
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= 0.985;
          b.vy *= 0.985;

          // Defender block
          if (
            b.y - b.radius <= df.y + df.height &&
            b.y + b.radius >= df.y &&
            b.x >= df.x - df.width / 2 &&
            b.x <= df.x + df.width / 2
          ) {
            b.vy = 4;
            b.vx = (Math.random() - 0.5) * 6;
            setTimeout(resetBall, 600);
            state.attemptsLeft -= 1;
            setAttempts(state.attemptsLeft);
            if (state.attemptsLeft <= 0 && state.scoreCount < 3) {
              setGameOver(true);
            }
          }

          // Goalkeeper block
          if (
            b.y - b.radius <= gk.y + gk.height &&
            b.y + b.radius >= gk.y &&
            b.x >= gk.x - gk.width / 2 &&
            b.x <= gk.x + gk.width / 2
          ) {
            b.vy = 5;
            setTimeout(resetBall, 600);
            state.attemptsLeft -= 1;
            setAttempts(state.attemptsLeft);
            if (state.attemptsLeft <= 0 && state.scoreCount < 3) {
              setGameOver(true);
            }
          }

          // Goal check!
          if (
            b.y <= g.y + g.h &&
            b.y >= g.y &&
            b.x >= g.x &&
            b.x <= g.x + g.w &&
            b.isShot
          ) {
            b.isShot = false;
            state.scoreCount += 1;
            setScore(state.scoreCount);
            setGoalBanner(true);
            setTimeout(() => setGoalBanner(false), 1200);

            if (state.scoreCount >= 3) {
              setGameWon(true);
              const deposit = calculateAndDepositMissionReward({
                gameId: 'poki_soccer_real',
                gameTitle: 'Soccer REAL',
                isVictory: true,
                score: 100,
                maxTargetScore: 100,
                durationSeconds: 35,
              });
              setRewardResult(deposit);
              return;
            } else {
              setTimeout(resetBall, 800);
            }
          }

          // Out of bounds / Missed
          if (b.y < 80 || b.x < 100 || b.x > 700) {
            b.isShot = false;
            state.attemptsLeft -= 1;
            setAttempts(state.attemptsLeft);
            if (state.attemptsLeft <= 0 && state.scoreCount < 3) {
              setGameOver(true);
            } else {
              setTimeout(resetBall, 600);
            }
          }
        }
      }

      // Drawing
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Pitch Grass
      ctx.fillStyle = '#15803d';
      ctx.fillRect(60, 60, 680, 560);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 60, 680, 560);

      // Penalty Box
      ctx.strokeRect(200, 60, 400, 200);
      ctx.beginPath();
      ctx.arc(400, 260, 60, 0, Math.PI);
      ctx.stroke();

      // Goal Net
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(g.x, g.y, g.w, g.h);

      // Goalkeeper
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(gk.x - gk.width / 2, gk.y, gk.width, gk.height);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GK', gk.x, gk.y + 14);

      // Defender
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(df.x - df.width / 2, df.y, df.width, df.height);
      ctx.fillStyle = '#fff';
      ctx.fillText('DEF', df.x, df.y + 14);

      // Aim trajectory line
      if (state.isAiming) {
        const pullX = state.dragCurrent.x - state.dragStart.x;
        const pullY = state.dragCurrent.y - state.dragStart.y;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - pullX * 1.5, b.y - pullY * 1.5);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ball
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Striker Player
      drawCardSprite(ctx, cardId, b.x - 18, b.y + 18, 36, 36);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Drag Shoot Controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current.ball.isShot) return;
    gameStateRef.current.isAiming = true;
    gameStateRef.current.dragStart = { x: e.clientX, y: e.clientY };
    gameStateRef.current.dragCurrent = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current.isAiming) return;
    gameStateRef.current.dragCurrent = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = gameStateRef.current;
    if (!state.isAiming || state.ball.isShot) return;
    state.isAiming = false;

    const dx = e.clientX - state.dragStart.x;
    const dy = e.clientY - state.dragStart.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 15) {
      // Slingshot: pull back to shoot forward
      state.ball.vx = -(dx / dist) * Math.min(22, dist * 0.16);
      state.ball.vy = -(dy / dist) * Math.min(22, dist * 0.16);
      state.ball.isShot = true;
    }
  };

  const handleRestart = () => {
    gameStateRef.current = {
      ball: { x: 400, y: 500, vx: 0, vy: 0, radius: 10, isShot: false },
      goalkeeper: { x: 400, y: 160, vx: 3.5, width: 60, height: 20 },
      defender: { x: 350, y: 320, vx: -2.8, width: 50, height: 20 },
      goal: { x: 260, y: 120, w: 280, h: 40 },
      dragStart: { x: 0, y: 0 },
      isAiming: false,
      dragCurrent: { x: 0, y: 0 },
      scoreCount: 0,
      attemptsLeft: 5,
    };
    setScore(0);
    setAttempts(5);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#064e3b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="SOCCER REAL"
        score={score}
        goalScore={3}
        onBack={onBack}
        unit="GOALS"
      />

      {/* Attempts & Score Bar */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center text-xs bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-sm">
        <span className="font-bold text-amber-400">⚽ GOALS: {score} / 3</span>
        <span className="text-emerald-200">CHANCES LEFT: {attempts}</span>
      </div>

      {/* Goal Celebration Toast */}
      {goalBanner && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 text-3xl font-extrabold text-amber-300 animate-bounce tracking-widest drop-shadow-md">
          GOOOOOAL! ⚽🔥
        </div>
      )}

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-emerald-100 bg-emerald-950/90 border border-emerald-800 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        공을 <span className="text-amber-300 font-bold">뒤로 당겼다 놓아서(슬링샷)</span> 수비수와 골키퍼를 뚫고 슛을 날리세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ OUT OF CHANCES ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            슈팅 기회를 모두 소진했습니다! 수비수의 틈새를 노려 다시 슛을 날려보세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 슈팅
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
          rewardAmount={rewardResult?.rewardAmount || 35}
          message="환상적인 3골 해트트릭으로 매치를 제패했습니다!"
        />
      )}
    </div>
  );
};

export default PokiSoccerRealGame;
