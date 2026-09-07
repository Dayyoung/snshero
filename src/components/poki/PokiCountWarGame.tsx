import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCountWarGameProps {
  onBack: () => void;
  cardId?: number;
}

interface Gate {
  y: number;
  leftText: string;
  leftOp: (n: number) => number;
  rightText: string;
  rightOp: (n: number) => number;
  passed: boolean;
}

export const PokiCountWarGame: React.FC<PokiCountWarGameProps> = ({ onBack, cardId = 38 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [count, setCount] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    player: { x: 400, y: 520, targetX: 400 },
    armyCount: 5,
    gates: [
      { y: -200, leftText: '+10', leftOp: (n: number) => n + 10, rightText: 'x2', rightOp: (n: number) => n * 2, passed: false },
      { y: -700, leftText: 'x3', leftOp: (n: number) => n * 3, rightText: '+15', rightOp: (n: number) => n + 15, passed: false },
      { y: -1200, leftText: '-5', leftOp: (n: number) => Math.max(1, n - 5), rightText: 'x2', rightOp: (n: number) => n * 2, passed: false },
      { y: -1700, leftText: '+25', leftOp: (n: number) => n + 25, rightText: 'x3', rightOp: (n: number) => n * 3, passed: false },
    ] as Gate[],
    boss: { y: -2300, hp: 80, maxHp: 80 },
    speed: 6.5,
    distanceY: 0,
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
      const scale = Math.min(cw / 800, ch / 680);
      const offsetX = (cw - 800 * scale) / 2;
      const offsetY = (ch - 680 * scale) / 2;

      if (!gameOver && !gameWon) {
        // Player steer
        p.x += (p.targetX - p.x) * 0.2;
        p.x = Math.max(260, Math.min(540, p.x));

        // Scroll gates & boss
        state.gates.forEach(g => {
          g.y += state.speed;

          // Hit gate
          if (!g.passed && g.y >= p.y - 20 && g.y <= p.y + 20) {
            g.passed = true;
            if (p.x < 400) {
              state.armyCount = g.leftOp(state.armyCount);
            } else {
              state.armyCount = g.rightOp(state.armyCount);
            }
            setCount(state.armyCount);
          }
        });

        // Boss encounter
        state.boss.y += state.speed;
        if (state.boss.y >= p.y - 50) {
          // Clash battle!
          if (state.armyCount >= state.boss.hp) {
            setGameWon(true);
            const deposit = calculateAndDepositMissionReward({
              gameId: 'poki_count_war',
              gameTitle: 'Count War',
              isVictory: true,
              score: 100,
              maxTargetScore: 100,
              durationSeconds: 30,
            });
            setRewardResult(deposit);
            return;
          } else {
            setGameOver(true);
          }
        }
      }

      // Render
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Highway Runway
      ctx.fillStyle = '#18181b';
      ctx.fillRect(200, 0, 400, 680);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 3;
      ctx.strokeRect(200, 0, 400, 680);

      // Center dash line
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(400, 0); ctx.lineTo(400, 680);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Gates
      state.gates.forEach(g => {
        if (g.y > -80 && g.y < 700) {
          // Left Gate (Blue)
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.fillRect(205, g.y - 20, 190, 40);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(205, g.y - 20, 190, 40);

          ctx.font = 'bold 20px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(g.leftText, 300, g.y + 6);

          // Right Gate (Cyan or Red if minus)
          const isBad = g.rightText.startsWith('-');
          ctx.fillStyle = isBad ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)';
          ctx.fillRect(405, g.y - 20, 190, 40);
          ctx.strokeStyle = isBad ? '#ef4444' : '#22c55e';
          ctx.strokeRect(405, g.y - 20, 190, 40);

          ctx.fillText(g.rightText, 500, g.y + 6);
        }
      });

      // Boss Enemy at end
      if (state.boss.y > -100 && state.boss.y < 750) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(320, state.boss.y - 40, 160, 80);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`BOSS (HP ${state.boss.hp})`, 400, state.boss.y + 6);
      }

      // Draw Army Crowd
      const visualCount = Math.min(30, state.armyCount);
      for (let i = 0; i < visualCount; i++) {
        const spreadX = p.x + ((i % 6) - 2.5) * 16;
        const spreadY = p.y + Math.floor(i / 6) * 16;

        if (i === 0) {
          // Leader Hero Card
          drawCardSprite(ctx, cardId, spreadX - 14, spreadY - 14, 28, 28);
        } else {
          // Blue stickman minion
          ctx.beginPath();
          ctx.arc(spreadX, spreadY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        }
      }

      // Total count indicator above army
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText(`x${state.armyCount}`, p.x, p.y - 24);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, cardId]);

  // Touch steer
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cw = canvas.width;
    const scale = Math.min(cw / 800, window.innerHeight / 680);
    const offsetX = (cw - 800 * scale) / 2;

    const clickX = (e.clientX - rect.left - offsetX) / scale;
    gameStateRef.current.player.targetX = clickX;
  };

  const handleRestart = () => {
    gameStateRef.current = {
      player: { x: 400, y: 520, targetX: 400 },
      armyCount: 5,
      gates: [
        { y: -200, leftText: '+10', leftOp: (n: number) => n + 10, rightText: 'x2', rightOp: (n: number) => n * 2, passed: false },
        { y: -700, leftText: 'x3', leftOp: (n: number) => n * 3, rightText: '+15', rightOp: (n: number) => n + 15, passed: false },
        { y: -1200, leftText: '-5', leftOp: (n: number) => Math.max(1, n - 5), rightText: 'x2', rightOp: (n: number) => n * 2, passed: false },
        { y: -1700, leftText: '+25', leftOp: (n: number) => n + 25, rightText: 'x3', rightOp: (n: number) => n * 3, passed: false },
      ],
      boss: { y: -2300, hp: 80, maxHp: 80 },
      speed: 6.5,
      distanceY: 0,
    };
    setCount(5);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#09090b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointer}
      onPointerMove={e => e.buttons === 1 && handlePointer(e)}
    >
      <MinimalistMissionHUD
        title="COUNT WAR"
        score={count}
        goalScore={80}
        onBack={onBack}
        unit="WARRIORS"
      />

      {/* Army Count Status */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-sky-400">🛡️ ARMY CLONE COUNT: {count}</span>
        <span className="text-zinc-300">BOSS HP: 80</span>
      </div>

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        화면을 좌우로 드래그하여 <span className="text-sky-400 font-bold">배수(+ / x) 게이트를 통과</span>하고 병력을 불리세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-ew-resize" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ DEFEATED BY BOSS ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            병력 수가 부족하여 보스에게 전멸당했습니다! 더 높은 배수 게이트를 선택하세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 진군
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
          message="수많은 클론 군단과 함께 적 요새 보스를 압도적으로 격파했습니다!"
        />
      )}
    </div>
  );
};

export default PokiCountWarGame;
