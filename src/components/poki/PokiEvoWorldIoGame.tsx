import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiEvoWorldIoGameProps {
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

export const PokiEvoWorldIoGame: React.FC<PokiEvoWorldIoGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 97;

  const [score, setScore] = useState(0);
  const targetScore = 20;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    playerX: 200,
    playerY: 400,
    foods: [] as { x: number; y: number; r: number; color: string }[]
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokievoworldio',
      gameTitle: isKo ? '에보월드 io' : 'EvoWorld io',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const initFoods = useCallback((w: number, h: number) => {
    const foods = [];
    const colors = ['#22c55e', '#f59e0b', '#38bdf8', '#ec4899'];
    for (let i = 0; i < 24; i++) {
      foods.push({
        x: Math.random() * (w - 60) + 30,
        y: Math.random() * (h * 0.65) + h * 0.18,
        r: Math.random() * 6 + 6,
        color: colors[i % colors.length]
      });
    }
    gameState.current.foods = foods;
    gameState.current.playerX = w / 2;
    gameState.current.playerY = h / 2;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initFoods(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0a1128';
      ctx.fillRect(0, 0, w, h);

      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      const s = gameState.current;

      s.foods.forEach((f) => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();

        if (Math.hypot(f.x - s.playerX, f.y - s.playerY) < f.r + 20) {
          f.x = Math.random() * (w - 60) + 30;
          f.y = Math.random() * (h * 0.65) + h * 0.18;
          if (navigator.vibrate) navigator.vibrate(15);
          setScore((prev) => {
            const next = prev + 1;
            if (next >= targetScore) handleVictory();
            return next;
          });
        }
      });

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(s.playerX, s.playerY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EVO', s.playerX, s.playerY - 26);

      ctx.fillStyle = '#86efac';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '마우스 이동 / 터치 드래그로 영양분을 섭취해 진화하세요!' : 'Move mouse or drag touch to eat nutrients and evolve!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, handleVictory, initFoods, isKo]);

  const handlePointer = (clientX: number, clientY: number) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = clientX - rect.left;
    const ty = clientY - rect.top;

    gameState.current.playerX += (tx - gameState.current.playerX) * 0.25;
    gameState.current.playerY += (ty - gameState.current.playerY) * 0.25;
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '에보월드 io' : 'EvoWorld io'}
        subtitle="CREATURE EVOLUTION IO"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '마우스/터치로 이동해 먹이를 섭취하세요!' : 'Eat nutrients!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) handlePointer(t.clientX, t.clientY);
        }}
        onMouseMove={(e) => handlePointer(e.clientX, e.clientY)}
        onMouseDown={(e) => handlePointer(e.clientX, e.clientY)}
      />

      {gameWon && rewardReceipt && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={true}
          score={score}
          targetScore={targetScore}
          rewardAmount={rewardReceipt.totalSns}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

export default PokiEvoWorldIoGame;
