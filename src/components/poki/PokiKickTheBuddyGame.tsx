import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKickTheBuddyGameProps {
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

export const PokiKickTheBuddyGame: React.FC<PokiKickTheBuddyGameProps> = ({
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
  const effectiveCardId = cardId || deck?.[0]?.imageIndex || deck?.[0]?.id || 46;

  const [damage, setDamage] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  const gameState = useRef({
    buddyX: 200,
    buddyY: 350,
    vx: 0,
    vy: 0,
    totalDamage: 0
  });

  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    if (playSfx) playSfx('/sfx/victory.mp3');
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokikickthebuddy',
      gameTitle: isKo ? '킥 더 버디' : 'Kick The Buddy',
      durationSeconds: 30,
      score: 1000,
      maxTargetScore: 1000,
      isVictory: true
    });
    setRewardReceipt(receipt);
    if (onReward) onReward(receipt.totalSns);
  }, [gameWon, isKo, onReward, playSfx]);

  const hitBuddy = useCallback((mx: number, my: number) => {
    const s = gameState.current;
    s.totalDamage += 5;
    setDamage(s.totalDamage);

    s.vx = (Math.random() - 0.5) * 400;
    s.vy = -300;

    if (playSfx) playSfx('/sfx/punch.mp3');
    if (navigator.vibrate) navigator.vibrate(20);

    if (s.totalDamage >= 100) {
      handleVictory();
    }
  }, [handleVictory, playSfx]);

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
      gameState.current.buddyX = canvas.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const s = gameState.current;

      if (!gameWon) {
        s.vy += 600 * dt; // Gravity
        s.buddyX += s.vx * dt;
        s.buddyY += s.vy * dt;

        // Bounce floor
        if (s.buddyY > 480) {
          s.buddyY = 480;
          s.vy = -s.vy * 0.5;
          s.vx *= 0.8;
        }

        // Bounce walls
        if (s.buddyX < 60 || s.buddyX > canvas.width - 60) {
          s.vx = -s.vx;
          s.buddyX = Math.max(60, Math.min(canvas.width - 60, s.buddyX));
        }
      }

      // Render Cardboard Box Room
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(20, 100, canvas.width - 40, canvas.height - 180);

      // Buddy Doll
      const bx = s.buddyX;
      const by = s.buddyY;

      // Head
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(bx, by - 50, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillText('x x', bx - 10, by - 48);

      // Body
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.roundRect(bx - 20, by - 26, 40, 52, 10);
      ctx.fill();

      // Damage text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`DMG: ${s.totalDamage}/100`, canvas.width / 2, 80);
      ctx.textAlign = 'left';

      // Companion Card Sprite
      drawCardSprite(ctx, effectiveCardId, 40, 120, 48, 48);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      hitBuddy(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.addEventListener('pointerdown', onPointerDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [effectiveCardId, gameWon, hitBuddy]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono">
      <MinimalistMissionHUD
        gameTitle={isKo ? '킥 더 버디' : 'Kick The Buddy'}
        currentScore={damage}
        targetScore={100}
        onBack={handleExit}
        stageInfo={`💥 Damage: ${damage}%`}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute bottom-6 inset-x-6 text-center z-20 pointer-events-none">
        <span className="inline-block bg-slate-900/80 border border-slate-700 text-white font-bold py-3 px-8 rounded-full text-base backdrop-blur-md animate-pulse">
          {isKo ? '버디를 사정없이 터치 연타하여 타격하세요!' : 'TAP RAPIDLY TO HIT THE BUDDY!'}
        </span>
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

export default PokiKickTheBuddyGame;
