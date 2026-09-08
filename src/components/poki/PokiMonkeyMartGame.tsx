import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMonkeyMartGameProps {
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

export const PokiMonkeyMartGame: React.FC<PokiMonkeyMartGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 68;

  const [soldCount, setSoldCount] = useState(0);
  const [holdingBananas, setHoldingBananas] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 180,
    py: 400,
    targetX: 180,
    targetY: 400,
    holding: 0,
    shelfStock: 0,
    totalSold: 0,
    treePos: { x: 80, y: 220 },
    shelfPos: { x: 280, y: 220 },
    registerPos: { x: 200, y: 480 }
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimonkeymart',
      gameTitle: isKo ? '몽키 마트' : 'Monkey Mart',
      durationSeconds: 30,
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
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        // Move to target
        const dx = s.targetX - s.px;
        const dy = s.targetY - s.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          s.px += (dx / dist) * 190 * dt;
          s.py += (dy / dist) * 190 * dt;
        }

        // Tree harvest
        if (Math.hypot(s.px - s.treePos.x, s.py - s.treePos.y) < 50 && s.holding < 4) {
          s.holding++;
          setHoldingBananas(s.holding);
          if (navigator.vibrate) navigator.vibrate(15);
        }

        // Shelf stock & sell
        if (Math.hypot(s.px - s.shelfPos.x, s.py - s.shelfPos.y) < 50 && s.holding > 0) {
          s.totalSold += s.holding;
          s.holding = 0;
          setHoldingBananas(0);
          setSoldCount(s.totalSold);
          if (playSfx) playSfx('/sfx/coin.mp3');
          if (navigator.vibrate) navigator.vibrate([20, 20]);

          if (s.totalSold >= 8) {
            handleVictory();
          }
        }
      }

      // Render Supermarket
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor tile
      ctx.fillStyle = '#047857';
      ctx.fillRect(20, 100, canvas.width - 40, 440);

      // Banana Tree
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(s.treePos.x, s.treePos.y, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.font = '24px monospace';
      ctx.fillText('🍌', s.treePos.x - 12, s.treePos.y + 8);

      // Shelf
      ctx.fillStyle = '#b45309';
      ctx.fillRect(s.shelfPos.x - 30, s.shelfPos.y - 30, 60, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('SHELF', s.shelfPos.x - 15, s.shelfPos.y + 4);

      // Monkey Mart Owner Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 22, s.py - 22, 44, 44);

      // Banana stack over head
      if (s.holding > 0) {
        ctx.fillStyle = '#facc15';
        ctx.font = '14px monospace';
        ctx.fillText(`🍌 x${s.holding}`, s.px - 14, s.py - 30);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetX = e.clientX - rect.left;
      gameState.current.targetY = e.clientY - rect.top;
    };

    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.buttons > 0) onPointer(e);
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, [effectiveCardId, gameWon, handleVictory, playSfx]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '몽키 마트' : 'Monkey Mart'}
        currentScore={soldCount}
        targetScore={8}
        onBack={handleExit}
        stageInfo={`🍌 Sold: ${soldCount}/8 | Holding: ${holdingBananas}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-emerald-200 pointer-events-none">
        {isKo ? '바나나 나무로 가서 바나나를 딴 뒤, 진열대로 가져가 손님에게 판매하세요!' : 'Harvest bananas from the tree and restock the shelf!'}
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

export default PokiMonkeyMartGame;
