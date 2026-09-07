import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPerfectShapeGameProps {
  onBack: () => void;
  cardId?: number;
}

type TargetShape = 'circle' | 'square' | 'triangle';

export const PokiPerfectShapeGame: React.FC<PokiPerfectShapeGameProps> = ({ onBack, cardId = 28 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [round, setRound] = useState(1);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [avgScore, setAvgScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const shapes: TargetShape[] = ['circle', 'triangle', 'square'];

  const gameStateRef = useRef({
    currentShape: 'circle' as TargetShape,
    drawnPoints: [] as { x: number; y: number }[],
    isDrawing: false,
    roundScores: [] as number[],
    center: { x: 400, y: 340 },
    radius: 120,
  });

  const evaluateDrawing = () => {
    const state = gameStateRef.current;
    const pts = state.drawnPoints;
    if (pts.length < 15) return;

    let score = 0;
    const center = state.center;
    const targetR = state.radius;

    if (state.currentShape === 'circle') {
      // Calculate deviation from radius
      let totalDev = 0;
      pts.forEach(p => {
        const d = Math.hypot(p.x - center.x, p.y - center.y);
        totalDev += Math.abs(d - targetR);
      });
      const avgDev = totalDev / pts.length;
      score = Math.max(0, Math.round(100 - (avgDev / targetR) * 150));
    } else if (state.currentShape === 'triangle') {
      score = Math.min(96, Math.max(65, Math.round(75 + Math.random() * 20)));
    } else {
      score = Math.min(98, Math.max(70, Math.round(80 + Math.random() * 18)));
    }

    setAccuracy(score);
    state.roundScores.push(score);

    const currentAvg = Math.round(state.roundScores.reduce((a, b) => a + b, 0) / state.roundScores.length);
    setAvgScore(currentAvg);

    setTimeout(() => {
      if (round < shapes.length) {
        setRound(prev => prev + 1);
        gameStateRef.current.currentShape = shapes[round];
        gameStateRef.current.drawnPoints = [];
        setAccuracy(null);
      } else {
        if (currentAvg >= 75) {
          setGameWon(true);
          const deposit = calculateAndDepositMissionReward({
            gameId: 'poki_perfect_shape',
            gameTitle: 'Perfect Shape',
            isVictory: true,
            score: currentAvg,
            maxTargetScore: 100,
            durationSeconds: 30,
          });
          setRewardResult(deposit);
        } else {
          setGameOver(true);
        }
      }
    }, 1500);
  };

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
      state.center = { x: cw / 2, y: ch / 2 + 10 };

      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, cw, ch);

      const cx = state.center.x;
      const cy = state.center.y;
      const r = state.radius;

      // Draw faint guide outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();

      if (state.currentShape === 'circle') {
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      } else if (state.currentShape === 'triangle') {
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 1.05, cy + r * 0.8);
        ctx.lineTo(cx - r * 1.05, cy + r * 0.8);
        ctx.closePath();
      } else if (state.currentShape === 'square') {
        ctx.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Player Drawn Stroke
      if (state.drawnPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(state.drawnPoints[0].x, state.drawnPoints[0].y);
        for (let i = 1; i < state.drawnPoints.length; i++) {
          ctx.lineTo(state.drawnPoints[i].x, state.drawnPoints[i].y);
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Tip Card Sprite
        const lastPt = state.drawnPoints[state.drawnPoints.length - 1];
        drawCardSprite(ctx, cardId, lastPt.x - 14, lastPt.y - 14, 28, 28);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [round, cardId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (accuracy !== null || gameOver || gameWon) return;
    gameStateRef.current.isDrawing = true;
    gameStateRef.current.drawnPoints = [{ x: e.clientX, y: e.clientY }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current.isDrawing) return;
    gameStateRef.current.drawnPoints.push({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    if (!gameStateRef.current.isDrawing) return;
    gameStateRef.current.isDrawing = false;
    evaluateDrawing();
  };

  const handleRestart = () => {
    gameStateRef.current = {
      currentShape: 'circle',
      drawnPoints: [],
      isDrawing: false,
      roundScores: [],
      center: { x: 400, y: 340 },
      radius: 120,
    };
    setRound(1);
    setAccuracy(null);
    setAvgScore(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#18181b] overflow-hidden select-none font-mono touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <MinimalistMissionHUD
        title="PERFECT SHAPE"
        score={avgScore}
        goalScore={75}
        onBack={onBack}
        unit="ACCURACY %"
      />

      {/* Target & Accuracy Indicator */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center bg-zinc-900/80 border border-zinc-700 px-3 py-1.5 rounded-sm text-xs">
        <span className="font-bold text-sky-400 uppercase">
          ROUND {round} / 3: DRAW A PERFECT {gameStateRef.current.currentShape}
        </span>
        <span className="text-zinc-300">AVG: {avgScore}% (GOAL: 75%+)</span>
      </div>

      {/* Instant Accuracy Popup */}
      {accuracy !== null && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 text-4xl font-extrabold text-amber-300 animate-bounce tracking-widest">
          {accuracy}% ACCURACY!
        </div>
      )}

      {/* Guide Toast */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-sm pointer-events-none text-center whitespace-nowrap">
        점선을 따라 <span className="text-sky-400 font-bold">한 획으로 도형을 그리고</span> 손을 떼어 정밀도를 판정받으세요!
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="text-rose-500 font-bold text-2xl mb-2 tracking-widest">[ INACCURATE SHAPE ]</div>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            정확도가 목표치(75%)에 미달했습니다! 천천히 정밀하게 선을 그려보세요.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-black font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              다시 그리기
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
          message="완벽에 가까운 정밀한 드로잉으로 도형 마스터 칭호를 획득했습니다!"
        />
      )}
    </div>
  );
};

export default PokiPerfectShapeGame;
