import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCountWarGameProps {
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

interface Gate {
  y: number;
  leftText: string;
  leftVal: number;
  leftOp: 'add' | 'mult';
  rightText: string;
  rightVal: number;
  rightOp: 'add' | 'mult';
  passed: boolean;
}

export const PokiCountWarGame: React.FC<PokiCountWarGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 38;

  const [crowdCount, setCrowdCount] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    px: 200,
    targetX: 200,
    playerY: 480,
    speed: 180,
    count: 1,
    gates: [] as Gate[],
    bossGateY: -1600
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicountwar',
      gameTitle: isKo ? 'Count War (카운트 워)' : 'Count War',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  useEffect(() => {
    // Generate gates
    const gList: Gate[] = [
      { y: -200, leftText: '+5', leftVal: 5, leftOp: 'add', rightText: '+2', rightVal: 2, rightOp: 'add', passed: false },
      { y: -550, leftText: 'x2', leftVal: 2, leftOp: 'mult', rightText: '+10', rightVal: 10, rightOp: 'add', passed: false },
      { y: -900, leftText: '+15', leftVal: 15, leftOp: 'add', rightText: 'x3', rightVal: 3, rightOp: 'mult', passed: false },
      { y: -1250, leftText: 'x2', leftVal: 2, leftOp: 'mult', rightText: '+20', rightVal: 20, rightOp: 'add', passed: false },
    ];
    gameState.current.gates = gList;

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
        // Move target
        s.px += (s.targetX - s.px) * 12 * dt;

        // Move gates down
        for (const g of s.gates) {
          g.y += s.speed * dt;

          if (!g.passed && g.y >= s.playerY - 20) {
            g.passed = true;
            const isLeft = s.px < canvas.width / 2;
            const op = isLeft ? g.leftOp : g.rightOp;
            const val = isLeft ? g.leftVal : g.rightVal;

            if (op === 'add') s.count += val;
            else s.count *= val;

            setCrowdCount(s.count);
            if (playSfx) playSfx('/sfx/boost.mp3');
            if (navigator.vibrate) navigator.vibrate(25);
          }
        }

        s.bossGateY += s.speed * dt;
        if (s.bossGateY >= s.playerY) {
          handleVictory();
        }
      }

      // Render Track
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, 0, canvas.width - 60, canvas.height);

      // Gates
      for (const g of s.gates) {
        const half = (canvas.width - 60) / 2;
        // Left gate
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(30, g.y - 15, half, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(g.leftText, 30 + half / 2 - 10, g.y + 6);

        // Right gate
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(30 + half, g.y - 15, half, 30);
        ctx.fillStyle = '#fff';
        ctx.fillText(g.rightText, 30 + half + half / 2 - 10, g.y + 6);
      }

      // Boss Gate Castle
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(30, s.bossGateY - 40, canvas.width - 60, 80);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('BOSS CASTLE', canvas.width / 2 - 50, s.bossGateY + 6);

      // Crowd
      const displayCrowd = Math.min(30, s.count);
      for (let i = 0; i < displayCrowd; i++) {
        const ox = (i % 5 - 2) * 16;
        const oy = Math.floor(i / 5) * 16;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(s.px + ox, s.playerY + oy, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Leader Card Sprite
      drawCardSprite(ctx, effectiveCardId, s.px - 20, s.playerY - 40, 40, 40);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameState.current.targetX = e.clientX - rect.left;
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
        gameTitle={isKo ? 'Count War (카운트 워)' : 'Count War'}
        currentScore={crowdCount}
        targetScore={50}
        onBack={handleExit}
        stageInfo={`👥 Crowd: ${crowdCount}`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-4 inset-x-4 text-center text-xs text-blue-200 pointer-events-none">
        {isKo ? '화면을 좌우로 드래그하여 배수 게이트를 통과하고 대군단을 모으세요!' : 'Drag left and right to pass multiplier gates and build a giant army!'}
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

export default PokiCountWarGame;
