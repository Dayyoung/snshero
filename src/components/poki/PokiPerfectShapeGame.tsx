import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPerfectShapeGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  cardId?: number;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

type ShapeType = 'circle' | 'square' | 'triangle';

interface Wall {
  y: number;
  requiredShape: ShapeType;
  passed: boolean;
}

export const PokiPerfectShapeGame: React.FC<PokiPerfectShapeGameProps> = ({
  onBack,
  onExit,
  onClose,
  deck = [],
  cardId,
  language = 'ko',
  playSfx,
  onReward
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 28;

  const [currentShape, setCurrentShape] = useState<ShapeType>('circle');
  const [passedCount, setPassedCount] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    shape: 'circle' as ShapeType,
    walls: [] as Wall[],
    speed: 160,
    passedTotal: 0,
    spawnTimer: 0,
    playerY: 480
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiperfectshape',
      gameTitle: isKo ? 'Perfect Shape (퍼펙트 셰이프)' : 'Perfect Shape',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const selectShape = useCallback((s: ShapeType) => {
    gameState.current.shape = s;
    setCurrentShape(s);
    if (playSfx) playSfx('/sfx/pop.mp3');
    if (navigator.vibrate) navigator.vibrate(15);
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const shapes: ShapeType[] = ['circle', 'square', 'triangle'];

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        // Spawn walls
        s.spawnTimer += dt;
        if (s.spawnTimer > 1.8) {
          s.spawnTimer = 0;
          const req = shapes[Math.floor(Math.random() * shapes.length)];
          s.walls.push({ y: -40, requiredShape: req, passed: false });
        }

        // Update walls
        for (let i = s.walls.length - 1; i >= 0; i--) {
          const w = s.walls[i];
          w.y += s.speed * dt;

          if (!w.passed && w.y >= s.playerY - 20) {
            w.passed = true;
            if (s.shape === w.requiredShape) {
              s.passedTotal++;
              setPassedCount(s.passedTotal);
              if (navigator.vibrate) navigator.vibrate(20);
              if (s.passedTotal >= 10) {
                handleVictory();
              }
            } else {
              // Missed -> flash vibrate
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
          }

          if (w.y > canvas.height + 60) {
            s.walls.splice(i, 1);
          }
        }
      }

      // Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track Lane
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(canvas.width / 2 - 100, 0, 200, canvas.height);

      // Walls
      for (const w of s.walls) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(canvas.width / 2 - 100, w.y - 10, 200, 20);

        // Shape hole in center
        ctx.fillStyle = '#0f172a';
        const cx = canvas.width / 2;
        if (w.requiredShape === 'circle') {
          ctx.beginPath();
          ctx.arc(cx, w.y, 20, 0, Math.PI * 2);
          ctx.fill();
        } else if (w.requiredShape === 'square') {
          ctx.fillRect(cx - 18, w.y - 18, 36, 36);
        } else if (w.requiredShape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(cx, w.y - 20);
          ctx.lineTo(cx + 20, w.y + 18);
          ctx.lineTo(cx - 20, w.y + 18);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Player Shape Frame
      const px = canvas.width / 2;
      const py = s.playerY;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      if (s.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(px, py, 26, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.shape === 'square') {
        ctx.strokeRect(px - 24, py - 24, 48, 48);
      } else if (s.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(px, py - 26);
        ctx.lineTo(px + 26, py + 22);
        ctx.lineTo(px - 26, py + 22);
        ctx.closePath();
        ctx.stroke();
      }

      drawCardSprite(ctx, effectiveCardId, px - 20, py - 20, 40, 40);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, gameWon, handleVictory]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? 'Perfect Shape (퍼펙트 셰이프)' : 'Perfect Shape'}
        currentScore={passedCount}
        targetScore={10}
        onBack={handleExit}
        stageInfo={`${isKo ? '통과' : 'Passed'}: ${passedCount}/10`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 3 Shape Switch Buttons */}
      <div className="absolute bottom-6 inset-x-6 flex justify-center gap-4 z-20">
        <button
          className={`flex-1 h-20 rounded-2xl border-2 font-bold text-2xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all ${
            currentShape === 'circle' ? 'bg-cyan-600 border-white text-white' : 'bg-slate-800/80 border-slate-600 text-slate-300'
          }`}
          onClick={() => selectShape('circle')}
        >
          ●
        </button>
        <button
          className={`flex-1 h-20 rounded-2xl border-2 font-bold text-2xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all ${
            currentShape === 'square' ? 'bg-cyan-600 border-white text-white' : 'bg-slate-800/80 border-slate-600 text-slate-300'
          }`}
          onClick={() => selectShape('square')}
        >
          ■
        </button>
        <button
          className={`flex-1 h-20 rounded-2xl border-2 font-bold text-2xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all ${
            currentShape === 'triangle' ? 'bg-cyan-600 border-white text-white' : 'bg-slate-800/80 border-slate-600 text-slate-300'
          }`}
          onClick={() => selectShape('triangle')}
        >
          ▲
        </button>
      </div>

      {rewardReceipt && (
        <VictoryRewardModal
          isOpen={gameWon}
          reward={rewardReceipt}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};

export default PokiPerfectShapeGame;
