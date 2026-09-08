import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiWatermelonDropGameProps {
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

export const PokiWatermelonDropGame: React.FC<PokiWatermelonDropGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 101;

  const [score, setScore] = useState(0);
  const targetScore = 15;
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    fruits: [] as { x: number; y: number; r: number; vy: number; tier: number; color: string }[],
    dropX: 200,
    nextTier: 1
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiwatermelondrop',
      gameTitle: isKo ? '워터멜론 드롭' : 'Watermelon Drop',
      durationSeconds: 15,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameState.current.dropX = canvas.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Card Avatar
      drawCardSprite(ctx, effectiveCardId, w / 2, h * 0.12, 50, 50);

      // Box Container
      const bx = w * 0.12;
      const by = h * 0.24;
      const bw = w * 0.76;
      const bh = h * 0.6;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx, by, bw, bh);

      const s = gameState.current;

      // Update & Draw Fruits
      s.fruits.forEach((f) => {
        f.y += f.vy;
        if (f.y + f.r > by + bh) {
          f.y = by + bh - f.r;
          f.vy = 0;
        }

        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Preview active fruit
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(s.dropX, by - 20, 16, 0, Math.PI * 2);
      ctx.fill();

      // Guide
      ctx.fillStyle = '#86efac';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isKo ? '화면을 터치해 과일을 떨어뜨리고 수박으로 머지하세요!' : 'Tap to drop fruit and merge into a watermelon!', w / 2, h * 0.88);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effectiveCardId, isKo]);

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const tx = touch.clientX - rect.left;
    const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22c55e'];
    const s = gameState.current;
    s.dropX = tx;

    s.fruits.push({
      x: tx,
      y: rect.height * 0.24,
      r: 16 + (s.nextTier * 4),
      vy: 6,
      tier: s.nextTier,
      color: colors[s.nextTier % colors.length]
    });
    s.nextTier = (s.nextTier % 4) + 1;

    if (navigator.vibrate) navigator.vibrate(20);
    setScore((prev) => {
      const next = prev + 1;
      if (next >= targetScore) handleVictory();
      return next;
    });
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        title={isKo ? '워터멜론 드롭' : 'Watermelon Drop'}
        subtitle="WATERMELON MERGE DROP"
        score={score}
        targetScore={targetScore}
        guideText={isKo ? '터치하여 과일을 떨어뜨리세요!' : 'Tap to drop!'}
        onClose={handleExit}
      />

      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onTouchStart={handleTouch}
        onMouseDown={handleTouch as any}
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

export default PokiWatermelonDropGame;
